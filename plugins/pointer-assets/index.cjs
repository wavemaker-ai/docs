// Docusaurus plugin: resolves pointer files (text files standing in for a binary asset that lives in
// object storage) to their remote URL. Uses only the public `configureWebpack` hook.
const { EXTENSIONS } = require('./pointer.cjs');

// Built from the shared extension list, so the rule matches exactly the types a pointer may have.
// SVG is left out on purpose: it is imported as a React component and stays in the repo.
const POINTER_TYPES = new RegExp(
  `\\.(?:${EXTENSIONS.map((ext) => ext.slice(1)).join('|')})$`,
  'i',
);

module.exports = function pointerAssets(_context, options) {
  return {
    name: 'pointer-assets',
    configureWebpack() {
      return {
        module: {
          rules: [
            {
              test: POINTER_TYPES,
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
