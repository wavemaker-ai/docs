// Everything that defines a pointer file, in one place. The webpack rule, the loader, the remark
// plugin, the pointer check in CI and (later) the upload code all use these definitions, so a rule
// can never be stricter in one place than in another.
//
// A pointer is a small text file that stands in for a binary asset stored in object storage:
//
//   s3-asset v1
//   sha256 <64 hex characters: the stored object>
//   size <bytes of the stored object>
//   key <repo-relative path with the hash before the extension>
//   width <px>      (optional, images)
//   height <px>     (optional, images)
//
// The key mirrors the asset's repository path, so repo file
// docs/studio/assets/img/a.png is stored as docs/studio/assets/img/a.<first 12 hex of sha256>.png.
// The hash makes every version of a file a separate, immutable object: a replaced image never
// overwrites the old one, and an unmerged PR cannot change what the live site shows. The base URL
// (see docusaurus.config.js) carries the bucket and the repository-name prefix.
const fs = require('node:fs');
const { Buffer } = require('node:buffer');

// File types a pointer may stand in for: the supported asset types minus SVG, which is imported as a
// React component and stays in the repository. A test keeps this list equal to scripts/assets/config.mjs.
const EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.mp4', '.webm', '.mov'];

// Top-level folders that can hold pointers. `static/` is not one of them: those files are copied
// into the build as they are, so a pointer there would be served as text.
const KEY_FOLDERS = ['docs', 'blogs', 'assets', 'src'];

const SEGMENT = /^[A-Za-z0-9._-]+$/;
const HASH_LENGTH = 12;
// A pointer is a few lines of text, so only the start of a file is read: real assets can be 17 MB.
const HEAD_BYTES = 512;
const MAX_KEY_LENGTH = 1024;

// Why a key is not acceptable for a pointer with this sha256, or null when it is.
function keyError(key, sha256) {
  if (typeof key !== 'string' || key.length === 0 || key.length > MAX_KEY_LENGTH)
    return 'the key is missing or too long';
  const segments = key.split('/');
  if (segments.length < 2) return 'the key has no folder';
  if (!KEY_FOLDERS.includes(segments[0]))
    return `the key must start with one of ${KEY_FOLDERS.join(', ')}`;
  for (const segment of segments) {
    if (segment === '.' || segment === '..' || !SEGMENT.test(segment))
      return 'the key has an empty, relative or unsafe path segment';
  }
  const match = /^(.+)\.([0-9a-f]{12})(\.[A-Za-z0-9]+)$/.exec(segments.at(-1));
  if (!match) return 'the file name must be <name>.<12 hex characters>.<extension>';
  if (!EXTENSIONS.includes(match[3].toLowerCase()))
    return `the extension ${match[3]} is not a supported asset type`;
  if (match[2] !== sha256.slice(0, HASH_LENGTH))
    return 'the hash in the key does not match sha256';
  return null;
}

// The public URL of an object. Segments are encoded one by one; a validated key needs no encoding,
// but this never trusts that.
function urlFor(baseUrl, key) {
  return `${baseUrl.replace(/\/+$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function readHead(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const buffer = Buffer.alloc(HEAD_BYTES);
    const read = fs.readSync(fd, buffer, 0, HEAD_BYTES, 0);
    return buffer.subarray(0, read).toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

function dimension(fields, name, file) {
  if (fields[name] === undefined) return undefined;
  if (!/^[1-9]\d{0,5}$/.test(fields[name])) {
    throw new Error(`Pointer file ${file} has an invalid "${name}" line.`);
  }
  return Number(fields[name]);
}

// True when the text is the start of a pointer file, of any version.
function looksLikePointer(head) {
  return /^s3-asset v\d/.test(head);
}

// Returns the pointer's fields, or null when the file is not a pointer (a real asset). Throws a
// readable error for a pointer that is malformed or uses an unknown version.
function parsePointer(head, file) {
  if (!/^s3-asset v1\r?\n/.test(head)) {
    // A newer pointer format must not slip through as if it were the asset itself.
    if (looksLikePointer(head)) throw new Error(`${file} uses an unsupported pointer version.`);
    return null;
  }
  const fields = {};
  for (const line of head.split(/\r?\n/).slice(1)) {
    const match = line.match(/^(\w+) (.+)$/);
    if (match) fields[match[1]] = match[2].trim();
  }
  for (const name of ['sha256', 'size', 'key']) {
    if (!fields[name]) throw new Error(`Pointer file ${file} has no "${name}" line.`);
  }
  if (!/^[0-9a-f]{64}$/.test(fields.sha256))
    throw new Error(`Pointer file ${file} has an invalid "sha256" line (64 lowercase hex characters expected).`);
  if (!/^[1-9]\d{0,11}$/.test(fields.size))
    throw new Error(`Pointer file ${file} has an invalid "size" line.`);
  const problem = keyError(fields.key, fields.sha256);
  if (problem) throw new Error(`Pointer file ${file} has an invalid "key" line: ${problem}.`);
  return {
    sha256: fields.sha256,
    size: Number(fields.size),
    key: fields.key,
    width: dimension(fields, 'width', file),
    height: dimension(fields, 'height', file),
  };
}

function readPointer(file) {
  return parsePointer(readHead(file), file);
}

// The base URL, read as DATA from the text of docusaurus.config.js: one regex on one literal (the
// string may sit on the line after the `=`, which is where prettier puts a long one). The
// config is never required, imported or evaluated, so reading a pull request's copy cannot run its
// code. Zero or several matches fail, and so does a config that does not hand that constant to the
// plugin, because then the literal would not be what the build uses.
function extractBaseUrl(configText) {
  const literal = /^const POINTER_ASSETS_BASE_URL =\s*'([^'\r\n]*)';[ \t]*$/gm;
  const found = [...configText.matchAll(literal)];
  if (found.length !== 1)
    throw new Error(
      `expected exactly one "const POINTER_ASSETS_BASE_URL = '...';" declaration, found ${found.length}`,
    );
  if (!/\{ baseUrl: POINTER_ASSETS_BASE_URL \}/.test(configText))
    throw new Error('the config does not pass POINTER_ASSETS_BASE_URL to the pointer-assets plugin');
  return found[0][1];
}

module.exports = {
  EXTENSIONS,
  KEY_FOLDERS,
  extractBaseUrl,
  keyError,
  looksLikePointer,
  parsePointer,
  readHead,
  readPointer,
  urlFor,
};
