import fs from 'node:fs';
import { categoryFor } from './config.mjs';
import { git, treeBlobs } from './git.mjs';
import { processedBlobs } from './trailers.mjs';

export function parseArgs(argv) {
  const args = { base: 'origin/main', head: 'HEAD', files: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-r' || arg === '--recursive') args.recursive = true;
    else if (arg === '--local') args.local = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--trailers-from') args.trailersFrom = argv[++i];
    else if (arg.startsWith('--')) args[arg.slice(2)] = argv[++i];
    else args.files.push(arg);
  }
  return args;
}

// Asset files whose content is new between the merge base of `base` and `head`, split into
//   pending: still to optimize
//   covered: skipped because a commit in `trailersFrom..head` says the pre-commit hook already
//            optimized or reviewed exactly this content (see trailers.mjs)
//   retried: pending files the hook reported as failed
// Moved or copied files whose blob already exists at the merge base are skipped: they add nothing
// to history, and re-encoding them would add a second blob.
export function classifyAssets({ base, head, files, trailersFrom }) {
  if (files.length)
    return { pending: toAssets(files), covered: [], retried: 0 };

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
  const assets = toAssets(paths);
  if (!trailersFrom) return { pending: assets, covered: [], retried: 0 };

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
  return { pending, covered, retried };
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

// Symlinks are skipped so a PR can't point the optimizer at files outside the checkout.
function toAssets(paths) {
  return paths
    .map((file) => ({ file, category: categoryFor(file) }))
    .filter(
      ({ file, category }) =>
        category && fs.existsSync(file) && fs.lstatSync(file).isFile(),
    );
}
