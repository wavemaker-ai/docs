// Reads just enough of a PNG file to tell whether it is animated (APNG). sharp keeps only the first
// frame of an APNG, so re-encoding one would silently turn an animation into a still image: such
// files must be left as they are. Imports nothing but node:fs, so tests and CI scripts can load it
// without the optimizer packages.

import fs from 'node:fs';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// The animation control chunk (acTL) comes before the first image data chunk. A PNG has only a
// handful of chunks before that, so a short scan is enough.
const MAX_CHUNKS_BEFORE_DATA = 64;

export function isAnimatedPng(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
  } catch {
    return false;
  }
  try {
    const signature = Buffer.alloc(8);
    if (fs.readSync(fd, signature, 0, 8, 0) < 8 || !signature.equals(SIGNATURE))
      return false;
    const header = Buffer.alloc(8);
    let position = 8;
    for (let i = 0; i < MAX_CHUNKS_BEFORE_DATA; i++) {
      if (fs.readSync(fd, header, 0, 8, position) < 8) return false;
      const type = header.toString('latin1', 4, 8);
      if (type === 'acTL') return true;
      if (type === 'IDAT' || type === 'IEND') return false;
      // 4 bytes length + 4 bytes type + data + 4 bytes CRC
      position += 12 + header.readUInt32BE(0);
    }
    return false;
  } finally {
    fs.closeSync(fd);
  }
}
