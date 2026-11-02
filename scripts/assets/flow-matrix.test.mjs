// The upload and replace flows end to end against a real git checkout and the S3 stand-in, for every
// on/off combination of the two. Invariants that must hold in all of them:
//   - the build never loses an asset: every file is either its real bytes or a pointer whose object is
//     in the bucket with exactly those bytes;
//   - a pointer exists only when its object does;
//   - an object is never overwritten, and a second run sends nothing new.
// (Optimize is independent of both: it only changes the bytes before they get here.)
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { classifyAssets } from './changed-assets.mjs';
import { replaceFiles } from './replace.mjs';
import { startS3Stub } from './s3-stub.mjs';
import { storeFiles } from './upload.mjs';

const { readPointer, looksLikePointer, readHead } = createRequire(import.meta.url)('./pointer.cjs');
const haveAws = spawnSync('aws', ['--version']).status === 0;

const ENV = { bucket: 'test-bucket', region: 'us-east-1', prefix: 'docs-test' };
const BASE = 'https://test-bucket.s3.us-east-1.amazonaws.com/docs-test';
const CONFIG = `const POINTER_ASSETS_BASE_URL =\n  '${BASE}';\nconst x = { baseUrl: POINTER_ASSETS_BASE_URL };\n`;
const png = (seed) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from(String(seed).repeat(400))]);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const FILES = { 'docs/a/assets/img/one.png': png(1), 'blogs/blog/assets/img/two.png': png(2) };

const git = (cwd, ...args) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.hooksPath=/dev/null', ...args], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' } });

async function scenario(t, { upload, replace }) {
  const stub = await startS3Stub({ bucket: 'test-bucket' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'matrix-'));
  const cwd = process.cwd();
  t.after(async () => {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
    await stub.close();
  });
  git(dir, 'init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(dir, 'README.md'), 'x');
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'base');
  git(dir, 'checkout', '-q', '-b', 'pr');
  for (const [file, content] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  }
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'add images');
  process.chdir(dir);
  process.env.AWS_ACCESS_KEY_ID = 'test';
  process.env.AWS_SECRET_ACCESS_KEY = 'test';

  const fetchImpl = (url, init) => fetch(url.replace('https://test-bucket.s3.us-east-1.amazonaws.com', `${stub.endpoint}/test-bucket`), init);
  // One pass of what the publish job does after the optimizer's files are applied.
  const publish = async () => {
    const candidates = classifyAssets({ base: 'main', head: 'HEAD', files: [] }).pending.map((a) => a.file);
    let stored = candidates;
    let uploadReport = null;
    if (upload) {
      uploadReport = await storeFiles(candidates, { ...ENV, endpoint: stub.endpoint, pr: '1', commit: 'abc' }, { retryDelayMs: 5 });
      stored = uploadReport.results.filter((r) => ['uploaded', 'exists'].includes(r.state)).map((r) => r.file);
    }
    const replaceReport = replace ? await replaceFiles(stored, { configText: CONFIG, env: ENV, fetchImpl, retryDelayMs: 5 }) : null;
    git(dir, 'add', '-A');
    if (git(dir, 'status', '--porcelain').trim()) git(dir, 'commit', '-q', '-m', 'chore: store assets in the bucket [asset-bot]');
    return { candidates, uploadReport, replaceReport };
  };
  return { stub, dir, publish };
}

function assertInvariants({ stub, dir }, label) {
  for (const [file, content] of Object.entries(FILES)) {
    const actual = fs.readFileSync(path.join(dir, file));
    if (looksLikePointer(readHead(path.join(dir, file)))) {
      const pointer = readPointer(path.join(dir, file));
      const object = stub.objects.get(`docs-test/${pointer.key}`);
      assert.ok(object, `${label}: pointer for ${file} has no object`);
      assert.equal(sha(object.body), pointer.sha256, `${label}: object content for ${file}`);
      assert.equal(pointer.sha256, sha(content), `${label}: the object is the original file`);
      assert.equal(pointer.size, content.length);
    } else {
      assert.deepEqual(actual, content, `${label}: ${file} is neither a pointer nor its real bytes`);
    }
  }
}

const COMBOS = [
  { upload: false, replace: false },
  { upload: true, replace: false },
  { upload: true, replace: true },
  { upload: false, replace: true },
];

for (const combo of COMBOS) {
  const label = `U=${combo.upload ? 'on' : 'off'} R=${combo.replace ? 'on' : 'off'}`;
  test(`${label}: invariants hold, and a second run changes nothing`, { skip: combo.upload && !haveAws && 'the AWS CLI is not installed' }, async (t) => {
    const s = await scenario(t, combo);
    const first = await s.publish();
    assertInvariants(s, `${label} first run`);
    const objects = s.stub.objects.size;
    const puts = s.stub.count('PUT');
    const files = Object.keys(FILES);
    const isPointer = (f) => looksLikePointer(readHead(path.join(s.dir, f)));
    assert.equal(s.stub.objects.size, combo.upload ? files.length : 0, `${label}: objects stored`);
    // Replaced only when both flows ran: with R alone nothing is in the bucket yet.
    assert.deepEqual(files.map(isPointer), files.map(() => combo.upload && combo.replace), `${label}: which files became pointers`);
    if (combo.replace && !combo.upload) assert.equal(first.replaceReport.counts.kept, files.length);

    const head = git(s.dir, 'rev-parse', 'HEAD');
    await s.publish();
    assertInvariants(s, `${label} second run`);
    assert.equal(s.stub.objects.size, objects, `${label}: no new object`);
    if (combo.upload && combo.replace) {
      assert.equal(s.stub.count('PUT'), puts, `${label}: nothing is uploaded twice`);
      assert.equal(git(s.dir, 'rev-parse', 'HEAD'), head, `${label}: no new commit`);
    }
  });
}

test('U=on R=on: a file whose upload fails stays a real file, the other becomes a pointer', { skip: !haveAws && 'the AWS CLI is not installed' }, async (t) => {
  const s = await scenario(t, { upload: true, replace: true });
  // Both files are uploaded and checked first; deny the first PUT only. Concurrency makes the order
  // undefined, so the assertion is on the count.
  s.stub.fail('PUT', { status: 403, code: 'AccessDenied' });
  const run = await s.publish();
  assert.equal(run.uploadReport.state, 'failure');
  assertInvariants(s, 'partial failure');
  const pointers = Object.keys(FILES).filter((f) => looksLikePointer(readHead(path.join(s.dir, f))));
  assert.equal(pointers.length, 1);
  // The next run finishes the job.
  const again = await s.publish();
  assert.equal(again.uploadReport.state, 'success');
  assertInvariants(s, 'after the retry');
  assert.equal(Object.keys(FILES).filter((f) => looksLikePointer(readHead(path.join(s.dir, f)))).length, 2);
});

test('R alone, with the objects stored by an earlier run, replaces them', async (t) => {
  const s = await scenario(t, { upload: false, replace: true });
  for (const [file, content] of Object.entries(FILES)) {
    const key = file.replace(/\.png$/, `.${sha(content).slice(0, 12)}.png`);
    s.stub.objects.set(`docs-test/${key}`, { body: content, headers: {}, checksum: null });
  }
  await s.publish();
  assertInvariants(s, 'R alone, objects present');
  assert.ok(Object.keys(FILES).every((f) => looksLikePointer(readHead(path.join(s.dir, f)))));
});
