#!/usr/bin/env node
// Husky pre-commit step: optimizes the assets staged for this commit and lets the committer
// review each result before it is staged.
//
// For every staged asset the optimizer would shrink, the optimized file is written to the working
// tree while the index keeps the original. The committer then keeps or discards each one; kept
// files are staged, discarded ones are restored. The outcome is saved to <git dir>/asset-report,
// and commit-msg.mjs turns it into trailers so CI knows not to optimize those files again.
//
// Without a terminal (IDE commit buttons, scripts, agents) nothing is optimized and no trailer is
// written, so CI optimizes the files instead. Skip explicitly with ASSETS_PRECOMMIT=skip.

import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import ttyStreams from 'node:tty';
import { isPointerFile } from './changed-assets.mjs';
import { categoryFor, formatBytes } from './config.mjs';
import {
  blobId,
  defaultIndexPath,
  git,
  gitPath,
  repoRoot,
  treeBlobs,
} from './git.mjs';
import { readLedger, recordLedger } from './ledger.mjs';

process.chdir(repoRoot());
const reportFile = gitPath('asset-report');
const reviewDir = gitPath('asset-review');
fs.rmSync(reportFile, { force: true });
fs.rmSync(reviewDir, { recursive: true, force: true });

const notice = (message) => console.error(`assets: ${message}`);
const entries = []; // { status, blob, path } for the report

function finish(code = 0) {
  fs.rmSync(reviewDir, { recursive: true, force: true });
  if (code === 0 && entries.length)
    fs.writeFileSync(
      reportFile,
      JSON.stringify({ version: 1, entries }, null, 2),
    );
  process.exit(code);
}

if (process.env.ASSETS_PRECOMMIT === 'skip') {
  notice('skipped (ASSETS_PRECOMMIT=skip); CI will optimize new assets.');
  finish();
}
if (process.env.CI) finish();
// Concluding a merge stages assets that came from another branch; they aren't this author's.
if (fs.existsSync(gitPath('MERGE_HEAD'))) finish();
// `git commit -a` and `git commit <paths>` run hooks against a temporary index that our `git add`
// would not reach.
if (
  process.env.GIT_INDEX_FILE &&
  path.resolve(process.env.GIT_INDEX_FILE) !== defaultIndexPath()
) {
  notice(
    'partial commit (git commit -a or with paths); skipped, CI will optimize new assets.',
  );
  finish();
}

// --- Find the staged assets worth looking at.
const names = git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z')
  .split('\0')
  .filter((file) => file && categoryFor(file));
if (!names.length) finish();

const staged = new Map(); // path -> { mode, blob }
for (const entry of git('ls-files', '-s', '-z').split('\0')) {
  const match = entry.match(/^(\d+) ([0-9a-f]+) (\d)\t(.+)$/s);
  if (match && match[3] === '0')
    staged.set(match[4], { mode: match[1], blob: match[2] });
}

let headBlobs = new Set();
try {
  git('rev-parse', '-q', '--verify', 'HEAD');
  headBlobs = new Set(treeBlobs('HEAD').values());
} catch {
  // First commit: nothing in history yet.
}

// True when the working-tree file is exactly what is staged. A file deleted after `git add` is not.
function matchesIndex(file, blob) {
  try {
    return fs.lstatSync(file).isFile() && blobId(file) === blob;
  } catch {
    return false;
  }
}

const ledger = readLedger();
const work = [];
for (const file of names) {
  const info = staged.get(file);
  if (!info || info.mode === '120000') continue;
  // Moved or copied content already in history adds nothing; CI skips it too.
  if (headBlobs.has(info.blob)) continue;
  if (/[\r\n]/.test(file)) {
    notice(`${JSON.stringify(file)}: unsupported file name, skipped.`);
    continue;
  }
  if (!matchesIndex(file, info.blob)) {
    notice(
      `${file}: has unstaged changes (or was deleted), skipped. Stage it fully to optimize it.`,
    );
    continue;
  }
  // A pointer file stands in for an asset stored in the bucket: there is nothing to optimize.
  if (isPointerFile(file)) continue;
  const seen = ledger.get(info.blob);
  if (seen) entries.push({ status: seen, blob: info.blob, path: file });
  else work.push({ file, category: categoryFor(file), blob: info.blob });
}
if (!work.length) finish();

// --- Interactive review needs a terminal.
// Git gives hooks no usable stdin, so talk to the terminal directly. tty streams, not fs streams:
// a blocked fs read would keep Node from exiting.
let tty;
try {
  tty = {
    input: new ttyStreams.ReadStream(fs.openSync('/dev/tty', 'r')),
    output: new ttyStreams.WriteStream(fs.openSync('/dev/tty', 'w')),
  };
} catch {
  notice(
    `no terminal to review ${work.length} new asset(s); leaving them as is, CI will optimize them.`,
  );
  finish();
}
const say = (text = '') => tty.output.write(`${text}\n`);

let encoder;
try {
  encoder = await import('./encode.mjs');
} catch (error) {
  notice(
    `optimizer unavailable (${error.message}); run npm install. Skipping.`,
  );
  finish();
}

