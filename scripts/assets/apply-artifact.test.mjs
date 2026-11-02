// Tests for apply-artifact.mjs (the publish job's validator) and pack-artifact.mjs (the decode job's
// packer). The artifact is untrusted, so most tests are attacks: each must be rejected and leave the
// checkout untouched.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  MAX_FILES,
  MAX_MANIFEST_BYTES,
  applyArtifact,
  sanitizeDimensions,
  sniff,
} from './apply-artifact.mjs';

const HEAD = 'a'.repeat(40);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const png = (bytes, fill = 1) => Buffer.concat([PNG_MAGIC, Buffer.alloc(bytes, fill)]);
const sha = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apply-artifact-'));
test.after(() => fs.rmSync(root, { recursive: true, force: true }));
let counter = 0;

// Builds a checkout (`repo`: path to content) and an artifact (`artifact`: path to content) with a
// manifest that matches it, unless `manifest` overrides fields.
function scenario({ repo = {}, artifact = {}, manifest = {}, allowed } = {}) {
  const dir = path.join(root, `s${++counter}`);
  const cwd = path.join(dir, 'pr');
  const artifactDir = path.join(dir, 'artifact');
  const write = (base, rel, content) => {
    const file = path.join(base, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };
  fs.mkdirSync(cwd, { recursive: true });
  fs.mkdirSync(artifactDir, { recursive: true });
  for (const [rel, content] of Object.entries(repo)) write(cwd, rel, content);
  for (const [rel, content] of Object.entries(artifact)) write(artifactDir, `files/${rel}`, content);
  const doc = {
    version: 1,
    head_sha: HEAD,
    files: Object.entries(artifact).map(([rel, content]) => ({
      path: rel,
      sha256: sha(content),
      size: content.length,
    })),
    results: [],
    ...manifest,
  };
  fs.writeFileSync(path.join(artifactDir, 'manifest.json'), JSON.stringify(doc));
  return {
    cwd,
    artifactDir,
    run: () =>
      applyArtifact({
        artifactDir,
        cwd,
        headSha: HEAD,
        allowed: allowed ?? Object.keys(repo),
      }),
    read: (rel) => fs.readFileSync(path.join(cwd, rel)),
  };
}

const rejectedWith = (result, text) =>
  result.rejected.length === 1 && result.rejected[0].reason.includes(text);

test('applies a valid optimized file and leaves the rest alone', () => {
  const small = png(100);
  const s = scenario({
    repo: { 'docs/a.png': png(1000), 'docs/b.png': png(1000, 2) },
    artifact: { 'docs/a.png': small },
  });
  const result = s.run();
  assert.equal(result.state, 'ok');
  assert.deepEqual(result.applied, ['docs/a.png']);
  assert.deepEqual(s.read('docs/a.png'), small);
  assert.deepEqual(s.read('docs/b.png'), png(1000, 2));
});

test('an empty artifact applies nothing', () => {
  const s = scenario({ repo: { 'docs/a.png': png(1000) } });
  const result = s.run();
  assert.equal(result.state, 'ok');
  assert.deepEqual(result.applied, []);
});

test('rejects path traversal and absolute paths', () => {
  for (const bad of ['../outside.png', 'docs/../../outside.png', '/etc/x.png', 'docs//a.png', './docs/a.png']) {
    const s = scenario({
      repo: { 'docs/a.png': png(1000) },
      artifact: { 'docs/a.png': png(10) },
      manifest: { files: [{ path: bad, sha256: sha(png(10)), size: png(10).length }] },
      allowed: [bad, 'docs/a.png'],
    });
    const result = s.run();
    assert.deepEqual(result.applied, [], bad);
    assert.ok(rejectedWith(result, 'not a safe repository path'), bad);
    assert.deepEqual(s.read('docs/a.png'), png(1000), bad);
  }
});

test('rejects paths that are not changed assets of the PR', () => {
  for (const rel of ['.github/workflows/assets.yaml', 'package.json', 'docs/other.png']) {
    const s = scenario({
      repo: { [rel]: Buffer.from('original content that is long enough'), 'docs/a.png': png(1000) },
      artifact: { [rel]: png(10) },
      allowed: ['docs/a.png'],
    });
    const result = s.run();
    assert.deepEqual(result.applied, [], rel);
    assert.ok(rejectedWith(result, 'not an asset this run may optimize'), rel);
  }
});

test('rejects an allowed path that is not a supported asset type', () => {
  const s = scenario({
    repo: { 'docs/notes.txt': Buffer.from('x'.repeat(100)) },
    artifact: { 'docs/notes.txt': Buffer.from('x') },
  });
  assert.ok(rejectedWith(s.run(), 'not a supported asset type'));
});

test('rejects a symlink in the artifact', () => {
  const s = scenario({
    repo: { 'docs/a.png': png(1000) },
    artifact: { 'docs/a.png': png(10) },
  });
  const copy = path.join(s.artifactDir, 'files/docs/a.png');
  const target = path.join(path.dirname(s.artifactDir), 'secret.png');
  fs.writeFileSync(target, png(10));
  fs.rmSync(copy);
  fs.symlinkSync(target, copy);
  const result = s.run();
  assert.deepEqual(result.applied, []);
  assert.ok(rejectedWith(result, 'not a regular file'));
});

test('rejects a symlink in the checkout, and a symlinked directory that leaves it', () => {
  const outside = path.join(root, 'outside');
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(path.join(outside, 'x.png'), png(1000));
  const s = scenario({ repo: { 'docs/placeholder.png': png(1000) }, artifact: { 'docs/a.png': png(10), 'linked/x.png': png(10) }, allowed: ['docs/a.png', 'linked/x.png'] });
  fs.symlinkSync(path.join(outside, 'x.png'), path.join(s.cwd, 'docs/a.png'));
  fs.symlinkSync(outside, path.join(s.cwd, 'linked'));
  const result = s.run();
  assert.deepEqual(result.applied, []);
  assert.equal(result.rejected.length, 2);
  assert.deepEqual(fs.readFileSync(path.join(outside, 'x.png')), png(1000));
});

test('rejects a size or hash that does not match the manifest', () => {
  const content = png(10);
  const wrongSize = scenario({
    repo: { 'docs/a.png': png(1000) },
    artifact: { 'docs/a.png': content },
    manifest: { files: [{ path: 'docs/a.png', sha256: sha(content), size: content.length + 1 }] },
  });
  assert.ok(rejectedWith(wrongSize.run(), 'size does not match'));
  const wrongHash = scenario({
    repo: { 'docs/a.png': png(1000) },
    artifact: { 'docs/a.png': content },
    manifest: { files: [{ path: 'docs/a.png', sha256: sha(Buffer.from('other')), size: content.length }] },
  });
  assert.ok(rejectedWith(wrongHash.run(), 'sha256 does not match'));
});

test('rejects output that is not smaller than the original', () => {
  const s = scenario({
    repo: { 'docs/a.png': png(100) },
    artifact: { 'docs/a.png': png(100) },
  });
  const result = s.run();
  assert.ok(rejectedWith(result, 'not smaller'));
  assert.deepEqual(s.read('docs/a.png'), png(100));
});

test('rejects bytes that do not match the extension', () => {
  const s = scenario({
    repo: { 'docs/a.png': png(1000) },
    artifact: { 'docs/a.png': Buffer.from('<html>not a png</html>') },
  });
  const result = s.run();
  assert.ok(rejectedWith(result, 'not a PNG'));
  assert.deepEqual(s.read('docs/a.png'), png(1000));
});

test('rejects an artifact built for another commit, a bad manifest, and a missing one', () => {
  const other = scenario({
    repo: { 'docs/a.png': png(1000) },
    artifact: { 'docs/a.png': png(10) },
    manifest: { head_sha: 'b'.repeat(40) },
  });
  assert.equal(other.run().state, 'invalid');

  const missing = scenario({ repo: { 'docs/a.png': png(1000) } });
  fs.rmSync(path.join(missing.artifactDir, 'manifest.json'));
  assert.equal(missing.run().state, 'missing');

  const broken = scenario({ repo: { 'docs/a.png': png(1000) } });
  fs.writeFileSync(path.join(broken.artifactDir, 'manifest.json'), '{ not json');
  assert.equal(broken.run().state, 'invalid');

  const huge = scenario({ repo: { 'docs/a.png': png(1000) } });
  fs.writeFileSync(path.join(huge.artifactDir, 'manifest.json'), Buffer.alloc(MAX_MANIFEST_BYTES + 1, 32));
  assert.equal(huge.run().state, 'invalid');

  const wrongVersion = scenario({ repo: { 'docs/a.png': png(1000) }, manifest: { version: 2 } });
  assert.equal(wrongVersion.run().state, 'invalid');
});

test('rejects a manifest that lists a path twice or has too many files', () => {
  const content = png(10);
  const entry = { path: 'docs/a.png', sha256: sha(content), size: content.length };
  const twice = scenario({
    repo: { 'docs/a.png': png(1000) },
    artifact: { 'docs/a.png': content },
    manifest: { files: [entry, entry] },
  });
  assert.equal(twice.run().state, 'invalid');
  const many = scenario({
    repo: { 'docs/a.png': png(1000) },
    manifest: { files: Array.from({ length: MAX_FILES + 1 }, (_, i) => ({ ...entry, path: `docs/${i}.png` })) },
  });
  assert.equal(many.run().state, 'invalid');
});

test('an SVG with anything executable is rejected, a clean one is applied', () => {
  const clean = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1"/></svg>');
  const original = Buffer.from(`${clean.toString()}${' '.repeat(500)}`);
  const ok = scenario({ repo: { 'docs/a.svg': original }, artifact: { 'docs/a.svg': clean } });
  assert.deepEqual(ok.run().applied, ['docs/a.svg']);
  const attacks = {
    script: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    handler: '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>',
    href: '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"/></svg>',
    foreign: '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div/></foreignObject></svg>',
  };
  for (const [name, svg] of Object.entries(attacks)) {
    const s = scenario({
      repo: { 'docs/a.svg': Buffer.from(svg + ' '.repeat(500)) },
      artifact: { 'docs/a.svg': Buffer.from(svg) },
    });
    const result = s.run();
    assert.deepEqual(result.applied, [], name);
    assert.ok(rejectedWith(result, 'SVG contains'), name);
  }
});

test('results are sanitized: unknown files dropped, strings bounded, control characters removed', () => {
  const s = scenario({
    repo: { 'docs/a.png': png(1000) },
    manifest: {
      results: [
        { file: 'docs/a.png', before: 10, after: 5, replaced: true },
        { file: 'docs/a.png', before: 10, after: 10, replaced: false, error: `bad\n${'x'.repeat(1000)}` },
        { file: 'elsewhere.png', before: 1, after: 1, replaced: false },
        { file: 'docs/a.png', before: 'many', after: 1, replaced: false },
        null,
      ],
    },
  });
  const { results } = s.run();
  assert.equal(results.length, 2);
  assert.equal(results[1].error.length, 300);
  assert.ok(!results[1].error.includes('\n'));
});

test('sniff accepts real headers for each supported type', () => {
  const cases = {
    'a.png': PNG_MAGIC,
    'a.jpg': Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    'a.jpeg': Buffer.from([0xff, 0xd8, 0xff, 0xe1]),
    'a.gif': Buffer.from('GIF89a....'),
    'a.webp': Buffer.from('RIFF\0\0\0\0WEBPVP8 '),
    'a.avif': Buffer.from('\0\0\0\x1cftypavif'),
    'a.mp4': Buffer.from('\0\0\0\x20ftypisom'),
    'a.mov': Buffer.from('\0\0\0\x14ftypqt  '),
    'a.webm': Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01]),
  };
  for (const [name, bytes] of Object.entries(cases)) assert.equal(sniff(name, bytes), null, name);
  assert.equal(sniff('a.mp4', Buffer.from('plain text file')), 'not an MP4 or MOV');
});

