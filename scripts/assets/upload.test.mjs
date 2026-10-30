// The upload flow against a local S3 stand-in, driven through the real AWS CLI. Needs the `aws`
// command (GitHub's runners have it); the tests are skipped where it is missing.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { startS3Stub } from './s3-stub.mjs';
import { classify, plan, storeFiles } from './upload.mjs';

const haveAws = spawnSync('aws', ['--version']).status === 0;
const opts = { skip: !haveAws && 'the AWS CLI is not installed' };

// A valid PNG: signature plus a few bytes. Only the magic bytes matter to the sniff.
const png = (seed) =>
  Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from(String(seed).repeat(20))]);
const hex = (b) => crypto.createHash('sha256').update(b).digest('hex');
const b64 = (b) => crypto.createHash('sha256').update(b).digest('base64');

async function setup(t) {
  const stub = await startS3Stub();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-test-'));
  const previous = { cwd: process.cwd(), id: process.env.AWS_ACCESS_KEY_ID, secret: process.env.AWS_SECRET_ACCESS_KEY };
  process.chdir(dir);
  process.env.AWS_ACCESS_KEY_ID = 'test';
  process.env.AWS_SECRET_ACCESS_KEY = 'test';
  t.after(async () => {
    process.chdir(previous.cwd);
    if (previous.id === undefined) delete process.env.AWS_ACCESS_KEY_ID;
    else process.env.AWS_ACCESS_KEY_ID = previous.id;
    if (previous.secret === undefined) delete process.env.AWS_SECRET_ACCESS_KEY;
    else process.env.AWS_SECRET_ACCESS_KEY = previous.secret;
    fs.rmSync(dir, { recursive: true, force: true });
    await stub.close();
  });
  const file = (name, content) => {
    fs.mkdirSync(path.dirname(name), { recursive: true });
    fs.writeFileSync(name, content);
    return name;
  };
  const config = { bucket: stub.bucket, region: 'us-east-1', endpoint: stub.endpoint, prefix: 'docs-test', pr: '7', commit: 'abc123' };
  return { stub, file, config };
}
const fast = { retryDelayMs: 10 };
const keyOf = (name, content) => `docs-test/${name.replace(/\.png$/, `.${hex(content).slice(0, 12)}.png`)}`;

test('classify maps AWS CLI errors', () => {
  assert.equal(classify({ code: 0, stderr: '' }), 'ok');
  assert.equal(classify({ code: 254, stderr: 'An error occurred (PreconditionFailed) when calling the PutObject operation' }), 'precondition');
  assert.equal(classify({ code: 254, stderr: 'An error occurred (404) when calling the HeadObject operation: Not Found' }), 'missing');
  assert.equal(classify({ code: 254, stderr: 'An error occurred (403) when calling the HeadObject operation: Forbidden' }), 'denied');
  assert.equal(classify({ code: 254, stderr: 'An error occurred (InternalError) when calling' }), 'transient');
  assert.equal(classify({ code: 255, stderr: 'Could not connect to the endpoint URL' }), 'transient');
  assert.equal(classify({ code: 254, stderr: 'An error occurred (MalformedXML) when calling' }), 'other');
});

test('plan skips what is not stored and builds the key and headers for the rest', async (t) => {
  const { file } = await setup(t);
  assert.match(plan(file('docs/a/assets/img/x.svg', '<svg/>')).skip, /SVG/);
  assert.match(plan(file('static/img/x.png', png(1))).skip, /no key/);
  assert.match(plan(file('docs/a/assets/img/bad name.png', png(1))).skip, /no key/);
  assert.match(plan(file('docs/a/assets/img/fake.png', 'not a png at all')).skip, /not a valid file/);
  assert.match(plan(file('docs/a/notes.txt', 'x')).skip, /not a type/);
  const ok = plan(file('docs/a/assets/img/ok.png', png(2)), { prefix: '/docs-test/' });
  assert.equal(ok.s3Key, keyOf('docs/a/assets/img/ok.png', png(2)));
  assert.equal(ok.type, 'image/png');
});

test('a new file is uploaded with checksum, conditional write, content type and metadata', opts, async (t) => {
  const { stub, file, config } = await setup(t);
  const content = png(3);
  const report = await storeFiles([file('docs/a/assets/img/new.png', content)], config, fast);
  assert.equal(report.state, 'success', report.description);
  assert.deepEqual(report.counts, { uploaded: 1, existing: 0, failed: 0, skipped: 0 });
  const stored = stub.objects.get(keyOf('docs/a/assets/img/new.png', content));
  assert.deepEqual(stored.body, content);
  const put = stub.requests.find((r) => r.method === 'PUT');
  assert.equal(put.headers['x-amz-checksum-sha256'], b64(content));
  assert.equal(put.headers['if-none-match'], '*');
  assert.equal(put.headers['content-type'], 'image/png');
  assert.equal(put.headers['cache-control'], 'public, max-age=31536000, immutable');
  assert.equal(put.headers['x-amz-meta-pr'], '7');
  assert.equal(put.headers['x-amz-meta-commit'], 'abc123');
  assert.ok(put.headers['x-amz-meta-uploaded-at']);
});

test('a second run finds the object and sends nothing', opts, async (t) => {
  const { stub, file, config } = await setup(t);
  const files = [file('docs/a/assets/img/again.png', png(4))];
  await storeFiles(files, config, fast);
  assert.equal(stub.count('PUT'), 1);
  const report = await storeFiles(files, config, fast);
  assert.equal(report.state, 'success');
  assert.deepEqual(report.counts, { uploaded: 0, existing: 1, failed: 0, skipped: 0 });
  assert.equal(stub.count('PUT'), 1, 'no second upload');
});

