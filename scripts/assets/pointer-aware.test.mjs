// Pointer files in the existing pipeline scripts: the optimizer must skip them, the size check counts
// them by the size they claim, history shows the stored object's size, and annotations are escaped.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { classifyAssets, isPointerFile } from './changed-assets.mjs';
import { botHistory } from './history.mjs';

Object.assign(process.env, {
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
});

const here = path.dirname(fileURLToPath(import.meta.url));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pointer-aware-'));
test.after(() => fs.rmSync(root, { recursive: true, force: true }));
let counter = 0;

const sha = (char) => char.repeat(64);
function pointer(char, name, size) {
  const key = `docs/a/${name}.${sha(char).slice(0, 12)}.png`;
  return `s3-asset v1\nsha256 ${sha(char)}\nsize ${size}\nkey ${key}\n`;
}
const PNG = (n) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(n, 3)]);

function makeRepo(baseFiles, branchFiles, branchMessage = 'change') {
  const dir = path.join(root, `r${++counter}`);
  fs.mkdirSync(dir, { recursive: true });
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' }).trim();
  const write = (files) => {
    for (const [rel, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), content);
    }
  };
  git('init', '-q', '-b', 'main');
  write(baseFiles);
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  git('checkout', '-q', '-b', 'feature');
  write(branchFiles);
  git('add', '-A');
  git('commit', '-q', '-m', branchMessage);
  return { dir, git };
}

async function inRepo(dir, fn) {
  const previous = process.cwd();
  process.chdir(dir);
  try {
    return await fn();
  } finally {
    process.chdir(previous);
  }
}

const BRANCH = {
  'docs/a/real.png': PNG(1000),
  'docs/a/stored.png': pointer('a', 'stored', 3 * 1024 * 1024),
  'docs/a/small.png': pointer('b', 'small', 100),
  'docs/a/odd.png': 's3-asset v9\nnot a format this code knows\n',
};

test('the classifier keeps pointer files out of the assets to optimize and reports them apart', async () => {
  const { dir } = makeRepo({ 'README.md': 'x' }, BRANCH);
  const result = await inRepo(dir, () => classifyAssets({ base: 'main', head: 'HEAD', files: [] }));
  assert.deepEqual(result.pending.map((a) => a.file), ['docs/a/real.png']);
  assert.deepEqual(result.pointers.map((a) => a.file).sort(), ['docs/a/odd.png', 'docs/a/small.png', 'docs/a/stored.png']);
  assert.equal(await inRepo(dir, () => isPointerFile('docs/a/stored.png')), true);
  assert.equal(await inRepo(dir, () => isPointerFile('docs/a/real.png')), false);
  assert.equal(await inRepo(dir, () => isPointerFile('docs/a/missing.png')), false);
});

test('the size check counts a pointer by the size it claims, not by its few bytes', () => {
  const { dir } = makeRepo({ 'README.md': 'x' }, BRANCH);
  const report = path.join(dir, 'report.json');
  const run = spawnSync(process.execPath, [path.join(here, 'check-sizes.mjs'), '--base', 'main', '--report', report], { cwd: dir, encoding: 'utf8' });
  assert.equal(run.status, 1, run.stdout);
  const { assets } = JSON.parse(fs.readFileSync(report, 'utf8'));
  const by = Object.fromEntries(assets.map((a) => [path.basename(a.file), a]));
  assert.equal(by['stored.png'].size, 3 * 1024 * 1024);
  assert.equal(by['stored.png'].ok, false);
  assert.equal(by['stored.png'].pointer, true);
  assert.equal(by['small.png'].size, 100);
  assert.equal(by['small.png'].ok, true);
  assert.equal(by['real.png'].pointer, undefined);
  assert.ok(by['odd.png'].size < 100, 'a pointer that cannot be read counts by its own size');
});

test('a file name cannot start a workflow command through the size check annotation', () => {
  const { dir } = makeRepo({ 'README.md': 'x' }, { 'docs/a/odd%0Aname,x.png': pointer('c', 'odd', 5 * 1024 * 1024) });
  const run = spawnSync(process.execPath, [path.join(here, 'check-sizes.mjs'), '--base', 'main'], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_ACTIONS: 'true' },
  });
  const annotation = run.stdout.split('\n').find((l) => l.startsWith('::error'));
  assert.ok(annotation, run.stdout);
  assert.match(annotation, /^::error file=docs\/a\/odd%250Aname%2Cx\.png::5\.00 MB exceeds the 2\.00 MB limit$/);
});

test('a real newline and an injected command in a file name stay inside one annotation', () => {
  const evil = 'docs/a/x\n::stop-commands::abc.png';
  const { dir } = makeRepo({ 'README.md': 'x' }, { [evil]: pointer('e', 'evil', 5 * 1024 * 1024) });
  const run = spawnSync(process.execPath, [path.join(here, 'check-sizes.mjs'), '--base', 'main'], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_ACTIONS: 'true' },
  });
  const commands = run.stdout.split('\n').filter((l) => l.startsWith('::'));
  assert.equal(commands.length, 1, run.stdout);
  assert.ok(!commands.some((l) => l.startsWith('::stop-commands::')));
  assert.match(commands[0], /file=docs\/a\/x%0A%3A%3Astop-commands%3A%3Aabc\.png/);
});

test('history shows the stored object size for a file that became a pointer', async () => {
  const original = PNG(5000);
  const stored = pointer('d', 'pic', 700);
  const { dir } = makeRepo({ 'docs/a/pic.png': original }, { 'docs/a/pic.png': stored }, 'chore: optimize assets [asset-bot]');
  const { rows } = await inRepo(dir, () => botHistory({ base: 'main', head: 'HEAD' }));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].before, original.length);
  assert.equal(rows[0].after, 700, 'the object size, not the pointer text size');
});
