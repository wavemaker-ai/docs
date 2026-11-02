import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fetchOne, findPointers } from './fetch-assets.mjs';
import { pointerText } from './replace.mjs';

const { keyFor } = createRequire(import.meta.url)('./pointer.cjs');
const BASE = 'https://example.test/docs-test';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const png = (seed) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.from(String(seed).repeat(300))]);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fetch-'));
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

function pointerFor(name, content) {
  const repoPath = `docs/x/assets/img/${name}`;
  const { key } = keyFor(repoPath, sha(content));
  const file = path.join(dir, repoPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, pointerText({ sha256: sha(content), size: content.length, key }));
  return { file, key };
}
const serve = (key, body, status = 200) => async (url) => {
  assert.equal(url, `${BASE}/${key}`);
  return new Response(status === 200 ? body : 'no', { status });
};

test('a verified download replaces the pointer with the real file', async () => {
  const content = png(1);
  const { file, key } = pointerFor('a.png', content);
  assert.deepEqual(await fetchOne(file, BASE, { fetchImpl: serve(key, content) }), { file, state: 'fetched' });
  assert.deepEqual(fs.readFileSync(file), content);
  assert.equal(fs.readdirSync(path.dirname(file)).filter((n) => n.endsWith('-tmp')).length, 0);
});

test('a wrong size, wrong content or error status leaves the pointer alone', async () => {
  const content = png(2);
  const { file, key } = pointerFor('b.png', content);
  const before = fs.readFileSync(file, 'utf8');
  for (const [body, status, pattern] of [
    [png(3).subarray(0, 100), 200, /bytes/],
    [Buffer.from(Buffer.concat([content.subarray(0, -1), Buffer.from('x')])), 200, /sha256/],
    ['', 404, /404/],
  ]) {
    const result = await fetchOne(file, BASE, { fetchImpl: serve(key, body, status) });
    assert.equal(result.state, 'failed');
    assert.match(result.problem, pattern);
    assert.equal(fs.readFileSync(file, 'utf8'), before);
  }
});

test('a real file or a malformed pointer is a failure, not a download', async () => {
  const real = path.join(dir, 'docs/x/assets/img/real.png');
  fs.writeFileSync(real, png(4));
  assert.equal((await fetchOne(real, BASE, { fetchImpl: () => assert.fail('no request') })).state, 'failed');
  const bad = path.join(dir, 'docs/x/assets/img/bad.png');
  fs.writeFileSync(bad, 's3-asset v1\nsha256 nope\n');
  assert.equal((await fetchOne(bad, BASE, { fetchImpl: () => assert.fail('no request') })).state, 'failed');
});

test('findPointers finds pointers in folders, skips real files and symlinks', () => {
  pointerFor('c.png', png(5));
  fs.symlinkSync(path.join(dir, 'docs/x/assets/img/c.png'), path.join(dir, 'docs/x/assets/img/link.png'));
  const found = findPointers([path.join(dir, 'docs')]).map((f) => path.basename(f)).sort();
  assert.ok(found.includes('c.png'));
  assert.ok(!found.includes('real.png') && !found.includes('link.png'));
});
