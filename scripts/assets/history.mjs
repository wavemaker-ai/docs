#!/usr/bin/env node
// CI helper: rebuilds the optimization table of the PR comment from git, so it never depends on
// what an earlier comment said. For every file the bot optimized in this PR it reports the copy the
// author last added ("before") against the optimized copy the PR holds now ("after").
//
// Usage: node scripts/assets/history.mjs --base <ref> [--head <ref>] --report <out.json>
// Run it inside the PR checkout, after the bot has committed. It reads only git metadata and blob
// sizes and decodes nothing.
//
// Bot commits are the single-parent commits in `base..head` whose message contains `[asset-bot]`
// and that only modify supported asset files in place. The marker is free text, so these checks
// bound what a forged commit can do: show a row with the file's real sizes.
//
//   - A bot commit whose parent still holds the previous bot commit's output extends that file's
//     entry: "before" stays the original, "after" becomes the latest.
//   - Any other parent means the author changed the file in between, so the entry starts over.
//   - An entry is kept only while the file at `head` is exactly what the bot left, so a row never
//     describes a file that has changed since.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import { categoryFor } from './config.mjs';
import { git } from './git.mjs';
import { parseArgs } from './changed-assets.mjs';

const { looksLikePointer, parsePointer } = createRequire(import.meta.url)('./pointer.cjs');

const MARKER = '[asset-bot]';
const REGULAR_MODES = new Set(['100644', '100755']);

// What a bot commit did to each file: [{ file, oldBlob, newBlob }], or null when it is not a
// bot-shaped commit (anything but in-place modifications of supported assets).
function botChanges(parent, commit) {
  const fields = git(
    'diff',
    '--raw',
    '-z',
    '--no-renames',
    '--no-abbrev',
    parent,
    commit,
  ).split('\0');
  const changes = [];
  for (let i = 0; i + 1 < fields.length; i += 2) {
    const match = /^:(\d+) (\d+) ([0-9a-f]+) ([0-9a-f]+) (\w)$/.exec(fields[i]);
    if (!match) continue;
    const [, oldMode, newMode, oldBlob, newBlob, status] = match;
    const file = fields[i + 1];
    if (
      status !== 'M' ||
      !REGULAR_MODES.has(oldMode) ||
      !REGULAR_MODES.has(newMode) ||
      !categoryFor(file)
    )
      return null;
    changes.push({ file, oldBlob, newBlob });
  }
  return changes.length ? changes : null;
}

// A file's size. For a pointer file it is the size of the object it stands for, so the comment shows
// what the optimized asset weighs, not the few lines of text that replaced it in the repository.
function blobSize(blob) {
  const size = Number(git('cat-file', '-s', blob).trim());
  if (size > 1024) return size;
  const text = git('cat-file', 'blob', blob);
  if (looksLikePointer(text)) {
    try {
      return parsePointer(text, blob).size;
    } catch {
      // A malformed pointer counts by its own size; the pointer check reports it.
    }
  }
  return size;
}

function blobAt(rev, file) {
  try {
    return git('rev-parse', '--verify', '--quiet', `${rev}:${file}`).trim();
  } catch {
    return null;
  }
}

export function botHistory({ base, head = 'HEAD' }) {
  const commits = git(
    'log',
    '--reverse',
    '--format=%H %P',
    '-F',
    `--grep=${MARKER}`,
    `${base}..${head}`,
  )
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split(' '));

  const entries = new Map();
  for (const [commit, ...parents] of commits) {
    if (parents.length !== 1) continue;
    const [parent] = parents;
    const changes = botChanges(parent, commit);
    if (!changes) continue;
    for (const { file, oldBlob, newBlob } of changes) {
      const entry = entries.get(file);
      if (entry?.afterBlob === oldBlob) {
        entry.afterBlob = newBlob;
        entry.after = blobSize(newBlob);
        entry.commits.push(commit);
      } else {
        entries.set(file, {
          file,
          before: blobSize(oldBlob),
          original: parent,
          afterBlob: newBlob,
          after: blobSize(newBlob),
          commits: [commit],
        });
      }
    }
  }

  const rows = [];
  for (const { afterBlob, ...row } of entries.values()) {
    if (afterBlob === blobAt(head, row.file)) rows.push(row);
  }
  return { rows };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.report) {
    console.error(
      'Usage: history.mjs --base <ref> [--head <ref>] --report <out.json>',
    );
    process.exit(2);
  }
  const history = botHistory(args);
  fs.writeFileSync(args.report, JSON.stringify(history, null, 2));
  console.log(
    `${history.rows.length} optimized asset(s) in this PR's bot commits.`,
  );
}
