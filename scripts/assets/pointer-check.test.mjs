// Tests for pointer-check.mjs: the CI check that every pointer a PR adds or changes is valid and
// points at an object that exists. It runs against a real local HTTP server (the "bucket") and real
// temporary git repositories.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  ALLOWED_HOSTS,
  checkPointer,
  escapeData,
  escapeProperty,
  run,
  selectPointers,
} from './pointer-check.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pointer-check-'));
let counter = 0;
const FAST = { retryDelayMs: 0, timeoutMs: 400 };

// --- a fake bucket ------------------------------------------------------------------------------
// `answers` maps a URL path to a list of answers, used in order; the last one repeats.
async function bucket(answers = {}) {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    const list = answers[req.url];
    if (!list) {
      res.writeHead(404);
      return res.end();
    }
    const answer = list.length > 1 ? list.shift() : list[0];
    if (answer === 'hang') return; // never answers: the check must time out
    res.writeHead(answer.status, answer.headers ?? {});
    res.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    requests,
    host: `127.0.0.1:${port}`,
    baseUrl: `http://127.0.0.1:${port}/docs`,
    close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve); }),
  };
}
const ok = (size) => [{ status: 200, headers: { 'content-length': String(size) } }];

// --- pointers and repositories ----------------------------------------------------------------------
const sha = (char) => char.repeat(64);
function pointerFor(char, { name = 'a', size = 100, folder = 'docs/guide/assets/img' } = {}) {
  const key = `${folder}/${name}.${sha(char).slice(0, 12)}.png`;
  return { key, text: `s3-asset v1\nsha256 ${sha(char)}\nsize ${size}\nkey ${key}\n` };
}

function makeRepo(files) {
  const dir = path.join(root, `repo${++counter}`);
  fs.mkdirSync(dir, { recursive: true });
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 't@example.com');
  git('config', 'user.name', 't');
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  };
  for (const [rel, content] of Object.entries(files)) write(rel, content);
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  git('checkout', '-q', '-b', 'feature');
  return {
    dir,
    change(more) {
      for (const [rel, content] of Object.entries(more)) write(rel, content);
      git('add', '-A');
      git('commit', '-q', '-m', 'change');
    },
  };
}

