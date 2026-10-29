# pointer-assets

Lets a text "pointer file" stand in for a binary asset (image, GIF, video) that lives in object
storage. The pointer sits at the asset's original path, so pages reference it exactly as before
(`![alt](./assets/img/a.png)`, `require('./assets/vids/a.mp4').default`, `import a from './a.png'`).
At build time the file resolves to `<base URL>/<key>`; nothing is copied into `build/`.

## Pointer format

```
s3-asset v1
sha256 3f9c2d1a...
size 693120
key docs/x/assets/img/a.3f9c2d1a1b2c.png
width 1280
height 720
```

`sha256`, `size` and `key` are required. `width` and `height` are optional and apply to images: they
become the `<img>` size attributes, which stops the page from jumping while the image loads. A file
that does not start with `s3-asset v1` is treated as a real asset and built as usual. An unknown
version, a missing field or a pointer without a base URL fails the build.

## Parts

| File          | Role                                                                                                                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.cjs`   | Docusaurus plugin. Adds one `enforce: 'post'` rule for raster images and video through `configureWebpack`.                                                                                                                   |
| `loader.cjs`  | Pitching loader. Returns `export default "<url>"` for a pointer and skips every other loader.                                                                                                                                |
| `remark.cjs`  | Markdown images. Docusaurus reads image sizes from disk, which fails on a pointer; this builds the `<img>` from the pointer instead. Registered under `beforeDefaultRemarkPlugins` for docs, blog and feature announcements. |
| `pointer.cjs` | Pointer parser shared by the loader and the remark plugin.                                                                                                                                                                   |

## Rules

- The base URL is the `POINTER_ASSETS_BASE_URL` literal in `docusaurus.config.js`. Keep it a literal:
  Rspack's persistent cache is only evicted when that file changes, so an environment variable would
  leave stale URLs in cached modules.
- SVG is not handled. It is imported as a React component and stays in the repo. Pointers under
  `static/` are not supported, because those files are copied as is.
- `npm run build` ends with `scripts/check-pointer-leaks.js`, which fails if any pointer ended up in
  `build/`. That is the check that catches a Docusaurus upgrade breaking this setup.
- `npm run test:pointer-assets` runs the unit tests.

## Docusaurus upgrades

The plugin hook is public API. The setup also relies on three internal behaviours, so recheck them
after an upgrade: markdown images still run `enforce: 'post'` loaders despite their inline
`!url-loader…!` prefix; consumers still expect an ES default export; and the markdown image
transform still runs after `beforeDefaultRemarkPlugins`. A change to any of them shows up as a
failing leak check or as images without `src`.
