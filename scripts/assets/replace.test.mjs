// The replace flow: a real file becomes a pointer only when its object is publicly there. The public
// URL is served by the S3 stand-in through an injected fetch.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { expectedBaseUrl, pointerText, replaceFiles, validDimensions } from './replace.mjs';
import { startS3Stub } from './s3-stub.mjs';

const { parsePointer, keyFor } = createRequire(import.meta.url)('./pointer.cjs');

const ENV = { bucket: 'test-bucket', region: 'us-east-1', prefix: 'docs-test' };
const BASE = 'https://test-bucket.s3.us-east-1.amazonaws.com/docs-test';
const CONFIG = `const POINTER_ASSETS_BASE_URL =\n  '${BASE}';\nconst x = { baseUrl: POINTER_ASSETS_BASE_URL };\n`;
// Large enough that its pointer is smaller than the file.
const png = (seed) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from(String(seed).repeat(200))]);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

async function setup(t) {
  const stub = await startS3Stub({ bucket: 'test-bucket' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'replace-test-'));
  const cwd = process.cwd();
  process.chdir(dir);
  t.after(async () => {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
    await stub.close();
  });
  const fetchImpl = (url, init) => fetch(url.replace('https://test-bucket.s3.us-east-1.amazonaws.com', `${stub.endpoint}/test-bucket`), init);
  // Writes a real file and (unless told not to) stores its object the way upload.mjs would.
  const add = (name, content, { store = true } = {}) => {
    fs.mkdirSync(path.dirname(name), { recursive: true });
    fs.writeFileSync(name, content);
    const { key } = keyFor(name, sha(content));
    if (store) stub.objects.set(`docs-test/${key}`, { body: content, headers: {}, checksum: null });
    return { name, key };
  };
  const run = (files, extra = {}) =>
    replaceFiles(files, { configText: CONFIG, env: ENV, fetchImpl, retryDelayMs: 5, ...extra });
  return { stub, add, run };
}

test('expectedBaseUrl and validDimensions', () => {
  assert.equal(expectedBaseUrl(ENV), BASE);
  assert.equal(expectedBaseUrl({ ...ENV, prefix: '/docs/' }), 'https://test-bucket.s3.us-east-1.amazonaws.com/docs');
  assert.deepEqual(validDimensions({ width: 10, height: 20 }), { width: 10, height: 20 });
  for (const bad of [null, {}, { width: 0, height: 5 }, { width: 5.5, height: 5 }, { width: '5', height: 5 }, { width: 100000, height: 5 }, { width: 5 }])
    assert.equal(validDimensions(bad), null, JSON.stringify(bad));
});

test('a stored file becomes a valid pointer for that file', async (t) => {
  const { add, run } = await setup(t);
  const content = png(1);
  const { name, key } = add('docs/a/assets/img/x.png', content);
  const report = await run([name], { dimensions: { [sha(content)]: { width: 640, height: 480 } } });
  assert.equal(report.state, 'success', report.description);
  assert.equal(report.counts.replaced, 1);
  const pointer = parsePointer(fs.readFileSync(name, 'utf8'), name);
  assert.deepEqual(pointer, { sha256: sha(content), size: content.length, key, width: 640, height: 480 });
  assert.equal(fs.readdirSync(path.dirname(name)).length, 1, 'no temporary file is left behind');
});

test('a dimension measured for other bytes, or an invalid one, is not used', async (t) => {
  const { add, run } = await setup(t);
  const { name } = add('docs/a/assets/img/y.png', png(2));
  await run([name], { dimensions: { [sha(png(99))]: { width: 1, height: 1 } } });
  const pointer = parsePointer(fs.readFileSync(name, 'utf8'), name);
  assert.equal(pointer.width, undefined);
  const { name: second } = add('docs/a/assets/img/z.png', png(3));
  await run([second], { dimensions: { [sha(png(3))]: { width: -4, height: 'x' } } });
  assert.equal(parsePointer(fs.readFileSync(second, 'utf8'), second).height, undefined);
});

test('a missing object leaves the real file alone, with a warning, not a failure', async (t) => {
  const { add, run } = await setup(t);
  const content = png(4);
  const { name } = add('docs/a/assets/img/missing.png', content, { store: false });
  const report = await run([name]);
  assert.equal(report.state, 'success');
  assert.equal(report.counts.replaced, 0);
  assert.equal(report.counts.kept, 1);
  assert.deepEqual(fs.readFileSync(name), content);
});

