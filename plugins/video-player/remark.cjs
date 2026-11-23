// Remark plugin: renames every JSX `<video>` in MDX to the registered `Video` component, so content
// keeps plain HTML and the site renders it with the Video.js player.
//
// Why a plugin: MDX applies the `components` map only to elements that markdown syntax produces
// (`![]()`, `# heading`, ...). A `<video>` written as JSX is never looked up there, so mapping
// `video` in src/theme/MDXComponents would silently do nothing. Register this under
// `beforeDefaultRemarkPlugins` for docs, blog and feature announcements.
const JSX_ELEMENTS = new Set(['mdxJsxFlowElement', 'mdxJsxTextElement']);

function rename(node) {
  if (JSX_ELEMENTS.has(node.type) && node.name === 'video') {
    node.name = 'Video';
  }
  if (node.children) {
    node.children.forEach(rename);
  }
}

module.exports = function videoPlayer() {
  return (tree) => rename(tree);
};
