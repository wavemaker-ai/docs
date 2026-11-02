#!/usr/bin/env node
// Decode-job helper: measures the width and height of the images a PR changes, so the replace flow
// can write them into pointer files. Measuring means decoding untrusted images, so it runs here, in
// the job that holds no secrets, and the result travels in the artifact as data that the publish job
// validates (see apply-artifact.mjs) and only uses for a file with exactly the measured bytes.
//
// Usage (inside the PR checkout, after optimize.mjs, from a folder where `sharp` is installed):
//   node measure-dimensions.mjs --base <ref> --out <dimensions.json>
// The output is { "<sha256 of the file>": { "width": n, "height": n } }. A file that cannot be read
// as an image is left out: a pointer without dimensions is fine.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { classifyAssets, parseArgs } from './changed-assets.mjs';
import { LIMITS } from './config.mjs';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif'];
const MAX_PIXELS = 100_000_000;

// Returns { width, height } for one file, or null. The first frame's size for animated formats.
export async function measure(file) {
  const ext = path.extname(file).toLowerCase();
  if (!IMAGE_EXTENSIONS.includes(ext)) return null;
  try {
    if (!fs.lstatSync(file).isFile()) return null;
    const category = Object.values(LIMITS).find((rule) => rule.extensions.includes(ext));
    if (category && fs.statSync(file).size > category.maxBytes) return null;
    const { width, height } = await sharp(file, { limitInputPixels: MAX_PIXELS, failOn: 'error' }).metadata();
    return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 ? { width, height } : null;
  } catch {
    return null;
  }
}

export async function measureAll(files) {
  const out = {};
  for (const file of files) {
    const size = await measure(file);
    if (size) out[crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')] = size;
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.out) {
    console.error('Usage: measure-dimensions.mjs --base <ref> --out <dimensions.json>');
    process.exit(2);
  }
  const { pending } = classifyAssets({ base: args.base, head: 'HEAD', files: [] });
  const dimensions = await measureAll(pending.map((a) => a.file));
  fs.writeFileSync(args.out, JSON.stringify(dimensions, null, 2));
  console.log(`Measured ${Object.keys(dimensions).length} image(s).`);
}
