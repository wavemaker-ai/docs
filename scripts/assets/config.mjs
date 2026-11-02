// Asset size policy and optimization settings shared by check-sizes.mjs and optimize.mjs.
// CI runs these from the default branch (see the TEMPORARY note in .github/workflows/assets.yaml), so
// edits here take effect only after they merge into it.

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
  // Wider than the images' cap on purpose: a video is shown full column width, which is about 2200
  // device pixels on a retina screen, and screen recordings full of text and thin box borders go soft
  // when scaled below that (at 1920 wide, lowering the CRF no longer helped: only the width did).
  maxVideoWidth: 2560,
  pngPaletteQuality: 85,
  jpegQuality: 80,
  webpQuality: 80,
  // sharp GIF encoder: 1-10, higher is smaller but much slower on long GIFs.
  gifEffort: 4,
  // Pixel difference (0-32) treated as unchanged between frames; higher is smaller and lossier.
  gifInterFrameMaxError: 8,
  // x264 CRF for MP4 (WebM adds 6): lower is sharper and larger. At 2560 wide, 28 is visually the same
  // as 26 on text and thin borders (checked on screen recordings) and about 14% smaller.
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
