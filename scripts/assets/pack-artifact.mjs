#!/usr/bin/env node
// Decode-job helper: packs what the optimizer changed into a folder the job uploads as an artifact.
// The publish job treats everything in it as untrusted and re-checks it (see apply-artifact.mjs).
//
// Usage (inside the PR checkout, after optimize.mjs ran):
//   node pack-artifact.mjs --out <dir> --head-sha <sha> [--report <optimize.json>] [--dimensions <json>]
// Always writes <dir>/manifest.json, even when nothing changed, so the publish job can tell "nothing
// to apply" from "the artifact is missing". Files go to <dir>/files/<repo path>.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { git } from './git.mjs';

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
if (!args.out || !args['head-sha']) {
  console.error(
    'Usage: pack-artifact.mjs --out <dir> --head-sha <sha> [--report <optimize.json>] [--dimensions <json>]',
  );
  process.exit(2);
}

// optimize.mjs rewrites tracked files in place, so modified tracked files are exactly its output.
const changed = git('diff', '--name-only', '--diff-filter=M', '-z')
  .split('\0')
  .filter(Boolean);

fs.mkdirSync(path.join(args.out, 'files'), { recursive: true });
const files = [];
for (const file of changed) {
  if (!fs.lstatSync(file).isFile()) continue;
  const content = fs.readFileSync(file);
  const dest = path.join(args.out, 'files', file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  files.push({
    path: file,
    sha256: crypto.createHash('sha256').update(content).digest('hex'),
    size: content.length,
  });
}

let results = [];
if (args.report && fs.existsSync(args.report)) {
  try {
    results = JSON.parse(fs.readFileSync(args.report, 'utf8'));
  } catch {
    results = [];
  }
}

// Image sizes measured by measure-dimensions.mjs, keyed by the file's sha256. Plain data: the publish
// job validates every entry before it uses one.
let dimensions = {};
if (args.dimensions && fs.existsSync(args.dimensions)) {
  try {
    dimensions = JSON.parse(fs.readFileSync(args.dimensions, 'utf8'));
  } catch {
    dimensions = {};
  }
}

fs.writeFileSync(
  path.join(args.out, 'manifest.json'),
  JSON.stringify({ version: 1, head_sha: args['head-sha'], files, results, dimensions }, null, 2),
);
console.log(`${files.length} optimized file(s) packed into ${args.out}.`);