// --- Optimize in memory first; nothing on disk changes until we have results.
say(`assets: optimizing ${work.length} new asset(s)...`);
const candidates = [];
const noGain = [];
for (const asset of work) {
  const original = fs.readFileSync(asset.file);
  try {
    const output = await encoder.optimizeFile(asset);
    if (encoder.worthReplacing(output, original.length))
      candidates.push({ ...asset, original, output });
    else {
      entries.push({ status: 'reviewed', blob: asset.blob, path: asset.file });
      noGain.push({ blob: asset.blob, status: 'reviewed' });
    }
  } catch (error) {
    notice(
      `${asset.file}: optimization failed (${error.message.split('\n')[0]})`,
    );
    entries.push({ status: 'failed', blob: asset.blob, path: asset.file });
  }
}
encoder.cleanup();
recordLedger(noGain);
if (!candidates.length) {
  say('assets: nothing worth optimizing.');
  finish();
}

// --- Put the optimized versions in the working tree (the index keeps the originals).
fs.mkdirSync(reviewDir, { recursive: true });
candidates.forEach((c, i) => {
  c.originalCopy = path.join(
    reviewDir,
    `${i + 1}-original-${path.basename(c.file)}`,
  );
  fs.writeFileSync(c.originalCopy, c.original);
  fs.writeFileSync(c.file, c.output);
});

function restoreAll() {
  for (const c of candidates) fs.writeFileSync(c.file, c.original);
}
// Ctrl-C (or a closed terminal) during review puts everything back and aborts the commit. Once the
// decisions are being applied the hook finishes quickly, so signals are ignored from then on.
let applying = false;
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    if (applying) return;
    restoreAll();
    finish(130);
  });
}

function ask(rl, prompt) {
  return new Promise((resolve) => {
    const onClose = () => resolve(null);
    rl.once('close', onClose);
    rl.question(prompt, (answer) => {
      rl.off('close', onClose);
      resolve(answer);
    });
  });
}

function open(...files) {
  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
  for (const file of files)
    spawn(opener, [file], { detached: true, stdio: 'ignore' })
      .on('error', () =>
        say(`  could not run ${opener}; open ${file} manually.`),
      )
      .unref();
}

say();
say(
  'The optimized versions are in your working tree; your commit still has the originals.',
);
say(`Originals for comparison: ${path.relative(process.cwd(), reviewDir)}/`);
say();
const rl = readline.createInterface({
  input: tty.input,
  output: tty.output,
  terminal: false, // cooked mode: Ctrl-C stays a real SIGINT, handled above
});
const decisions = new Map(); // candidate -> 'keep' | 'discard'
let quit = false;
let keepRest = false;

for (const [i, c] of candidates.entries()) {
  if (keepRest) {
    decisions.set(c, 'keep');
    continue;
  }
  const saved = Math.round((1 - c.output.length / c.original.length) * 100);
  say(
    `[${i + 1}/${candidates.length}] ${c.file}\n    ${formatBytes(c.original.length)} -> ${formatBytes(c.output.length)} (-${saved}%)`,
  );
  for (;;) {
    const answer = await ask(
      rl,
      '    [K]eep optimized / [d]iscard / [o]pen both / keep [a]ll remaining / [q]uit commit: ',
    );
    const choice =
      answer === null ? 'q' : answer.trim().toLowerCase()[0] || 'k';
    if (choice === 'o') open(c.originalCopy, c.file);
    else if (choice === 'k' || choice === 'd')
      decisions.set(c, choice === 'k' ? 'keep' : 'discard');
    else if (choice === 'a') {
      decisions.set(c, 'keep');
      keepRest = true;
    } else if (choice === 'q') quit = true;
    else {
      say('    Please answer k, d, o, a or q.');
      continue;
    }
    if (choice !== 'o') break;
  }
  if (quit) break;
}
rl.close();
tty.input.destroy();

if (quit) {
  restoreAll();
  say('assets: commit aborted; your assets were left as they were staged.');
  tty.output.end();
  finish(1);
}

// --- Apply the decisions.
// Let a signal that arrived together with the last answer (Ctrl-C then Enter) run its handler first.
await new Promise((resolve) => setTimeout(resolve, 100));
applying = true;
const kept = [];
const record = [];
for (const c of candidates) {
  if (decisions.get(c) === 'keep') {
    kept.push(c);
  } else {
    fs.writeFileSync(c.file, c.original);
    entries.push({ status: 'reviewed', blob: c.blob, path: c.file });
    record.push({ blob: c.blob, status: 'reviewed' });
  }
}
if (kept.length) {
  try {
    execFileSync('git', ['add', '--', ...kept.map((c) => c.file)], {
      env: { ...process.env, GIT_LITERAL_PATHSPECS: '1' },
    });
  } catch (error) {
    restoreAll();
    notice(`could not stage the optimized assets (${error.message})`);
    finish(1);
  }
  for (const c of kept) {
    const blob = blobId(c.file);
    entries.push({ status: 'optimized', blob, path: c.file });
    record.push({ blob, status: 'optimized' });
  }
}
recordLedger(record);

const savedBytes = kept.reduce(
  (sum, c) => sum + c.original.length - c.output.length,
  0,
);
say(
  `assets: kept ${kept.length}, discarded ${candidates.length - kept.length} (${formatBytes(savedBytes)} saved).`,
);
tty.output.end();
finish();
