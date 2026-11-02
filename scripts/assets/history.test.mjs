// Run: npm run test:assets-history
// Each test builds a throwaway git repo: `main` holds the base, `pr` the PR's commits.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { botHistory } from './history.mjs';

// The helpers shell out to git in the current directory, so keep the user's own git config out.
Object.assign(process.env, {
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
});

const BOT = 'chore: optimize assets [asset-bot]';
const VIDEO = 'docs/a/assets/vids/demo.mp4';
const IMAGE = 'docs/a/assets/img/pic.png';
const bytes = (size, fill) => Buffer.alloc(size, fill);

const dirs = [];
test.after(() =>
  dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })),
);

function createRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-history-'));
  dirs.push(dir);
  const sh = (...args) =>
    execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  sh('init', '-q', '-b', 'main');
  const repo = {
    dir,
    sh,
    // Writes files (null deletes), commits everything, and returns the new commit's id.
    commit(message, files = {}) {
      for (const [file, content] of Object.entries(files)) {
        const full = path.join(dir, file);
        if (content === null) fs.rmSync(full, { force: true });
        else {
          fs.mkdirSync(path.dirname(full), { recursive: true });
          fs.writeFileSync(full, content);
        }
      }
      sh('add', '-A');
      sh('commit', '-q', '--allow-empty', '-m', message);
      return sh('rev-parse', 'HEAD');
    },
    bot: (files) => repo.commit(BOT, files),
    history(base = 'main', head = 'HEAD') {
      const previous = process.cwd();
      process.chdir(dir);
      try {
        return botHistory({ base, head });
      } finally {
        process.chdir(previous);
      }
    },
  };
  // Base branch with one video and one image, then a PR branch off it.
  repo.commit('base', {
    'README.md': 'x',
    [VIDEO]: bytes(1000, 1),
    [IMAGE]: bytes(900, 1),
  });
  sh('checkout', '-q', '-b', 'pr');
  return repo;
}

const sizes = (row) => [row.before, row.after];

test('no bot commits: nothing to report', () => {
  const repo = createRepo();
  repo.commit('add a video', { [VIDEO]: bytes(17000, 2) });
  assert.deepEqual(repo.history().rows, []);
});

test('no commits at all on the branch', () => {
  assert.deepEqual(createRepo().history().rows, []);
});

test('one bot commit: sizes, original and commit of each optimized file', () => {
  const repo = createRepo();
  const author = repo.commit('add assets', {
    [VIDEO]: bytes(17000, 2),
    [IMAGE]: bytes(3000, 2),
    'docs/a/assets/img/other.png': bytes(500, 2),
  });
  const bot = repo.bot({ [VIDEO]: bytes(1500, 3), [IMAGE]: bytes(700, 3) });
  const { rows } = repo.history();
  // Within one commit, files come in path order (img/ before vids/).
  assert.deepEqual(
    rows.map((r) => r.file),
    [IMAGE, VIDEO],
  );
  assert.deepEqual(sizes(rows[0]), [3000, 700]);
  assert.deepEqual(sizes(rows[1]), [17000, 1500]);
  assert.equal(rows[1].original, author);
  assert.deepEqual(rows[1].commits, [bot]);
});

test('files the bot did not touch are not listed', () => {
  const repo = createRepo();
  repo.commit('add assets', {
    [VIDEO]: bytes(17000, 2),
    [IMAGE]: bytes(3000, 2),
  });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  assert.deepEqual(
    repo.history().rows.map((r) => r.file),
    [VIDEO],
  );
});

test('original -> optimized -> author replaces it -> optimized again: author copy vs new optimized copy', () => {
  const repo = createRepo();
  repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  const replacement = repo.commit('author replaces the video', {
    [VIDEO]: bytes(12000, 4),
  });
  const second = repo.bot({ [VIDEO]: bytes(1200, 5) });
  const { rows } = repo.history();
  assert.equal(rows.length, 1);
  assert.deepEqual(sizes(rows[0]), [12000, 1200]);
  assert.equal(rows[0].original, replacement);
  assert.deepEqual(rows[0].commits, [second]);
});

test('optimized twice with no author change between: original vs the latest', () => {
  const repo = createRepo();
  const author = repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  const first = repo.bot({ [VIDEO]: bytes(1500, 3) });
  const second = repo.bot({ [VIDEO]: bytes(1300, 4) });
  const { rows } = repo.history();
  assert.deepEqual(sizes(rows[0]), [17000, 1300]);
  assert.equal(rows[0].original, author);
  assert.deepEqual(rows[0].commits, [first, second]);
});

test('an unrelated author commit between two bot commits does not break the chain', () => {
  const repo = createRepo();
  repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  repo.commit('edit the docs page', { 'docs/a/page.mdx': 'text' });
  repo.bot({ [VIDEO]: bytes(1300, 4) });
  assert.deepEqual(sizes(repo.history().rows[0]), [17000, 1300]);
});

