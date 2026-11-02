#!/usr/bin/env node
// Husky commit-msg step: records the pre-commit hook's asset report in the commit message as
// trailers (see trailers.mjs), so CI skips files that were already optimized or reviewed.
//
// Usage: node scripts/assets/commit-msg.mjs <commit message file>
//
// An entry is written only if its blob id still matches what is staged, so a report left over from
// an aborted commit can't vouch for different content. On `--amend`, trailers already in the message
// are kept while they still match the index, and replaced when the report covers the same path.
// `git commit --amend -m` starts from a new message, and git doesn't tell hooks it is an amend, so
// HEAD's own trailers are carried over for the files HEAD changed that this commit leaves as they are.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { gitLiteral, gitPath, gitWith, repoRoot } from './git.mjs';
import { formatTrailer, parseTrailerLine } from './trailers.mjs';

const messageFile = path.resolve(process.argv[2] ?? '');
process.chdir(repoRoot());
const reportFile = gitPath('asset-report');

let report = [];
try {
  report = JSON.parse(fs.readFileSync(reportFile, 'utf8')).entries ?? [];
} catch {
  // No report: nothing new to record, but stale trailers may still need clearing below.
}
// Consumed. If this commit fails later, the next pre-commit run rebuilds it (cheaply, from the ledger).
fs.rmSync(reportFile, { force: true });

const message = fs.readFileSync(messageFile, 'utf8');
const lines = message.split('\n');
const existing = lines.map(parseTrailerLine).filter(Boolean);
const headTrailers = readHeadTrailers();
if (!report.length && !existing.length && !headTrailers.length) process.exit(0);

const paths = [
  ...new Set([...report, ...existing, ...headTrailers].map((e) => e.path)),
];
const stagedBlobs = new Map();
if (paths.length) {
  for (const entry of gitLiteral('ls-files', '-s', '-z', '--', ...paths).split(
    '\0',
  )) {
    const match = entry.match(/^\d+ ([0-9a-f]+) 0\t(.+)$/s);
    if (match) stagedBlobs.set(match[2], match[1]);
  }
}

const fresh = report.filter((e) => stagedBlobs.get(e.path) === e.blob);
const freshPaths = new Set(fresh.map((e) => e.path));
const kept = lines.filter((line) => {
  const trailer = parseTrailerLine(line);
  if (!trailer) return true;
  return (
    !freshPaths.has(trailer.path) &&
    stagedBlobs.get(trailer.path) === trailer.blob
  );
});
if (kept.length !== lines.length)
  fs.writeFileSync(messageFile, kept.join('\n'));

const present = new Set(
  kept
    .map(parseTrailerLine)
    .filter(Boolean)
    .map((t) => `${t.blob} ${t.path}`),
);
const carried = headTrailers.filter(
  (t) =>
    stagedBlobs.get(t.path) === t.blob &&
    !freshPaths.has(t.path) &&
    !present.has(`${t.blob} ${t.path}`),
);

if (fresh.length || carried.length) {
  // interpret-trailers finds the trailer block and ignores the editor's comment and scissors lines.
  execFileSync('git', [
    'interpret-trailers',
    '--in-place',
    '--if-exists',
    'add',
    ...[...fresh, ...carried].flatMap((entry) => [
      '--trailer',
      formatTrailer(entry),
    ]),
    messageFile,
  ]);
  if (fresh.length)
    console.error(
      `assets: recorded ${fresh.length} asset result(s) in the commit message.`,
    );
}

// Trailers in HEAD's message for files HEAD itself added or changed. Only those qualify, so a normal
// commit copies the previous commit's trailers once at most, and never keeps copying them forward.
function readHeadTrailers() {
  try {
    gitWith({ stdio: 'ignore' }, 'rev-parse', '-q', '--verify', 'HEAD');
  } catch {
    return [];
  }
  const changed = new Set(
    gitLiteral(
      'diff-tree',
      '--no-commit-id',
      '--name-only',
      '-r',
      '-z',
      '--root',
      'HEAD',
    )
      .split('\0')
      .filter(Boolean),
  );
  return gitLiteral('log', '-1', '--format=%B', 'HEAD')
    .split('\n')
    .map(parseTrailerLine)
    .filter((t) => t && changed.has(t.path));
}
