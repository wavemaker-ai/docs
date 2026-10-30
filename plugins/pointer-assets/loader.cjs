// Pitching loader: when the requested file is a pointer, skip every other loader and return the
// file's remote URL as the module's default export. Real files fall through untouched.
const { readPointer, urlFor } = require('../../scripts/assets/pointer.cjs');

// A post loader's normal phase runs last, so it must hand the other loaders' output through as is.
module.exports = function (source) {
  return source;
};
module.exports.raw = true;

module.exports.pitch = function () {
  // Registered first: a loader whose pitch returns early never reads the resource itself, so
  // without this the bundler would not watch the pointer file, and an edit to it would not rebuild.
  this.addDependency(this.resourcePath);

  const pointer = readPointer(this.resourcePath);
  if (!pointer) return undefined;

  const { baseUrl } = this.getOptions();
  if (!baseUrl) {
    throw new Error(
      `${this.resourcePath} is a pointer file but the pointer-assets plugin has no baseUrl.`,
    );
  }
  return `export default ${JSON.stringify(urlFor(baseUrl, pointer.key))};`;
};