test('author changed the file after the bot: the row is dropped, others stay', () => {
  const repo = createRepo();
  repo.commit('add assets', {
    [VIDEO]: bytes(17000, 2),
    [IMAGE]: bytes(3000, 2),
  });
  repo.bot({ [VIDEO]: bytes(1500, 3), [IMAGE]: bytes(700, 3) });
  repo.commit('author edits the video again', { [VIDEO]: bytes(9000, 9) });
  assert.deepEqual(
    repo.history().rows.map((r) => r.file),
    [IMAGE],
  );
});

test('file deleted after the bot: dropped', () => {
  const repo = createRepo();
  repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  repo.commit('remove it', { [VIDEO]: null });
  assert.deepEqual(repo.history().rows, []);
});

test('file renamed after the bot: the old path is gone, so no row', () => {
  const repo = createRepo();
  repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  repo.sh('mv', VIDEO, 'docs/a/assets/vids/renamed.mp4');
  repo.commit('rename');
  assert.deepEqual(repo.history().rows, []);
});

test('file changed and then restored to the bot output exactly: the row is shown again', () => {
  const repo = createRepo();
  repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  repo.commit('experiment', { [VIDEO]: bytes(9000, 9) });
  assert.deepEqual(repo.history().rows, []);
  repo.commit('back to the optimized copy', { [VIDEO]: bytes(1500, 3) });
  assert.deepEqual(sizes(repo.history().rows[0]), [17000, 1500]);
});

test('restored to the bot output, then optimized again: counts as the same chain', () => {
  const repo = createRepo();
  const author = repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  repo.commit('experiment', { [VIDEO]: bytes(9000, 9) });
  repo.commit('back to the optimized copy', { [VIDEO]: bytes(1500, 3) });
  const second = repo.bot({ [VIDEO]: bytes(1300, 4) });
  const { rows } = repo.history();
  assert.deepEqual(sizes(rows[0]), [17000, 1300]);
  assert.equal(rows[0].original, author);
  assert.equal(rows[0].commits.at(-1), second);
});

test('two files restart independently', () => {
  const repo = createRepo();
  repo.commit('add assets', {
    [VIDEO]: bytes(17000, 2),
    [IMAGE]: bytes(3000, 2),
  });
  repo.bot({ [VIDEO]: bytes(1500, 3), [IMAGE]: bytes(700, 3) });
  repo.commit('author replaces only the image', { [IMAGE]: bytes(4000, 7) });
  repo.bot({ [IMAGE]: bytes(800, 8) });
  const byFile = Object.fromEntries(
    repo.history().rows.map((r) => [r.file, sizes(r)]),
  );
  assert.deepEqual(byFile, { [VIDEO]: [17000, 1500], [IMAGE]: [4000, 800] });
});

test('rows keep the order in which files were first optimized', () => {
  const repo = createRepo();
  repo.commit('add assets', {
    [VIDEO]: bytes(17000, 2),
    [IMAGE]: bytes(3000, 2),
  });
  repo.bot({ [IMAGE]: bytes(700, 3) });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  assert.deepEqual(
    repo.history().rows.map((r) => r.file),
    [IMAGE, VIDEO],
  );
});

test('commits on the base branch are out of range, even with the marker', () => {
  const repo = createRepo();
  repo.sh('checkout', '-q', 'main');
  repo.commit('add video on main', { [VIDEO]: bytes(17000, 2) });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  repo.sh('checkout', '-q', '-b', 'late', 'main');
  repo.commit('pr work', { 'docs/a/page.mdx': 'text' });
  assert.deepEqual(repo.history().rows, []);
});

test('a PR that merged the base in still finds its own bot commits only', () => {
  const repo = createRepo();
  repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  repo.sh('checkout', '-q', 'main');
  repo.commit('unrelated change on main', { 'docs/other.mdx': 'text' });
  repo.sh('checkout', '-q', 'pr');
  repo.sh('merge', '-q', '--no-edit', 'main');
  assert.deepEqual(sizes(repo.history().rows[0]), [17000, 1500]);
});

test('a commit that only looks like a bot commit is ignored', async (t) => {
  await t.test('it adds a file', () => {
    const repo = createRepo();
    repo.bot({ 'docs/a/assets/img/new.png': bytes(500, 2) });
    assert.deepEqual(repo.history().rows, []);
  });
  await t.test('it deletes a file', () => {
    const repo = createRepo();
    repo.bot({ [IMAGE]: null });
    assert.deepEqual(repo.history().rows, []);
  });
  await t.test('it also touches a non-asset file', () => {
    const repo = createRepo();
    repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
    repo.bot({ [VIDEO]: bytes(1500, 3), 'docs/a/page.mdx': 'sneaky edit' });
    assert.deepEqual(repo.history().rows, []);
  });
  await t.test('it modifies only a non-asset file', () => {
    const repo = createRepo();
    repo.bot({ 'README.md': 'changed' });
    assert.deepEqual(repo.history().rows, []);
  });
  await t.test('it is an empty commit', () => {
    const repo = createRepo();
    repo.bot({});
    assert.deepEqual(repo.history().rows, []);
  });
  await t.test('it is a merge commit', () => {
    const repo = createRepo();
    repo.sh('checkout', '-q', '-b', 'side');
    repo.commit('side work', { [IMAGE]: bytes(300, 5) });
    repo.sh('checkout', '-q', 'pr');
    repo.commit('pr work', { [VIDEO]: bytes(17000, 2) });
    repo.sh('merge', '-q', '--no-ff', '-m', BOT, 'side');
    assert.deepEqual(repo.history().rows, []);
  });
  await t.test('it turns a regular file into a symlink', () => {
    const repo = createRepo();
    fs.rmSync(path.join(repo.dir, IMAGE));
    fs.symlinkSync('../../../../README.md', path.join(repo.dir, IMAGE));
    repo.sh('add', '-A');
    repo.sh('commit', '-q', '-m', BOT);
    assert.deepEqual(repo.history().rows, []);
  });
});