test('an object of another size is not trusted', async (t) => {
  const { stub, add, run } = await setup(t);
  const { name, key } = add('docs/a/assets/img/size.png', png(5));
  stub.objects.get(`docs-test/${key}`).body = Buffer.from('short');
  const report = await run([name]);
  assert.equal(report.counts.replaced, 0);
  assert.match(report.results[0].problem, /bytes/);
});

test('a private object (403) is left alone', async (t) => {
  const { stub, add, run } = await setup(t);
  const { name } = add('docs/a/assets/img/private.png', png(6));
  stub.fail('HEAD', { status: 403, code: 'AccessDenied' });
  const report = await run([name]);
  assert.equal(report.counts.replaced, 0);
  assert.match(report.results[0].problem, /not public/);
});

test('a redirect is not followed', async (t) => {
  const { stub, add, run } = await setup(t);
  const { name } = add('docs/a/assets/img/redirect.png', png(7));
  stub.fail('HEAD', { status: 301, code: 'PermanentRedirect' });
  const report = await run([name]);
  assert.equal(report.counts.replaced, 0);
  assert.match(report.results[0].problem, /redirect/);
});

test('an outage is retried, and a persistent one is an error that keeps the file', async (t) => {
  const { stub, add, run } = await setup(t);
  const { name } = add('docs/a/assets/img/flaky.png', png(8));
  stub.fail('HEAD', { status: 503 });
  assert.equal((await run([name])).counts.replaced, 1);
  const { name: down } = add('docs/a/assets/img/down.png', png(9));
  stub.fail('HEAD', ...Array(3).fill({ status: 503 }));
  const report = await run([down]);
  assert.equal(report.state, 'error');
  assert.deepEqual(fs.readFileSync(down), png(9));
});

test('settings that disagree with the base URL swap nothing', async (t) => {
  const { add, run } = await setup(t);
  const { name } = add('docs/a/assets/img/mismatch.png', png(10));
  for (const env of [{ ...ENV, prefix: 'docs' }, { ...ENV, region: 'eu-west-1' }, { ...ENV, bucket: 'other' }]) {
    const report = await run([name], { env });
    assert.equal(report.state, 'error', JSON.stringify(env));
    assert.match(report.description, /give https:/);
  }
  assert.deepEqual(fs.readFileSync(name), png(10));
});

test('a config without the base URL literal is an error', async (t) => {
  const { add, run } = await setup(t);
  const { name } = add('docs/a/assets/img/noconfig.png', png(11));
  const report = await run([name], { configText: 'module.exports = {};' });
  assert.equal(report.state, 'error');
  assert.deepEqual(fs.readFileSync(name), png(11));
});

test('a symlink is never replaced, and a file in a folder that cannot hold pointers is kept', async (t) => {
  const { add, run } = await setup(t);
  add('docs/a/assets/img/real.png', png(12));
  fs.symlinkSync('real.png', 'docs/a/assets/img/link.png');
  const report = await run(['docs/a/assets/img/link.png']);
  assert.equal(report.counts.replaced, 0);
  assert.ok(fs.lstatSync('docs/a/assets/img/link.png').isSymbolicLink());
  const { name } = add('static/img/s.png', png(13), { store: false });
  assert.equal((await run([name])).counts.replaced, 0);
});

test('a file smaller than its pointer is kept', async (t) => {
  const { add, run } = await setup(t);
  const tiny = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('x')]);
  const { name } = add('docs/a/assets/img/tiny.png', tiny);
  const report = await run([name]);
  assert.equal(report.counts.replaced, 0);
  assert.match(report.results[0].problem, /smaller/);
});

test('a second run has nothing left to swap', async (t) => {
  const { add, run } = await setup(t);
  const { name } = add('docs/a/assets/img/twice.png', png(14));
  assert.equal((await run([name])).counts.replaced, 1);
  const before = fs.readFileSync(name, 'utf8');
  // A pointer is not an asset: it hashes differently, so there is no object for it and it is kept.
  const report = await run([name]);
  assert.equal(report.counts.replaced, 0);
  assert.equal(fs.readFileSync(name, 'utf8'), before);
});

test('pointerText round-trips through the strict parser', () => {
  const content = png(15);
  const { key } = keyFor('docs/a/assets/img/rt.png', sha(content));
  const text = pointerText({ sha256: sha(content), size: content.length, key, dimensions: { width: 3, height: 4 } });
  assert.deepEqual(parsePointer(text, 'rt.png'), { sha256: sha(content), size: content.length, key, width: 3, height: 4 });
});
