// Reads pointer files: small text files that stand in for a binary asset stored in object storage.
//
//   s3-asset v1
//   sha256 <hex>
//   size <bytes>
//   key <path of the object under the base URL>
//   width <px>      (optional, images only)
//   height <px>     (optional, images only)
const fs = require('node:fs');
const { Buffer } = require('node:buffer');

// A pointer is a few lines of text, so only the start of a file is read: real assets can be 17 MB.
const HEAD_BYTES = 512;

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
  if (!/^[1-9]\d*$/.test(fields[name])) {
    throw new Error(`Pointer file ${file} has an invalid "${name}" line.`);
  }
  return Number(fields[name]);
}

// Returns the pointer's fields, or null when the file is not a pointer (a real asset).
function parsePointer(head, file) {
  if (!/^s3-asset v1\r?\n/.test(head)) {
    // A newer pointer format must not slip through as if it were the asset itself.
    if (/^s3-asset v\d/.test(head)) {
      throw new Error(`${file} uses an unsupported pointer version.`);
    }
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

module.exports = { parsePointer, readPointer };
