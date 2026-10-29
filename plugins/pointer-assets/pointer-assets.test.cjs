const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const { parsePointer } = require('./pointer.cjs');
const loader = require('./loader.cjs');
const pointerImages = require('./remark.cjs');

const POINTER = 's3-asset v1\nsha256 aa\nsize 10\nkey docs/a/b.png\n';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pointer-assets-'));
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

function write(name, content) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, content);
  return file;
}

function pitch(file, baseUrl = 'https://cdn.example') {
  return loader.pitch.call({ resourcePath: file, getOptions: () => ({ baseUrl }) });
}

test('parsePointer reads the fields, with CRLF and without a final newline', () => {
  assert.deepEqual(parsePointer(POINTER, 'x'), {
    sha256: 'aa',
    size: 10,
    key: 'docs/a/b.png',
    width: undefined,
    height: undefined,
  });
  const crlf = parsePointer('s3-asset v1\r\nsha256 aa\r\nsize 1\r\nkey k.png\r\nwidth 640\r\nheight 480', 'x');
  assert.equal(crlf.key, 'k.png');
  assert.equal(crlf.width, 640);
  assert.equal(crlf.height, 480);
});

test('parsePointer returns null for real files and empty files', () => {
  assert.equal(parsePointer('\u0089PNG\r\n', 'x'), null);
  assert.equal(parsePointer('', 'x'), null);
});

test('parsePointer rejects broken and unknown pointers', () => {
  assert.throws(() => parsePointer('s3-asset v1\nsha256 aa\nsize 1\n', 'x'), /no "key" line/);
  assert.throws(() => parsePointer('s3-asset v2\nkey a\n', 'x'), /unsupported pointer version/);
  assert.throws(() => parsePointer('s3-asset v10\nkey a\n', 'x'), /unsupported pointer version/);
  assert.throws(
    () => parsePointer('s3-asset v1\nsha256 aa\nsize 1\nkey k\nwidth 0\n', 'x'),
    /invalid "width" line/,
  );
});

test('loader returns the URL for a pointer and nothing for a real file', () => {
  assert.equal(
    pitch(write('pointer.png', POINTER)),
    'export default "https://cdn.example/docs/a/b.png";',
  );
  assert.equal(
    pitch(write('slash.png', POINTER), 'https://cdn.example///'),
    'export default "https://cdn.example/docs/a/b.png";',
  );
  assert.equal(pitch(write('real.png', Buffer.alloc(100000, 1))), undefined);
});

test('loader fails for a pointer when no base URL is configured', () => {
  assert.throws(() => pitch(write('nobase.png', POINTER), ''), /has no baseUrl/);
});

test('loader passes the other loaders output through', () => {
  assert.equal(loader('module.exports = "x"'), 'module.exports = "x"');
  assert.equal(loader.raw, true);
});

function transform(markdownName, url, extra = {}) {
  const image = { type: 'image', url, alt: 'A "quoted" alt', title: null, ...extra };
  const tree = { type: 'root', children: [{ type: 'paragraph', children: [image] }] };
  pointerImages()(tree, { path: path.join(dir, markdownName) });
  return tree.children[0].children[0];
}

test('remark plugin turns a pointer image into an <img> with its size', () => {
  write('sized.png', `${POINTER}width 640\nheight 480\n`);
  const node = transform('page.md', './sized.png');
  assert.equal(node.type, 'mdxJsxTextElement');
  assert.equal(node.name, 'img');
  const attrs = Object.fromEntries(node.attributes.map((a) => [a.name, a.value]));
  assert.equal(attrs.alt, 'A &quot;quoted&quot; alt');
  assert.equal(attrs.src.value, 'require("./sized.png").default');
  assert.equal(attrs.width, '640');
  assert.equal(attrs.height, '480');
});

test('remark plugin omits the size when the pointer has none, and decodes the URL', () => {
  write('with space.png', POINTER);
  const node = transform('page.md', 'with%20space.png');
  const names = node.attributes.map((a) => a.name);
  assert.deepEqual(names, ['alt', 'src']);
  assert.equal(node.attributes[1].value.value, 'require("./with space.png").default');
});

test('remark plugin leaves real images, remote images and missing files alone', () => {
  write('photo.png', Buffer.alloc(2000, 1));
  for (const url of ['./photo.png', 'https://example.com/a.png', '/img/logo.png', './missing.png']) {
    assert.equal(transform('page.md', url).type, 'image', url);
  }
});
