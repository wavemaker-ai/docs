// Docusaurus plugin: lets a page import a WebVTT subtitle file, so it can be used as
// `<track src={subtitlesVideo} />`. Docusaurus has no rule for `.vtt` and would fail the build with a
// parse error. The file is emitted as-is under `assets/subtitles/` with a content hash in its name.
//
// Subtitle files stay in the repository (they are small text, not pipeline assets) and are always
// served from the docs host, so `<track>` never becomes cross-origin even when a video is a pointer.
module.exports = function vttAssets() {
  return {
    name: 'vtt-assets',
    configureWebpack() {
      return {
        module: {
          rules: [
            {
              test: /\.vtt$/i,
              type: 'asset/resource',
              generator: { filename: 'assets/subtitles/[name].[hash:8][ext]' },
            },
          ],
        },
      };
    },
  };
};