function configFor(baseUrl) {
  return `const POINTER_ASSETS_BASE_URL = '${baseUrl}';\nconst plugins = [['./plugins/pointer-assets/index.cjs', { baseUrl: POINTER_ASSETS_BASE_URL }]];\n`;
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

test.after(() => fs.rmSync(root, { recursive: true, force: true }));

// --- checkPointer ---------------------------------------------------------------------------------
async function checkOne(answers, size = 100, extra = {}) {
  const b = await bucket(answers);
  try {
    const { key, text } = pointerFor('a', { size });
    const file = path.join(root, `p${++counter}.png`);
    fs.writeFileSync(file, text);
    const result = await checkPointer(file, b.baseUrl, { ...FAST, ...extra });
    return { result, requests: b.requests, key };
  } finally {
    await b.close();
  }
}
const urlPath = (key) => `/docs/${key}`;
const KEY = pointerFor('a').key;

test('an existing object of the right size is ok, and only HEAD is used', async () => {
  const { result, requests } = await checkOne({ [urlPath(KEY)]: ok(100) });
  assert.equal(result.kind, 'ok');
  assert.deepEqual(requests, [`HEAD ${urlPath(KEY)}`]);
});

test('a different size, a 404 and a 403 are problems that need no retry', async () => {
  const wrong = await checkOne({ [urlPath(KEY)]: ok(99) });
  assert.equal(wrong.result.kind, 'size');
  assert.match(wrong.result.problem, /99 bytes.*100/);
  const missing = await checkOne({});
  assert.equal(missing.result.kind, 'missing');
  assert.equal(missing.requests.length, 1);
  const forbidden = await checkOne({ [urlPath(KEY)]: [{ status: 403 }] });
  assert.equal(forbidden.result.kind, 'missing');
  assert.match(forbidden.result.problem, /not public/);
});

test('server errors are retried, and a recovery counts as ok', async () => {
  const flaky = await checkOne({ [urlPath(KEY)]: [{ status: 500 }, { status: 503 }, ...ok(100)] });
  assert.equal(flaky.result.kind, 'ok');
  assert.equal(flaky.requests.length, 3);
  const down = await checkOne({ [urlPath(KEY)]: [{ status: 500 }] });
  assert.equal(down.result.kind, 'unreachable');
  assert.equal(down.requests.length, 3);
});

test('a redirect is never followed and is reported as a problem', async () => {
  const { result, requests } = await checkOne({
    [urlPath(KEY)]: [{ status: 301, headers: { location: 'http://127.0.0.1:1/elsewhere' } }],
  });
  assert.equal(result.kind, 'redirect');
  assert.equal(requests.length, 1);
});

test('a server that never answers times out and is unreachable, not a hang', async () => {
  const { result } = await checkOne({ [urlPath(KEY)]: ['hang'] }, 100, { attempts: 2, timeoutMs: 150 });
  assert.equal(result.kind, 'unreachable');
  assert.match(result.problem, /timed out/);
});

test('a malformed pointer is invalid and makes no request', async () => {
  const b = await bucket({});
  try {
    const file = path.join(root, `bad${++counter}.png`);
    fs.writeFileSync(file, `s3-asset v1\nsha256 ${sha('a')}\nsize 10\nkey ../../etc/passwd\n`);
    const result = await checkPointer(file, b.baseUrl, FAST);
    assert.equal(result.kind, 'invalid');
    assert.deepEqual(b.requests, []);
  } finally {
    await b.close();
  }
});

// --- run: which pointers are checked, and when nothing is read ------------------------------------
test('no changed pointer: success without opening the config or asking the bucket', async () => {
  const b = await bucket({});
  try {
    const repo = makeRepo({ 'README.md': 'x' });
    repo.change({ 'docs/page.md': 'a change that is not an asset' });
    // The config path does not exist: if it were read, the run would fail.
    const report = await inRepo(repo.dir, () =>
      run({ base: 'main', configPath: path.join(repo.dir, 'no-such-config.js'), allowedHosts: [b.host], allowInsecure: true, ...FAST }),
    );
    assert.equal(report.state, 'success');
    assert.equal(report.description, 'No pointer files changed');
    assert.deepEqual(b.requests, []);
  } finally {
    await b.close();
  }
});

test('a changed pointer is verified; a missing object fails', async () => {
  const good = pointerFor('b', { name: 'good', size: 321 });
  const lost = pointerFor('c', { name: 'lost' });
  const b = await bucket({ [urlPath(good.key)]: ok(321) });
  try {
    const repo = makeRepo({ 'docusaurus.config.js': configFor(b.baseUrl), 'README.md': 'x' });
    repo.change({ 'docs/guide/assets/img/good.png': good.text });
    const config = path.join(repo.dir, 'docusaurus.config.js');
    const opts = { base: 'main', configPath: config, allowedHosts: [b.host], allowInsecure: true, ...FAST };
    const first = await inRepo(repo.dir, () => run(opts));
    assert.equal(first.state, 'success');
    assert.equal(first.checked, 1);
    assert.match(first.description, /1 pointer file verified/);

    repo.change({ 'docs/guide/assets/img/lost.png': lost.text });
    const second = await inRepo(repo.dir, () => run(opts));
    assert.equal(second.state, 'failure');
    assert.equal(second.results.find((r) => r.file.endsWith('lost.png')).kind, 'missing');
  } finally {
    await b.close();
  }
});

test('a change to the config or the plugin checks every pointer, not only the changed ones', async () => {
  const one = pointerFor('d', { name: 'one', size: 10 });
  const two = pointerFor('e', { name: 'two', size: 20 });
  for (const touched of ['docusaurus.config.js', 'plugins/pointer-assets/loader.cjs']) {
    const b = await bucket({ [urlPath(one.key)]: ok(10), [urlPath(two.key)]: ok(20) });
    try {
      const repo = makeRepo({
        'docusaurus.config.js': configFor(b.baseUrl),
        'plugins/pointer-assets/loader.cjs': '// old',
        'docs/guide/assets/img/one.png': one.text,
        'docs/guide/assets/img/two.png': two.text,
        'docs/guide/assets/img/real.png': Buffer.alloc(300, 1),
      });
      repo.change({ [touched]: touched.endsWith('.js') ? configFor(b.baseUrl) + '// edited\n' : '// new' });
      const report = await inRepo(repo.dir, () =>
        run({ base: 'main', configPath: path.join(repo.dir, 'docusaurus.config.js'), allowedHosts: [b.host], allowInsecure: true, ...FAST }),
      );
      assert.equal(report.state, 'success', touched);
      assert.equal(report.checked, 2, touched);
      assert.match(report.description, /all were checked/);
    } finally {
      await b.close();
    }
  }
});

test('a base URL on another host, or a config without the literal, is a failure', async () => {
  const p = pointerFor('f', { name: 'p', size: 5 });
  const b = await bucket({ [urlPath(p.key)]: ok(5) });
  try {
    const repo = makeRepo({ 'docusaurus.config.js': configFor('https://evil.example/docs') });
    repo.change({ 'docs/guide/assets/img/p.png': p.text });
    const config = path.join(repo.dir, 'docusaurus.config.js');
    const other = await inRepo(repo.dir, () => run({ base: 'main', configPath: config, allowedHosts: [b.host], ...FAST }));
    assert.equal(other.state, 'failure');
    assert.match(other.detail, /not an allowed asset host/);

    fs.writeFileSync(config, '// the literal is gone\n');
    const none = await inRepo(repo.dir, () => run({ base: 'main', configPath: config, allowedHosts: [b.host], allowInsecure: true, ...FAST }));
    assert.equal(none.state, 'failure');
    assert.match(none.detail, /found 0/);
    assert.deepEqual(b.requests, [], 'no request was made for a rejected base URL');
  } finally {
    await b.close();
  }
});

test('http is refused unless explicitly allowed', async () => {
  const p = pointerFor('1', { name: 'p' });
  const b = await bucket({});
  try {
    const repo = makeRepo({ 'docusaurus.config.js': configFor(b.baseUrl) });
    repo.change({ 'docs/guide/assets/img/p.png': p.text });
    const report = await inRepo(repo.dir, () =>
      run({ base: 'main', configPath: path.join(repo.dir, 'docusaurus.config.js'), allowedHosts: [b.host], ...FAST }),
    );
    assert.equal(report.state, 'failure');
    assert.match(report.detail, /not https/);
  } finally {
    await b.close();
  }
});

test('the bucket being down is an error, not a failure, and too many pointers is an error', async () => {
  const a = pointerFor('2', { name: 'a' });
  const c = pointerFor('3', { name: 'c' });
  const b = await bucket({ [urlPath(a.key)]: [{ status: 502 }], [urlPath(c.key)]: [{ status: 502 }] });
  try {
    const repo = makeRepo({ 'docusaurus.config.js': configFor(b.baseUrl) });
    repo.change({ 'docs/guide/assets/img/a.png': a.text, 'docs/guide/assets/img/c.png': c.text });
    const opts = { base: 'main', configPath: path.join(repo.dir, 'docusaurus.config.js'), allowedHosts: [b.host], allowInsecure: true, ...FAST };
    const down = await inRepo(repo.dir, () => run(opts));
    assert.equal(down.state, 'error');
    assert.match(down.description, /Could not reach the asset bucket for 2 pointer files/);
    const many = await inRepo(repo.dir, () => run({ ...opts, maxPointers: 1 }));
    assert.equal(many.state, 'error');
    assert.match(many.description, /Too many pointer files/);
  } finally {
    await b.close();
  }
});

test('a hand-written pointer is a failure; real binaries and symlinks that look like pointers are ignored', async () => {
  const b = await bucket({});
  try {
    const repo = makeRepo({ 'docusaurus.config.js': configFor(b.baseUrl) });
    const outside = path.join(root, 'outside-pointer.png');
    fs.writeFileSync(outside, pointerFor('4', { name: 'x' }).text);
    fs.mkdirSync(path.join(repo.dir, 'docs'), { recursive: true });
    fs.symlinkSync(outside, path.join(repo.dir, 'docs', 'link.png'));
    repo.change({
      'docs/hand-written.png': 's3-asset v1\nsha256 abc\nsize 1\nkey nonsense\n',
      'docs/real.png': Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(100, 7)]),
      'docs/notes.txt': 's3-asset v1 but not an image type\n',
    });
    const found = await inRepo(repo.dir, () => selectPointers({ base: 'main', head: 'HEAD' }));
    assert.deepEqual(found.files, ['docs/hand-written.png']);
    const report = await inRepo(repo.dir, () =>
      run({ base: 'main', configPath: path.join(repo.dir, 'docusaurus.config.js'), allowedHosts: [b.host], allowInsecure: true, ...FAST }),
    );
    assert.equal(report.state, 'failure');
    assert.equal(report.results[0].kind, 'invalid');
  } finally {
    await b.close();
  }
});

// --- the allowlist, and workflow-command escaping --------------------------------------------------
test('the real config literal points at an allowed host, so a typo in either place fails here', async () => {
  const { extractBaseUrl } = (await import('node:module')).createRequire(import.meta.url)('./pointer.cjs');
  const baseUrl = extractBaseUrl(fs.readFileSync(path.join(repoRoot, 'docusaurus.config.js'), 'utf8'));
  const url = new URL(baseUrl);
  assert.equal(url.protocol, 'https:');
  assert.ok(ALLOWED_HOSTS.includes(url.host), `${url.host} must be listed in ALLOWED_HOSTS`);
});

test('file names cannot start another workflow command', () => {
  assert.equal(escapeData('a\n::set-output name=x::y'), 'a%0A::set-output name=x::y');
  assert.equal(escapeProperty('a,b:c\r\n%'), 'a%2Cb%3Ac%0D%0A%25');
  assert.ok(!escapeProperty('x\n::stop-commands::token').includes('\n'));
});
