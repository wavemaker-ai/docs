// Asset size policy and optimization settings shared by check-sizes.mjs and optimize.mjs.
// CI always runs these from the base branch, so edits here take effect only after they merge.

const KB = 1024;
const MB = 1024 * KB;

export const LIMITS = {
  image: {
    label: 'Image',
    maxBytes: 2 * MB,
    extensions: ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg'],
  },
  gif: { label: 'GIF', maxBytes: 10 * MB, extensions: ['.gif'] },
  video: {
    label: 'Video',
    maxBytes: 50 * MB,
    extensions: ['.mp4', '.webm', '.mov'],
  },
};

export const OPTIMIZE = {
  // Raster images wider than this are downscaled (2x a ~1200px content column).
  maxImageWidth: 2400,
  maxGifWidth: 1600,
  maxVideoWidth: 1920,
  pngPaletteQuality: 85,
  jpegQuality: 80,
  webpQuality: 80,
  // sharp GIF encoder: 1-10, higher is smaller but much slower on long GIFs.
  gifEffort: 4,
  // Pixel difference (0-32) treated as unchanged between frames; higher is smaller and lossier.
  gifInterFrameMaxError: 8,
  videoCrf: 28,
  // x264 preset for MP4: slower is smaller at the same quality, but encodes take much longer.
  videoPreset: 'slow',
  // Keep the original unless the optimized file is at least this much smaller.
  minSavingsRatio: 0.1,
};

export function categoryFor(file) {
  const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
  return Object.entries(LIMITS).find(([, rule]) =>
    rule.extensions.includes(ext),
  )?.[0];
}

export function formatBytes(bytes) {
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`;
  return `${(bytes / KB).toFixed(0)} KB`;
}
