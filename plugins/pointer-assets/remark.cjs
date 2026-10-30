// Remark plugin for markdown images whose file is a pointer. Docusaurus reads an image's size from
// the file on disk, which fails on a pointer, so it logs a warning and renders the <img> without
// width and height (the page then jumps as the image loads). This plugin turns such an image into
// the same <img> element up front, with the size taken from the pointer file. Register it under
// `beforeDefaultRemarkPlugins`, so it runs before Docusaurus's own image transform.
const fs = require('node:fs');
const path = require('node:path');
const { readPointer } = require('../../scripts/assets/pointer.cjs');

// Same escaping as Docusaurus applies to the alt and title of a markdown image.
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function requireExpression(request) {
  return {
    type: 'mdxJsxAttributeValueExpression',
    value: `require(${JSON.stringify(request)}).default`,
    data: {
      estree: {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'MemberExpression',
              object: {
                type: 'CallExpression',
                callee: { type: 'Identifier', name: 'require' },
                arguments: [
                  {
                    type: 'Literal',
                    value: request,
                    raw: JSON.stringify(request),
                  },
                ],
                optional: false,
              },
              property: { type: 'Identifier', name: 'default' },
              computed: false,
              optional: false,
            },
          },
        ],
        sourceType: 'module',
        comments: [],
      },
    },
  };
}

// The file a markdown image URL points to and the request to load it by, for a relative path to
// an existing file; null otherwise.
function localImagePath(url, markdownFile) {
  if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('/')) return null;
  if (url.startsWith('@site/')) return null;
  const pathname = url.split(/[?#]/)[0];
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const file = path.join(path.dirname(markdownFile), decoded);
  try {
    if (!fs.statSync(file).isFile()) return null;
  } catch {
    return null;
  }
  // Bare relative paths ("assets/a.png") are requested as "./assets/a.png".
  const request = /^\.\.?\//.test(decoded) ? decoded : `./${decoded}`;
  return { file, request };
}

function toImageElement(node, pointer, request) {
  const attributes = [];
  if (node.alt) {
    attributes.push({ type: 'mdxJsxAttribute', name: 'alt', value: escapeHtml(node.alt) });
  }
  attributes.push({ type: 'mdxJsxAttribute', name: 'src', value: requireExpression(request) });
  if (node.title) {
    attributes.push({ type: 'mdxJsxAttribute', name: 'title', value: escapeHtml(node.title) });
  }
  if (pointer.width) {
    attributes.push({ type: 'mdxJsxAttribute', name: 'width', value: String(pointer.width) });
  }
  if (pointer.height) {
    attributes.push({ type: 'mdxJsxAttribute', name: 'height', value: String(pointer.height) });
  }
  return { type: 'mdxJsxTextElement', name: 'img', attributes, children: [] };
}

function visit(node, callback) {
  if (!node.children) return;
  node.children.forEach((child, index) => {
    if (child.type === 'image') {
      const replacement = callback(child);
      if (replacement) node.children[index] = replacement;
    } else {
      visit(child, callback);
    }
  });
}

module.exports = function pointerImages() {
  return (tree, file) => {
    if (!file.path) return;
    visit(tree, (node) => {
      const local = localImagePath(node.url, file.path);
      if (!local) return undefined;
      const pointer = readPointer(local.file);
      return pointer ? toImageElement(node, pointer, local.request) : undefined;
    });
  };
};
