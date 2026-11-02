import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { defaultBase } from './changed-assets.mjs';
import { isAnimatedPng } from './png.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'png-test-'));
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// Chunk contents are irrelevant to the scan, so the CRC is left as zeros.
const chunk = (type, data = Buffer.alloc(0)) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  return Buffer.concat([length, Buffer.from(type, 'latin1'), data, Buffer.alloc(4)]);
};
const write = (name, ...chunks) => {
  const file = path.join(dir, name);
  fs.writeFileSync(file, Buffer.concat([SIGNATURE, ...chunks]));
  return file;
};
const ihdr = chunk('IHDR', Buffer.alloc(13));

test('a PNG with an acTL chunk is animated', () => {
  const file = write('anim.png', ihdr, chunk('acTL', Buffer.alloc(8)), chunk('IDAT', Buffer.alloc(10)), chunk('IEND'));
  assert.equal(isAnimatedPng(file), true);
});

test('a still PNG is not, even if acTL-like bytes appear later in the data', () => {
  const still = write('still.png', ihdr, chunk('PLTE', Buffer.alloc(30)), chunk('IDAT', Buffer.from('acTLacTLacTL')), chunk('IEND'));
  assert.equal(isAnimatedPng(still), false);
  const late = write('late.png', ihdr, chunk('IDAT', Buffer.alloc(10)), chunk('acTL', Buffer.alloc(8)), chunk('IEND'));
  assert.equal(isAnimatedPng(late), false);
});

test('files that are not PNGs, are empty or are missing are not animated', () => {
  const text = path.join(dir, 'text.png');
  fs.writeFileSync(text, 'not a png at all');
  const empty = path.join(dir, 'empty.png');
  fs.writeFileSync(empty, '');
  const truncated = path.join(dir, 'truncated.png');
  fs.writeFileSync(truncated, Buffer.concat([SIGNATURE, Buffer.from([0, 0, 0])]));
  assert.equal(isAnimatedPng(text), false);
  assert.equal(isAnimatedPng(empty), false);
  assert.equal(isAnimatedPng(truncated), false);
  assert.equal(isAnimatedPng(path.join(dir, 'missing.png')), false);
});

test('a huge chunk length cannot make the scan read past the file or loop', () => {
  const file = write('huge.png', ihdr, chunk('tEXt', Buffer.alloc(5)));
  const bytes = fs.readFileSync(file);
  // Claim the tEXt chunk is 4 GB long: the next read lands past the end and the scan stops.
  bytes.writeUInt32BE(0xffffffff, SIGNATURE.length + ihdr.length);
  fs.writeFileSync(file, bytes);
  assert.equal(isAnimatedPng(file), false);
});

// --- defaultBase: the branch `npm run check-assets` compares against when --base is not given ---
function repo() {
  const repoDir = fs.mkdtempSync(path.join(dir, 'repo-'));
  const git = (...a) => execFileSync('git', a, { cwd: repoDir, encoding: 'utf8' }).trim();
  git('init', '-q');
  git('config', 'user.email', 't@example.com');
  git('config', 'user.name', 't');
  const commit = (message) => {
    fs.writeFileSync(path.join(repoDir, 'f.txt'), message);
    git('add', '-A');
    git('commit', '-q', '-m', message);
    return git('rev-parse', 'HEAD');
  };
  return { repoDir, git, commit };
}

function inRepo(repoDir, fn) {
  const cwd = process.cwd();
  process.chdir(repoDir);
  try {
    return fn();
  } finally {
    process.chdir(cwd);
  }
}

test('defaultBase picks the nearest collection branch, not always main', () => {
  const { repoDir, git, commit } = repo();
  const base = commit('base');
  const docs = commit('docs work');
  git('update-ref', 'refs/remotes/origin/main', base);
  git('update-ref', 'refs/remotes/origin/release', base);
  git('update-ref', 'refs/remotes/origin/docs', docs);
  commit('my change');
  assert.equal(inRepo(repoDir, defaultBase), 'origin/docs');
});

test('defaultBase falls back to origin/main without any remote branches or outside a repo', () => {
  const { repoDir, commit } = repo();
  commit('only commit');
  assert.equal(inRepo(repoDir, defaultBase), 'origin/main');
  assert.equal(inRepo(dir, defaultBase), 'origin/main');
});