test('a changed file is a new object and the old one stays', opts, async (t) => {
  const { stub, file, config } = await setup(t);
  await storeFiles([file('docs/a/assets/img/c.png', png(5))], config, fast);
  await storeFiles([file('docs/a/assets/img/c.png', png(6))], config, fast);
  assert.equal(stub.objects.size, 2);
});

test('an existing object with other content is a failure and is never overwritten', opts, async (t) => {
  const { stub, file, config } = await setup(t);
  const content = png(7);
  const key = keyOf('docs/a/assets/img/clash.png', content);
  stub.objects.set(key, { body: Buffer.from('someone else'), headers: {}, checksum: null });
  const report = await storeFiles([file('docs/a/assets/img/clash.png', content)], config, fast);
  assert.equal(report.state, 'failure');
  assert.equal(stub.count('PUT'), 0);
  assert.equal(stub.objects.get(key).body.toString(), 'someone else');
});

test('same size, other content, no checksum on the stored object: still a failure', opts, async (t) => {
  const { stub, file, config } = await setup(t);
  const content = png(8);
  const other = Buffer.from(content);
  other[other.length - 1] ^= 1;
  const key = keyOf('docs/a/assets/img/same-size.png', content);
  stub.objects.set(key, { body: other, headers: {}, checksum: null });
  const report = await storeFiles([file('docs/a/assets/img/same-size.png', content)], config, fast);
  assert.equal(report.state, 'failure');
  assert.equal(stub.count('PUT'), 0);
  assert.ok(stub.count('GET') >= 1, 'the object was downloaded and hashed');
});

test('no checksum on the stored object but the same bytes counts as stored', opts, async (t) => {
  const { stub, file, config } = await setup(t);
  const content = png(9);
  stub.objects.set(keyOf('docs/a/assets/img/old.png', content), { body: content, headers: {}, checksum: null });
  const report = await storeFiles([file('docs/a/assets/img/old.png', content)], config, fast);
  assert.equal(report.state, 'success');
  assert.equal(report.counts.existing, 1);
  assert.equal(stub.count('PUT'), 0);
});

test('a transient 503 on the upload is retried', opts, async (t) => {
  const { stub, file, config } = await setup(t);
  stub.fail('PUT', { status: 503, code: 'ServiceUnavailable' });
  const report = await storeFiles([file('docs/a/assets/img/retry.png', png(10))], config, fast);
  assert.equal(report.state, 'success', report.description);
  assert.equal(report.counts.uploaded, 1);
  assert.equal(stub.count('PUT'), 2);
});

test('a lost answer after the object landed is detected, not retried into a conflict', opts, async (t) => {
  const { stub, file, config } = await setup(t);
  stub.fail('PUT', 'store-then-drop');
  const report = await storeFiles([file('docs/a/assets/img/lost.png', png(11))], config, fast);
  assert.equal(report.state, 'success', report.description);
  assert.equal(report.counts.uploaded, 1);
  assert.equal(stub.count('PUT'), 1, 'it looked instead of sending again');
});

test('a persistent outage fails after the attempts', opts, async (t) => {
  const { stub, file, config } = await setup(t);
  stub.fail('PUT', ...Array(5).fill({ status: 503, code: 'ServiceUnavailable' }));
  const report = await storeFiles([file('docs/a/assets/img/down.png', png(12))], config, { ...fast, attempts: 2 });
  assert.equal(report.state, 'failure');
  assert.equal(stub.count('PUT'), 2);
  assert.equal(stub.objects.size, 0);
});

test('access denied fails at once, without retries', opts, async (t) => {
  const { stub, file, config } = await setup(t);
  stub.fail('HEAD', { status: 403, code: 'AccessDenied' });
  stub.fail('PUT', { status: 403, code: 'AccessDenied' });
  const report = await storeFiles([file('docs/a/assets/img/denied.png', png(13))], config, fast);
  assert.equal(report.state, 'failure');
  assert.match(report.results[0].error, /denied/);
  assert.equal(stub.count('PUT'), 1);
});

test('skipped files are not failures', opts, async (t) => {
  const { stub, file, config } = await setup(t);
  const report = await storeFiles([file('docs/a/assets/img/vector.svg', '<svg/>'), file('docs/a/assets/img/fine.png', png(14))], config, fast);
  assert.equal(report.state, 'success');
  assert.deepEqual(report.counts, { uploaded: 1, existing: 0, failed: 0, skipped: 1 });
  assert.equal(stub.objects.size, 1);
});

test('missing configuration or credentials is an error, not a failure', opts, async (t) => {
  const { file, config } = await setup(t);
  const files = [file('docs/a/assets/img/e.png', png(15))];
  assert.equal((await storeFiles(files, { ...config, bucket: '' }, fast)).state, 'error');
  delete process.env.AWS_SECRET_ACCESS_KEY;
  const report = await storeFiles(files, config, fast);
  assert.equal(report.state, 'error');
  assert.match(report.description, /credentials/);
});

test('no files: success, nothing sent', opts, async (t) => {
  const { stub, config } = await setup(t);
  const report = await storeFiles([], config, fast);
  assert.equal(report.state, 'success');
  assert.equal(stub.requests.length, 0);
});
