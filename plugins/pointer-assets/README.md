# pointer-assets

Lets a text "pointer file" stand in for a binary asset (image, GIF, video) that lives in the asset
bucket. The pointer sits at the asset's original path, so pages reference it exactly as before
(`![alt](./assets/img/a.png)`, `require('./assets/vids/a.mp4').default`, `import a from './a.png'`).
At build time the file resolves to `<base URL>/<key>`; nothing is copied into `build/`.

Nothing creates pointers yet: the upload and replace flows of the asset pipeline come later. Until a
pointer is committed, this plugin does nothing.

## Pointer format

```
s3-asset v1
sha256 3f9c2d1a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6
size 693120
key docs/studio/workspaces/assets/img/a.3f9c2d1a1b2c.png
width 1280
height 720
```

| Line              | Rule                                                                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `s3-asset v1`     | First line. Any other `s3-asset vN` fails the build.                                                                                                                                                                       |
| `sha256`          | 64 lowercase hex characters: the stored object.                                                                                                                                                                            |
| `size`            | Positive integer, the stored object's bytes. CI compares it with the bucket's `Content-Length`.                                                                                                                            |
| `key`             | The asset's repository path with the first 12 hex characters of `sha256` before the extension, so repo file `docs/studio/workspaces/assets/img/a.png` is stored as `docs/studio/workspaces/assets/img/a.3f9c2d1a1b2c.png`. |
| `width`, `height` | Optional, images only. They become the `<img>` size attributes, which stops the page from jumping while the image loads.                                                                                                   |

The key must start with `docs`, `blogs`, `assets` or `src` (never `static`, whose files are copied
as they are), every segment may use only letters, digits, `.`, `_` and `-` (no `.` or `..` segments),
the hash must equal the start of `sha256`, and the extension must be a supported asset type except
SVG. One definition of these rules, in `pointer.cjs`, serves the build, the remark plugin, the CI
check and the upload code, and a test keeps its extension list equal to `scripts/assets/config.mjs`.

The hash makes every version of a file a separate, immutable object: replacing an image never
overwrites the old object, and an unmerged PR cannot change what the live site shows. A file moved in
the repository keeps its original key, which records where it was first stored.

## Parts

| File                                     | Role                                                                                                                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.cjs`                              | Docusaurus plugin. Adds one `enforce: 'post'` rule for the pointer types through `configureWebpack`.                                                                                                                         |
| `loader.cjs`                             | Pitching loader. Returns `export default "<url>"` for a pointer and skips every other loader. It registers the pointer as a dependency, so editing it rebuilds.                                                              |
| `remark.cjs`                             | Markdown images. Docusaurus reads image sizes from disk, which fails on a pointer; this builds the `<img>` from the pointer instead. Registered under `beforeDefaultRemarkPlugins` for docs, blog and feature announcements. |
| `pointer.cjs`                            | The pointer rules: parser, key rule, URL composer and the base URL extractor.                                                                                                                                                |
| `../../scripts/assets/pointer-check.mjs` | CI check, run by the `pointer-check` job of the Assets workflow.                                                                                                                                                             |
| `../../scripts/check-pointer-leaks.js`   | Runs at the end of `npm run build` and fails if any pointer file ended up in `build/`.                                                                                                                                       |

## Rules

- The base URL is the `POINTER_ASSETS_BASE_URL` constant in `docusaurus.config.js`: the bucket plus the
  repository-name prefix, so a pointer's key is just the repo path with a hash. Keep it a single string
  literal. Rspack's persistent cache is only evicted when that file changes, so an environment
  variable would leave stale URLs in cached modules, and CI reads the declaration as text. Changing
  its host also means changing `ALLOWED_HOSTS` in `scripts/assets/pointer-check.mjs`; a test fails if
  the two disagree.
- SVG is not handled: it is imported as a React component and stays in the repo. Pointers under
  `static/` are not supported.
- Use inline markdown images, `require()` or `import`. Reference-style images are not covered by the
  remark plugin (and Docusaurus does not process them either).
- Do not create or edit pointer files by hand.
- `npm run build` runs the plugin tests and ends with the leak scan. `npm test` runs every test; the
  asset pipeline tests also run in the `Tests` workflow on every PR.

## The CI check

`asset-pointer-check` is set by its own job on every PR run. It checks each pointer file the PR adds
or changes, and every pointer when `docusaurus.config.js` or this folder changes (a new base URL
changes no pointer but breaks every URL).

- Nothing changed: success, "No pointer files changed". The config is not even read, so a PR from a
  branch that predates the base URL constant is fine.
- Otherwise it reads the base URL as text from the PR's config (never evaluates it), requires https
  and an allowlisted host, parses every pointer strictly and sends a `HEAD` request for its object.
  Redirects are never followed.
- **failure**: an invalid pointer, an object that is missing or not public (S3 answers 403 for a
  missing key to anonymous callers, so 403 and 404 are alike), a different size, a redirect, or a base
  URL that is missing or not allowed.
- **error**: the bucket could not be reached after three attempts (5xx, network error, timeout), or
  there are more than 500 pointers. That is not the author's fault, and a re-run can clear it.

## Docusaurus upgrades

The plugin hook is public API. The setup also relies on three internal behaviours, so recheck them
after an upgrade: markdown images still run `enforce: 'post'` loaders despite their inline
`!url-loader…!` prefix; consumers still expect an ES default export; and the markdown image
transform still runs after `beforeDefaultRemarkPlugins`. A change to any of them shows up as a
failing leak check or as images without `src`.
