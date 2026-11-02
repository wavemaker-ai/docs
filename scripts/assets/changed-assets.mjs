import fs from 'node:fs';
import { createRequire } from 'node:module';
import { categoryFor } from './config.mjs';
import { git, treeBlobs } from './git.mjs';
import { processedBlobs } from './trailers.mjs';

const { looksLikePointer, readHead } = createRequire(import.meta.url)('./pointer.cjs');

// The branch the current branch most likely forks from, for `npm run check-assets` without --base:
// among the remote `release`, `docs` and `main`, the one with the fewest commits that HEAD does not
// share with it (ties go in that order). CI always passes --base, so this is for local runs only.
export function defaultBase() {
  let best = null;
  for (const ref of ['origin/release', 'origin/docs', 'origin/main']) {
    try {
      git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
      const ahead = Number(git('rev-list', '--count', `${ref}..HEAD`).trim());
      if (best === null || ahead < best.ahead) best = { ref, ahead };
    } catch {
      // That remote branch does not exist here.
    }
  }
  return best?.ref ?? 'origin/main';
}

export function parseArgs(argv) {
  const args = { base: undefined, head: 'HEAD', files: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-r' || arg === '--recursive') args.recursive = true;
    else if (arg === '--local') args.local = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--trailers-from') args.trailersFrom = argv[++i];
    // JSON array of file names or paths: only changed assets matching one of them are processed.
    else if (arg === '--only-json') args.only = parseOnly(argv[++i]);
    else if (arg.startsWith('--')) args[arg.slice(2)] = argv[++i];
    else args.files.push(arg);
  }
  args.base ??= defaultBase();
  return args;
}

function parseOnly(json) {
  const list = JSON.parse(json || '[]');
  if (!Array.isArray(list) || list.some((item) => typeof item !== 'string'))
    throw new Error('--only-json expects a JSON array of strings');
  return list;
}

// A name or path selects a file when it is the whole path or its trailing part, so
// "demo.mp4" and "vids/demo.mp4" both match "docs/x/assets/vids/demo.mp4".
function selects(only, file) {
  return only.some((item) => {
    const name = item.replace(/^\.?\//, '');
    return name && (file === name || file.endsWith(`/${name}`));
  });
}

// Asset files whose content is new between the merge base of `base` and `head`, split into
//   pending: still to optimize
//   covered: skipped because a commit in `trailersFrom..head` says the pre-commit hook already
//            optimized or reviewed exactly this content (see trailers.mjs)
//   retried: pending files the hook reported as failed
// Moved or copied files whose blob already exists at the merge base are skipped: they add nothing
// to history, and re-encoding them would add a second blob.
//
// `force` ignores the trailers, so assets the contributor kept as is are pending too. `only`
// (names or paths) limits the result to the matching assets; it is how a maintainer asks for one
// file to be optimized again.
export function classifyAssets({
  base,
  head,
  files,
  trailersFrom,
  force,
  only,
}) {
  if (files.length)
    return { pending: toAssets(files), covered: [], retried: 0, pointers: [] };

  const mergeBase = git('merge-base', base, head).trim();
  const existing = new Set(treeBlobs(mergeBase).values());
  const headBlobs = treeBlobs(head);
  const paths = git(
    'diff',
    '--name-only',
    '--diff-filter=ACMR',
    '-z',
    `${mergeBase}..${head}`,
  )
    .split('\0')
    .filter((file) => file && !existing.has(headBlobs.get(file)));
  // Pointer files (assets already stored in the bucket) are never optimized, but the size check
  // still needs them, so they come back separately.
  const { assets: found, pointers } = splitAssets(paths);
  const assets = found.filter(
    ({ file }) => !only?.length || selects(only, file),
  );
  if (!trailersFrom || force)
    return { pending: assets, covered: [], retried: 0, pointers };

  const { done, failed } = processedBlobs(`${trailersFrom}..${head}`);
  const pending = [];
  const covered = [];
  let retried = 0;
  for (const asset of assets) {
    const blob = headBlobs.get(asset.file);
    if (done.has(blob)) covered.push(asset);
    else {
      pending.push(asset);
      if (failed.has(blob)) retried++;
    }
  }
  return { pending, covered, retried, pointers };
}

// Assets to process: everything changed on the branch, minus those covered by trailers.
export function changedAssets(args) {
  return classifyAssets(args).pending;
}

// Asset files in the current directory (and below, with `recursive`), skipping anything
// .gitignore excludes. Includes untracked files.
export function localAssets({ recursive }) {
  const paths = git(
    'ls-files',
    '-z',
    '--cached',
    '--others',
    '--exclude-standard',
  )
    .split('\0')
    .filter((file) => file && (recursive || !file.includes('/')));
  return toAssets([...new Set(paths)]);
}

// A regular file that starts like a pointer: a stand-in for an asset that lives in the bucket.
export function isPointerFile(file) {
  try {
    return fs.lstatSync(file).isFile() && looksLikePointer(readHead(file));
  } catch {
    return false;
  }
}

// Symlinks are skipped so a PR can't point the optimizer at files outside the checkout.
function candidates(paths) {
  return paths
    .map((file) => ({ file, category: categoryFor(file) }))
    .filter(
      ({ file, category }) =>
        category && fs.existsSync(file) && fs.lstatSync(file).isFile(),
    );
}

function splitAssets(paths) {
  const assets = [];
  const pointers = [];
  for (const asset of candidates(paths))
    (isPointerFile(asset.file) ? pointers : assets).push(asset);
  return { assets, pointers };
}

// Real assets only: a pointer has nothing to optimize.
function toAssets(paths) {
  return splitAssets(paths).assets;
}
