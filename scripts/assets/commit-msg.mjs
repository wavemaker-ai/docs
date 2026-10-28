#!/usr/bin/env node
// Husky commit-msg step: records the pre-commit hook's asset report in the commit message as
// trailers (see trailers.mjs), so CI skips files that were already optimized or reviewed.
//
// Usage: node scripts/assets/commit-msg.mjs <commit message file>
//
// An entry is written only if its blob id still matches what is staged, so a report left over from
// an aborted commit can't vouch for different content. On `--amend`, trailers already in the message
// are kept while they still match the index, and replaced when the report covers the same path.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { gitLiteral, gitPath, repoRoot } from './git.mjs';
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
if (!report.length && !existing.length) process.exit(0);

const paths = [...new Set([...report, ...existing].map((e) => e.path))];
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

if (fresh.length) {
  // interpret-trailers finds the trailer block and ignores the editor's comment and scissors lines.
  execFileSync('git', [
    'interpret-trailers',
    '--in-place',
    '--if-exists',
    'add',
    ...fresh.flatMap((entry) => ['--trailer', formatTrailer(entry)]),
    messageFile,
  ]);
  console.error(
    `assets: recorded ${fresh.length} asset result(s) in the commit message.`,
  );
}