test('a commit without the marker is never a bot commit, even if it only shrinks assets', () => {
  const repo = createRepo();
  repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  repo.commit('optimized locally by the author', { [VIDEO]: bytes(1500, 3) });
  assert.deepEqual(repo.history().rows, []);
});

test('the marker may sit anywhere in the message (same match as the scan step)', () => {
  const repo = createRepo();
  repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  repo.commit('optimize\n\nnotes [asset-bot] more notes', {
    [VIDEO]: bytes(1500, 3),
  });
  assert.deepEqual(sizes(repo.history().rows[0]), [17000, 1500]);
});

test('odd file names: spaces, accents, uppercase extension', () => {
  const repo = createRepo();
  const names = [
    'docs/a/assets/vids/my demo é.mp4',
    'docs/a/assets/img/SHOT.PNG',
    "docs/a/assets/img/it's here.png",
  ];
  repo.commit('add', Object.fromEntries(names.map((n) => [n, bytes(4000, 2)])));
  repo.bot(Object.fromEntries(names.map((n) => [n, bytes(900, 3)])));
  const { rows } = repo.history();
  assert.deepEqual(rows.map((r) => r.file).sort(), [...names].sort());
  assert.ok(rows.every((r) => r.before === 4000 && r.after === 900));
});

test('every supported asset type is recognized, an unsupported one is not', () => {
  const repo = createRepo();
  const ok = [
    'a.png',
    'a.jpg',
    'a.jpeg',
    'a.webp',
    'a.avif',
    'a.svg',
    'a.gif',
    'a.mp4',
    'a.webm',
    'a.mov',
  ].map((n) => `docs/a/assets/${n}`);
  const files = Object.fromEntries(
    [...ok, 'docs/a/assets/a.bmp'].map((n) => [n, bytes(2000, 2)]),
  );
  repo.commit('add', files);
  repo.bot(Object.fromEntries(ok.map((n) => [n, bytes(500, 3)])));
  assert.equal(repo.history().rows.length, ok.length);
  repo.bot({ 'docs/a/assets/a.bmp': bytes(500, 3) });
  assert.equal(repo.history().rows.length, ok.length);
});

test('head can be an earlier commit: rows as of that commit', () => {
  const repo = createRepo();
  repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  const bot = repo.bot({ [VIDEO]: bytes(1500, 3) });
  repo.commit('author edits it', { [VIDEO]: bytes(9000, 9) });
  assert.equal(repo.history('main', bot).rows.length, 1);
  assert.equal(repo.history('main', 'HEAD').rows.length, 0);
});

test('the same result on every call', () => {
  const repo = createRepo();
  repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  assert.deepEqual(repo.history(), repo.history());
});

test('a base ref that does not exist is an error, not an empty result', () => {
  assert.throws(() => createRepo().history('upstream/nope'));
});

test('command line: writes the report, and refuses to run without --report', () => {
  const repo = createRepo();
  repo.commit('add video', { [VIDEO]: bytes(17000, 2) });
  repo.bot({ [VIDEO]: bytes(1500, 3) });
  const script = path.resolve(import.meta.dirname, 'history.mjs');
  const report = path.join(
    repo.dir,
    '..',
    `history-${path.basename(repo.dir)}.json`,
  );
  dirs.push(report);
  const ok = spawnSync('node', [script, '--base', 'main', '--report', report], {
    cwd: repo.dir,
    encoding: 'utf8',
  });
  assert.equal(ok.status, 0, ok.stderr);
  assert.deepEqual(
    JSON.parse(fs.readFileSync(report, 'utf8')).rows.map((r) => r.file),
    [VIDEO],
  );
  const missing = spawnSync('node', [script, '--base', 'main'], {
    cwd: repo.dir,
    encoding: 'utf8',
  });
  assert.equal(missing.status, 2);
  const badRef = spawnSync(
    'node',
    [script, '--base', 'nope', '--report', report],
    { cwd: repo.dir, encoding: 'utf8' },
  );
  assert.notEqual(badRef.status, 0);
});
