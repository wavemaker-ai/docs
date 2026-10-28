// Encoders shared by optimize.mjs (CI and `npm run optimize-assets`) and precommit.mjs.
// Importing this module has no side effects.
//
// Dependencies are npm devDependencies only: `sharp`, `svgo`, and `@ffmpeg-installer/ffmpeg`, which ships a
// prebuilt ffmpeg binary per platform.

import ffmpeg from '@ffmpeg-installer/ffmpeg';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { optimize as svgo } from 'svgo';
import { OPTIMIZE } from './config.mjs';

let tmpDir;
let tmpCounter = 0;

function tempDir() {
  tmpDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'wm-assets-'));
  return tmpDir;
}

// Removes the scratch directory used for video encodes.
export function cleanup() {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  tmpDir = undefined;
}

// Whether `output` is small enough to be worth replacing a file of `before` bytes.
export function worthReplacing(output, before) {
  return Boolean(
    output && output.length <= before * (1 - OPTIMIZE.minSavingsRatio),
  );
}

function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, {
    stdio: ['ignore', 'ignore', 'pipe'],
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `${path.basename(cmd)} exited ${result.status}:\n${result.stderr.trim().split('\n').slice(-5).join('\n')}`,
    );
}

async function optimizeRaster(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') {
    // Re-quantizing an already-palette PNG loses quality on every pass; leave it alone.
    const { isPalette, width } = await sharp(file).metadata();
    if (isPalette && width <= OPTIMIZE.maxImageWidth) return null;
  }
  const pipeline = sharp(file, { animated: ext === '.webp' })
    .rotate()
    .resize({ width: OPTIMIZE.maxImageWidth, withoutEnlargement: true });
  if (ext === '.png') {
    return pipeline
      .png({
        palette: true,
        quality: OPTIMIZE.pngPaletteQuality,
        compressionLevel: 9,
        effort: 10,
      })
      .toBuffer();
  }
  if (ext === '.jpg' || ext === '.jpeg')
    return pipeline
      .jpeg({ quality: OPTIMIZE.jpegQuality, mozjpeg: true })
      .toBuffer();
  if (ext === '.webp')
    return pipeline
      .webp({ quality: OPTIMIZE.webpQuality, effort: 6 })
      .toBuffer();
  if (ext === '.avif')
    return pipeline.avif({ quality: OPTIMIZE.webpQuality }).toBuffer();
  return null;
}

function optimizeSvg(file) {
  const { data } = svgo(fs.readFileSync(file, 'utf8'), {
    path: file,
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: { overrides: { removeViewBox: false } },
      },
    ],
  });
  return Buffer.from(data);
}

function optimizeGif(file) {
  // Animated frames are stacked into one tall image, which can exceed sharp's default pixel limit.
  return sharp(file, { animated: true, limitInputPixels: false })
    .resize({ width: OPTIMIZE.maxGifWidth, withoutEnlargement: true })
    .gif({
      effort: OPTIMIZE.gifEffort,
      interFrameMaxError: OPTIMIZE.gifInterFrameMaxError,
    })
    .toBuffer();
}

function optimizeVideo(file) {
  // The binary's package sets the exec bit in a postinstall, which newer npm versions may skip.
  try {
    fs.accessSync(ffmpeg.path, fs.constants.X_OK);
  } catch {
    fs.chmodSync(ffmpeg.path, 0o755);
  }
  const ext = path.extname(file).toLowerCase();
  const out = path.join(tempDir(), `out-${++tmpCounter}${ext}`);
  const codec =
    ext === '.webm'
      ? [
          '-c:v',
          'libvpx-vp9',
          '-crf',
          String(OPTIMIZE.videoCrf + 6),
          '-b:v',
          '0',
          // Row-based multithreading plus a slightly faster speed setting than libvpx's default.
          '-row-mt',
          '1',
          '-deadline',
          'good',
          '-cpu-used',
          '2',
          // 8-bit 4:2:0 (VP9 profile 0) is the only VP9 profile every browser decodes.
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          'libopus',
          '-b:a',
          '96k',
        ]
      : [
          '-c:v',
          'libx264',
          '-preset',
          OPTIMIZE.videoPreset,
          '-crf',
          String(OPTIMIZE.videoCrf),
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          'aac',
          '-b:a',
          '96k',
          '-movflags',
          '+faststart',
        ];
  try {
    run(ffmpeg.path, [
      '-y',
      '-loglevel',
      'error',
      '-i',
      file,
      // Drop container metadata (phone recordings carry GPS location and device info).
      // sharp already strips the equivalent from images.
      '-map_metadata',
      '-1',
      // Round the width down to even: yuv420p needs even dimensions, so an odd-width source
      // narrower than the cap would otherwise fail to encode.
      '-vf',
      `scale='trunc(min(${OPTIMIZE.maxVideoWidth},iw)/2)*2':-2`,
      ...codec,
      out,
    ]);
    return fs.readFileSync(out);
  } finally {
    fs.rmSync(out, { force: true });
  }
}

// Returns the optimized bytes, or null when the format has nothing to do. The caller decides
// whether the result is worth keeping (see worthReplacing).
export async function optimizeFile({ file, category }) {
  if (category === 'gif') return optimizeGif(file);
  if (category === 'video') return optimizeVideo(file);
  if (file.toLowerCase().endsWith('.svg')) return optimizeSvg(file);
  return optimizeRaster(file);
}
