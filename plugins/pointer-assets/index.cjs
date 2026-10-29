// Docusaurus plugin: resolves pointer files (text files standing in for a binary asset that lives in
// object storage) to their remote URL. Uses only the public `configureWebpack` hook.
module.exports = function pointerAssets(_context, options) {
  return {
    name: 'pointer-assets',
    configureWebpack() {
      return {
        module: {
          rules: [
            {
              // SVG is left out on purpose: it is imported as a React component and stays in the repo.
              test: /\.(?:jpe?g|png|gif|webp|avif|mp4|webm|mov|m4v|ogv)$/i,
              enforce: 'post',
              use: [
                {
                  loader: require.resolve('./loader.cjs'),
                  options: { baseUrl: options.baseUrl },
                },
              ],
            },
          ],
        },
      };
    },
  };
};
