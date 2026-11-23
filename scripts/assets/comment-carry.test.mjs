// Run: node --test scripts/assets/comment-carry.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { keptRows } from './comment-carry.mjs';

const MB = 1048576;
const fmt = (b) => (b >= MB ? `${(b / MB).toFixed(2)} MB` : `${Math.round(b / 1024)} KB`);
const VIDEO = 'docs/a/assets/vids/demo.mp4';
const IMAGE = 'docs/a/assets/img/pic.png';
const table = (...rows) => `#### Optimization\n\n| File | Before | After |\n|---|---:|---|\n${rows.join('\n')}\n`;
const run = (previous, assets, shown = new Set()) => keptRows({ previous, assets, shown, formatSize: fmt });

test('a kept row survives while the file is unchanged', () => {
  const previous = table(`| \`${VIDEO}\` | 14.81 MB | 14.81 MB (already optimized) |`);
  const rows = run(previous, [{ file: VIDEO, size: 15528383 }]);
  assert.deepEqual(rows, [{ file: VIDEO, size: 15528383, note: 'already optimized' }]);
});

test('other notes the workflow writes are kept as they are', () => {
  const previous = table(`| \`${IMAGE}\` | 20 KB | 20 KB (animated PNG, left unchanged) |`);
  assert.equal(run(previous, [{ file: IMAGE, size: 20 * 1024 }])[0].note, 'animated PNG, left unchanged');
});

test('a row an earlier version wrote for a pure pointer swap ("−0%") becomes a kept row', () => {
  const previous = table(`| \`${VIDEO}\` | [14.81 MB](https://github.com/o/r/blob/abc/demo.mp4) | 14.81 MB (−0%) |`);
  assert.equal(run(previous, [{ file: VIDEO, size: 15528383 }])[0].note, 'already optimized');
});

test('an optimized row ("−36%") is never carried: those come from git', () => {
  const previous = table(`| \`${IMAGE}\` | 121 KB | 77 KB (−36%) |`);
  assert.deepEqual(run(previous, [{ file: IMAGE, size: 77 * 1024 }]), []);
});

test('a file that changed size since is dropped', () => {
  const previous = table(`| \`${VIDEO}\` | 14.81 MB | 14.81 MB (already optimized) |`);
  assert.deepEqual(run(previous, [{ file: VIDEO, size: 9 * MB }]), []);
});

test('a file that is no longer a changed asset of the PR is dropped', () => {
  const previous = table(`| \`${VIDEO}\` | 14.81 MB | 14.81 MB (already optimized) |`);
  assert.deepEqual(run(previous, [{ file: IMAGE, size: 15528383 }]), []);
});

test('a file that already has a row is not listed twice', () => {
  const previous = table(`| \`${VIDEO}\` | 14.81 MB | 14.81 MB (already optimized) |`);
  assert.deepEqual(run(previous, [{ file: VIDEO, size: 15528383 }], new Set([VIDEO])), []);
});

test('failed rows, escaped file names, markup in notes and other shapes are ignored', () => {
  const assets = [VIDEO, IMAGE, 'docs/a/x|y.png'].map((file) => ({ file, size: 15528383 }));
  const previous = table(
    `| \`${VIDEO}\` | 14.81 MB | ⚠️ failed<br><code>boom</code> |`,
    `| <code>docs/a/x&#124;y.png</code> | 14.81 MB | 14.81 MB (already optimized) |`,
    `| \`${IMAGE}\` | 14.81 MB | 14.81 MB (<b>hi</b>) |`,
    `| \`${IMAGE}\` | 14.81 MB | 14.81 MB (see [link](https://evil.example)) |`,
    'not a row',
  );
  assert.deepEqual(run(previous, assets), []);
});

test('no previous comment, or no table in it: nothing to carry', () => {
  assert.deepEqual(run('', [{ file: VIDEO, size: 1 }]), []);
  assert.deepEqual(run(undefined, undefined), []);
  assert.deepEqual(run('No new or changed assets to optimize.\n', [{ file: VIDEO, size: 1 }]), []);
});