// --- pack-artifact.mjs, in a real temporary git repository ---
const here = path.dirname(fileURLToPath(import.meta.url));
const pack = path.join(here, 'pack-artifact.mjs');
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8' });

function repoWith(files) {
  const dir = path.join(root, `repo${++counter}`);
  fs.mkdirSync(dir, { recursive: true });
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.email', 't@example.com');
  git(dir, 'config', 'user.name', 't');
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  }
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'init');
  return dir;
}

test('pack-artifact packs the modified files and their hashes, and always writes a manifest', () => {
  const dir = repoWith({ 'docs/a.png': png(1000), 'docs/b.png': png(1000, 2), 'README.md': Buffer.from('x') });
  const smaller = png(100);
  fs.writeFileSync(path.join(dir, 'docs/a.png'), smaller);
  fs.writeFileSync(path.join(dir, 'untracked.png'), png(5));
  const out = path.join(dir, '..', `out${counter}`);
  execFileSync(process.execPath, [pack, '--out', out, '--head-sha', HEAD], { cwd: dir });
  const manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'));
  assert.equal(manifest.head_sha, HEAD);
  assert.deepEqual(manifest.files, [{ path: 'docs/a.png', sha256: sha(smaller), size: smaller.length }]);
  assert.deepEqual(fs.readFileSync(path.join(out, 'files/docs/a.png')), smaller);

  const clean = repoWith({ 'docs/a.png': png(1000) });
  const out2 = path.join(clean, '..', `out${counter}b`);
  execFileSync(process.execPath, [pack, '--out', out2, '--head-sha', HEAD], { cwd: clean });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out2, 'manifest.json'), 'utf8')).files, []);
});

