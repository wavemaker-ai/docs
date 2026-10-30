const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const { pathToFileURL } = require('node:url');
const {
  EXTENSIONS,
  extractBaseUrl,
  keyError,
  looksLikePointer,
  parsePointer,
  urlFor,
} = require('../../scripts/assets/pointer.cjs');
const loader = require('./loader.cjs');
const pointerImages = require('./remark.cjs');
const pluginFactory = require('./index.cjs');

const REPO_ROOT = path.resolve(path.dirname(require.resolve('../../scripts/assets/pointer.cjs')), '..', '..');
const SHA = 'ab12'.repeat(16);
const HASH12 = SHA.slice(0, 12);
const KEY = `docs/guide/assets/img/a.${HASH12}.png`;
const pointer = (over = {}) => {
  const f = { sha256: SHA, size: '10', key: KEY, ...over };
  return (
    's3-asset v1\n' +
    Object.entries(f)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => `${k} ${v}`)
      .join('\n') +
    '\n'
  );
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pointer-assets-'));
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
function write(name, content) {
  const file = path.join(dir, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}

// --- the parser -------------------------------------------------------------------------------

test('parsePointer reads the fields, with CRLF line endings and no final newline', () => {
  assert.deepEqual(parsePointer(pointer(), 'x'), {
    sha256: SHA,
    size: 10,
    key: KEY,
    width: undefined,
    height: undefined,
  });
  const crlf = pointer({ width: '640', height: '480' }).replace(/\n/g, '\r\n').trimEnd();
  const parsed = parsePointer(crlf, 'x');
  assert.equal(parsed.width, 640);
  assert.equal(parsed.height, 480);
});

test('parsePointer returns null for real files and empty files', () => {
  assert.equal(parsePointer('\u0089PNG\r\n', 'x'), null);
  assert.equal(parsePointer('', 'x'), null);
  assert.equal(looksLikePointer('s3-asset v2\n'), true);
  assert.equal(looksLikePointer('PNG'), false);
});

test('parsePointer rejects every malformed or hostile pointer', () => {
  const bad = {
    'a path traversal key': pointer({ key: '../x.png' }),
    'a key with a dot segment': pointer({ key: `docs/../a.${HASH12}.png` }),
    'a full URL as the key': pointer({ key: `https://evil.example/a.${HASH12}.png` }),
    'a key with a space': pointer({ key: `docs/my file.${HASH12}.png` }),
    'a key with an empty segment': pointer({ key: `docs//a.${HASH12}.png` }),
    'a leading slash': pointer({ key: `/docs/a.${HASH12}.png` }),
    'a key without a folder': pointer({ key: `a.${HASH12}.png` }),
    'a folder that cannot hold pointers': pointer({ key: `static/img/a.${HASH12}.png` }),
    'another top-level folder': pointer({ key: `other/a.${HASH12}.png` }),
    'a key without the hash infix': pointer({ key: 'docs/a.png' }),
    'a hash infix that does not match sha256': pointer({ key: 'docs/a.000000000000.png' }),
    'an unsupported extension (m4v)': pointer({ key: `docs/a.${HASH12}.m4v` }),
    'an unsupported extension (svg)': pointer({ key: `docs/a.${HASH12}.svg` }),
    'a non-hex sha256': pointer({ sha256: 'z'.repeat(64) }),
    'an uppercase sha256': pointer({ sha256: SHA.toUpperCase() }),
    'a short sha256': pointer({ sha256: 'ab12' }),
    'a non-numeric size': pointer({ size: 'abc' }),
    'a zero size': pointer({ size: '0' }),
    'a negative size': pointer({ size: '-5' }),
    'no key line': pointer({ key: null }),
    'no sha256 line': pointer({ sha256: null }),
    'no size line': pointer({ size: null }),
    'an invalid width': pointer({ width: '0' }),
    'an unknown version': pointer().replace('s3-asset v1', 's3-asset v2'),
    'a version that only starts like v1': pointer().replace('s3-asset v1', 's3-asset v10'),
  };
  for (const [what, text] of Object.entries(bad)) {
    assert.throws(() => parsePointer(text, 'f.png'), Error, what);
  }
});

test('keyError names the problem and accepts upper-case extensions', () => {
  assert.equal(keyError(KEY, SHA), null);
  assert.equal(keyError(`docs/a/B.${HASH12}.PNG`, SHA), null);
  assert.equal(keyError(`blogs/blog/assets/img/x.${HASH12}.mp4`, SHA), null);
  assert.match(keyError('docs/a.png', SHA), /12 hex/);
  assert.match(keyError('docs/a.000000000000.png', SHA), /does not match sha256/);
  assert.match(keyError(`static/a.${HASH12}.png`, SHA), /must start with/);
});

test('urlFor joins the base URL and the key, encodes segments and tolerates trailing slashes', () => {
  const base = 'https://host.example/docs';
  assert.equal(urlFor(base, KEY), `${base}/${KEY}`);
  assert.equal(urlFor(`${base}///`, KEY), `${base}/${KEY}`);
  assert.equal(urlFor(base, 'docs/a b/c%d.png'), `${base}/docs/a%20b/c%25d.png`);
});

// --- reading the base URL from the config text ---------------------------------------------------

test('extractBaseUrl reads one literal, wrapped or not, and nothing else', () => {
  const wired = '\n{ baseUrl: POINTER_ASSETS_BASE_URL },\n';
  assert.equal(extractBaseUrl(`const POINTER_ASSETS_BASE_URL = 'https://h.example/docs';${wired}`), 'https://h.example/docs');
  assert.equal(extractBaseUrl(`const POINTER_ASSETS_BASE_URL =\n  'https://h.example/docs';${wired}`), 'https://h.example/docs');
});

test('extractBaseUrl fails on zero or several declarations, odd quoting, or a missing wiring', () => {
  const wired = '\n{ baseUrl: POINTER_ASSETS_BASE_URL },\n';
  assert.throws(() => extractBaseUrl(`// nothing here${wired}`), /found 0/);
  assert.throws(
    () => extractBaseUrl(`const POINTER_ASSETS_BASE_URL = 'https://a.example';\nconst POINTER_ASSETS_BASE_URL = 'https://b.example';${wired}`),
    /found 2/,
  );
  assert.throws(() => extractBaseUrl(`const POINTER_ASSETS_BASE_URL = "https://a.example";${wired}`), /found 0/);
  assert.throws(() => extractBaseUrl(`const POINTER_ASSETS_BASE_URL = \`https://a.example/\${x}\`;${wired}`), /found 0/);
  assert.throws(() => extractBaseUrl("const POINTER_ASSETS_BASE_URL = 'https://a.example';"), /does not pass/);
  // Code that merely mentions the name is not a declaration.
  assert.throws(() => extractBaseUrl(`  const POINTER_ASSETS_BASE_URL = 'https://a.example';${wired}`), /found 0/);
});

test('the real config: the extracted literal is what the plugin entry receives', async () => {
  const file = path.join(REPO_ROOT, 'docusaurus.config.js');
  const { default: config } = await import(pathToFileURL(file).href);
  const entry = config.plugins.find((p) => Array.isArray(p) && String(p[0]).includes('pointer-assets'));
  assert.ok(entry, 'the pointer-assets plugin is registered');
  assert.equal(extractBaseUrl(fs.readFileSync(file, 'utf8')), entry[1].baseUrl);
  assert.match(entry[1].baseUrl, /^https:\/\/[^/]+(\/[A-Za-z0-9._-]+)*$/);
});

test('the pointer extension list equals the supported asset types minus SVG', async () => {
  const { LIMITS } = await import(pathToFileURL(path.join(REPO_ROOT, 'scripts/assets/config.mjs')).href);
  const supported = Object.values(LIMITS).flatMap((rule) => rule.extensions).filter((e) => e !== '.svg');
  assert.deepEqual([...EXTENSIONS].sort(), [...supported].sort());
});

// --- the plugin, the loader ---------------------------------------------------------------------

test('the webpack rule matches exactly the pointer types, in any letter case', () => {
  const rule = pluginFactory({}, { baseUrl: 'https://h.example' }).configureWebpack().module.rules[0];
  assert.equal(rule.enforce, 'post');
  for (const ext of EXTENSIONS) assert.ok(rule.test.test(`a/b${ext}`) && rule.test.test(`a/b${ext.toUpperCase()}`), ext);
  for (const name of ['a.svg', 'a.m4v', 'a.ogv', 'a.pdf', 'a.png.txt']) assert.equal(rule.test.test(name), false, name);
});

function pitch(file, baseUrl = 'https://cdn.example/docs') {
  const dependencies = [];
  const out = loader.pitch.call({
    resourcePath: file,
    addDependency: (d) => dependencies.push(d),
    getOptions: () => ({ baseUrl }),
  });
  return { out, dependencies };
}

test('the loader returns the URL for a pointer and nothing for a real file', () => {
  assert.equal(pitch(write('pointer.png', pointer())).out, `export default "https://cdn.example/docs/${KEY}";`);
  assert.equal(pitch(write('slash.png', pointer()), 'https://cdn.example/docs///').out, `export default "https://cdn.example/docs/${KEY}";`);
  assert.equal(pitch(write('real.png', Buffer.alloc(100000, 1))).out, undefined);
});

test('the loader registers the pointer file as a dependency before anything else', () => {
  // A pitch that returns early never reads the file, so without this a webpack watch or a
  // persistent cache would not notice an edit to the pointer.
  const pointerFile = write('dep/pointer.png', pointer());
  const real = write('dep/real.png', Buffer.alloc(50, 1));
  assert.deepEqual(pitch(pointerFile).dependencies, [pointerFile]);
  assert.deepEqual(pitch(real).dependencies, [real]);
  // Even a pointer that fails to parse is watched, so fixing it triggers a rebuild.
  const broken = write('dep/broken.png', 's3-asset v1\nsha256 zz\n');
  const deps = [];
  assert.throws(() => loader.pitch.call({ resourcePath: broken, addDependency: (d) => deps.push(d), getOptions: () => ({ baseUrl: 'https://h.example' }) }));
  assert.deepEqual(deps, [broken]);
});

test('the loader fails for a pointer when no base URL is configured, and passes other output through', () => {
  assert.throws(() => pitch(write('nobase.png', pointer()), '').out, /has no baseUrl/);
  assert.equal(loader('module.exports = "x"'), 'module.exports = "x"');
  assert.equal(loader.raw, true);
});

// --- the remark plugin --------------------------------------------------------------------------

function transform(markdownName, url, extra = {}) {
  const image = { type: 'image', url, alt: 'A "quoted" alt', title: null, ...extra };
  const tree = { type: 'root', children: [{ type: 'paragraph', children: [image] }] };
  pointerImages()(tree, { path: path.join(dir, markdownName) });
  return tree.children[0].children[0];
}

test('the remark plugin turns a pointer image into an <img> with its size', () => {
  write('sized.png', pointer({ width: '640', height: '480' }));
  const node = transform('page.md', './sized.png');
  assert.equal(node.type, 'mdxJsxTextElement');
  assert.equal(node.name, 'img');
  const attrs = Object.fromEntries(node.attributes.map((a) => [a.name, a.value]));
  assert.equal(attrs.alt, 'A &quot;quoted&quot; alt');
  assert.equal(attrs.src.value, 'require("./sized.png").default');
  assert.equal(attrs.width, '640');
  assert.equal(attrs.height, '480');
});

test('the remark plugin omits the size when the pointer has none, and decodes the URL', () => {
  write('with space.png', pointer());
  const node = transform('page.md', 'with%20space.png');
  assert.deepEqual(node.attributes.map((a) => a.name), ['alt', 'src']);
  assert.equal(node.attributes[1].value.value, 'require("./with space.png").default');
});

test('the remark plugin leaves real images, remote images and missing files alone', () => {
  write('photo.png', Buffer.alloc(2000, 1));
  for (const url of ['./photo.png', 'https://example.com/a.png', '/img/logo.png', './missing.png']) {
    assert.equal(transform('page.md', url).type, 'image', url);
  }
});