test('pack and apply agree end to end', () => {
  const dir = repoWith({ 'docs/a.png': png(1000) });
  fs.writeFileSync(path.join(dir, 'docs/a.png'), png(100));
  const out = path.join(dir, '..', `e2e${counter}`);
  execFileSync(process.execPath, [pack, '--out', out, '--head-sha', HEAD], { cwd: dir });
  git(dir, 'checkout', '-q', '--', 'docs/a.png');
  const result = applyArtifact({ artifactDir: out, cwd: dir, headSha: HEAD, allowed: ['docs/a.png'] });
  assert.deepEqual(result.applied, ['docs/a.png']);
  assert.deepEqual(fs.readFileSync(path.join(dir, 'docs/a.png')), png(100));
});

test('measured dimensions: only well-formed entries survive', () => {
  const good = sha(Buffer.from('a'));
  const out = sanitizeDimensions({
    [good]: { width: 640, height: 480, extra: '<script>' },
    [sha(Buffer.from('b'))]: { width: 0, height: 5 },
    [sha(Buffer.from('c'))]: { width: 5.5, height: 5 },
    [sha(Buffer.from('d'))]: { width: '5', height: 5 },
    [sha(Buffer.from('e'))]: { width: 100000, height: 5 },
    [sha(Buffer.from('f'))]: null,
    'not-a-hash': { width: 5, height: 5 },
    [sha(Buffer.from('g')).toUpperCase()]: { width: 5, height: 5 },
  });
  assert.deepEqual(out, { [good]: { width: 640, height: 480 } });
  for (const bad of [null, undefined, [], 'x', 5]) assert.deepEqual(sanitizeDimensions(bad), {});
});

test('dimensions travel through the manifest and come back sanitized', () => {
  const content = png(200);
  const optimized = png(100);
  const s = scenario({
    repo: { 'docs/a.png': content },
    artifact: { 'docs/a.png': optimized },
    manifest: { dimensions: { [sha(optimized)]: { width: 10, height: 20 }, junk: { width: 1, height: 1 } } },
  });
  const result = s.run();
  assert.equal(result.state, 'ok');
  assert.deepEqual(result.dimensions, { [sha(optimized)]: { width: 10, height: 20 } });
});

test('an artifact without dimensions gives none, and a bad manifest gives none', () => {
  assert.deepEqual(scenario({}).run().dimensions, {});
  const s = scenario({ manifest: { version: 2 } });
  assert.deepEqual(s.run().dimensions, {});
});
