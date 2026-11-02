#!/usr/bin/env node
// Publish-job helper: applies the optimizer's output to the PR checkout. The decode job runs the
// optimizer on untrusted media and hands its result over as an artifact, so everything in that
// artifact is untrusted data: a decoder that was exploited can write whatever it likes into it. This
// script decodes nothing. It accepts a file only when ALL of these hold, and reports why otherwise:
//   - its path is exactly one of the files this run may optimize (pendingFiles from pending.mjs);
//   - it is a supported asset type, and the bytes start with that type's magic number;
//   - the artifact copy is a regular file whose size and sha256 match the manifest;
//   - the file in the checkout is a regular file (no symlink, no symlinked directory) and the new
//     copy is strictly smaller;
//   - an SVG contains nothing executable (see below).
//
// Usage (inside the PR checkout, from the trusted copy of the scripts):
//   node apply-artifact.mjs --artifact <dir> --head-sha <sha> --pending <pending.json>
//     --report <out.json> --applied <out.txt> --optimize-report <out.json>
// Writes `state` (ok | invalid | missing) and `applied` (a count) to $GITHUB_OUTPUT when set.
// `applied.txt` lists the changed paths, NUL-separated, for `git add --`. `optimize-report` is the
// sanitized per-file result list the PR comment is built from.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { categoryFor } from './config.mjs';

export const MAX_MANIFEST_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 500;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const SHA256 = /^[0-9a-f]{64}$/;
const SHA1 = /^[0-9a-f]{40}$/;

// SVGs are inlined into the page by SVGR, so a script a compromised decoder added would run on the
// live site. Optimized SVG output containing any of these is rejected.
const SVG_EXECUTABLE = [
  /<\s*script\b/i,
  /javascript\s*:/i,
  /\bon[a-z]+\s*=/i,
  /<\s*foreignObject\b/i,
];

const startsWith = (buffer, bytes, offset = 0) =>
  bytes.every((byte, i) => buffer[offset + i] === byte);
const ascii = (buffer, start, end) => buffer.toString('latin1', start, end);

// Whether the bytes plausibly belong to the file type its extension claims. Returns null when they
// do, otherwise the reason.
export function sniff(file, buffer) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png')
    return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ? null
      : 'not a PNG';
  if (ext === '.jpg' || ext === '.jpeg')
    return startsWith(buffer, [0xff, 0xd8, 0xff]) ? null : 'not a JPEG';
  if (ext === '.gif')
    return /^GIF8[79]a$/.test(ascii(buffer, 0, 6)) ? null : 'not a GIF';
  if (ext === '.webp')
    return ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 12) === 'WEBP'
      ? null
      : 'not a WebP';
  if (ext === '.avif')
    return ascii(buffer, 4, 8) === 'ftyp' &&
      ['avif', 'avis', 'mif1'].includes(ascii(buffer, 8, 12))
      ? null
      : 'not an AVIF';
  if (ext === '.mp4' || ext === '.mov')
    return ['ftyp', 'moov', 'mdat', 'free', 'wide', 'skip'].includes(
      ascii(buffer, 4, 8),
    )
      ? null
      : 'not an MP4 or MOV';
  if (ext === '.webm')
    return startsWith(buffer, [0x1a, 0x45, 0xdf, 0xa3]) ? null : 'not a WebM';
  if (ext === '.svg') {
    const text = buffer.toString('utf8');
    if (!/<svg\b/i.test(text)) return 'not an SVG';
    return SVG_EXECUTABLE.some((pattern) => pattern.test(text))
      ? 'SVG contains a script, event handler or foreignObject'
      : null;
  }
  return 'unsupported type';
}

// A repo-relative POSIX path that stays inside the checkout.
function safePath(p) {
  return (
    typeof p === 'string' &&
    p.length > 0 &&
    p.length <= 1024 &&
    !p.includes('\0') &&
    !p.includes('\\') &&
    !p.startsWith('/') &&
    path.posix.normalize(p) === p &&
    p.split('/').every((segment) => segment && segment !== '.' && segment !== '..')
  );
}

const isInt = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;

function clean(text, limit) {
  // eslint-disable-next-line no-control-regex
  return String(text).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, limit);
}

// Checks the manifest's shape. Returns an error string, or null.
export function manifestError(manifest, headSha) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
    return 'the manifest is not an object';
  if (manifest.version !== 1) return 'unknown manifest version';
  if (!SHA1.test(String(manifest.head_sha)))
    return 'the manifest has no commit SHA';
  if (manifest.head_sha !== headSha)
    return 'the artifact was built for another commit';
  if (!Array.isArray(manifest.files) || manifest.files.length > MAX_FILES)
    return 'the file list is missing or too long';
  const seen = new Set();
  for (const entry of manifest.files) {
    if (!entry || typeof entry !== 'object') return 'a file entry is not an object';
    if (typeof entry.path !== 'string') return 'a file entry has no path';
    if (seen.has(entry.path)) return 'the manifest lists a path twice';
    seen.add(entry.path);
    if (!SHA256.test(String(entry.sha256))) return 'a file entry has no sha256';
    if (!isInt(entry.size, MAX_FILE_BYTES)) return 'a file entry has a bad size';
  }
  if (manifest.results !== undefined) {
    if (!Array.isArray(manifest.results) || manifest.results.length > MAX_FILES)
      return 'the result list is too long';
  }
  return null;
}

const regular = (file) => {
  try {
    return fs.lstatSync(file).isFile();
  } catch {
    return false;
  }
};

// Results the PR comment is built from. Only plain, bounded values for files this run may change.
function sanitizeResults(results, allowed) {
  const out = [];
  for (const r of results ?? []) {
    if (!r || typeof r !== 'object' || !allowed.has(r.file)) continue;
    if (!isInt(r.before, MAX_FILE_BYTES) || !isInt(r.after, MAX_FILE_BYTES))
      continue;
    const entry = {
      file: r.file,
      before: r.before,
      after: r.after,
      replaced: r.replaced === true,
    };
    if (typeof r.error === 'string' && r.error) entry.error = clean(r.error, 300);
    if (typeof r.note === 'string' && r.note) entry.note = clean(r.note, 100);
    out.push(entry);
  }
  return out;
}

// Measured image sizes the replace flow may write into pointers: only well-formed entries (a sha256
// key and two bounded integers). A bad entry is dropped, not trusted and not fatal. The replace step
// uses an entry only for a file whose own hash equals the key.
export function sanitizeDimensions(dimensions) {
  const out = {};
  if (!dimensions || typeof dimensions !== 'object' || Array.isArray(dimensions)) return out;
  const ok = (n) => Number.isInteger(n) && n >= 1 && n <= 99999;
  for (const [sha, entry] of Object.entries(dimensions).slice(0, MAX_FILES)) {
    if (SHA256.test(sha) && entry && ok(entry.width) && ok(entry.height))
      out[sha] = { width: entry.width, height: entry.height };
  }
  return out;
}

// Applies the artifact in `artifactDir` to the checkout in `cwd`.
// Returns { state, error?, applied: [path], rejected: [{ path, reason }], results, dimensions }.
//   state "missing": there is no manifest; "invalid": the manifest cannot be trusted at all.
export function applyArtifact({ artifactDir, cwd, headSha, allowed }) {
  const allowedSet = new Set(allowed);
  const fail = (state, error) => ({
    state,
    error,
    applied: [],
    rejected: [],
    results: [],
    dimensions: {},
  });
  const manifestFile = path.join(artifactDir, 'manifest.json');
  if (!regular(manifestFile)) return fail('missing', 'the artifact has no manifest');
  if (fs.statSync(manifestFile).size > MAX_MANIFEST_BYTES)
    return fail('invalid', 'the manifest is too large');
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  } catch {
    return fail('invalid', 'the manifest is not valid JSON');
  }
  const error = manifestError(manifest, headSha);
  if (error) return fail('invalid', error);

  const realCwd = fs.realpathSync(cwd);
  const applied = [];
  const rejected = [];
  const accepted = [];
  for (const entry of manifest.files) {
    const reject = (reason) => rejected.push({ path: clean(entry.path, 200), reason });
    const rel = entry.path;
    if (!safePath(rel)) {
      reject('not a safe repository path');
      continue;
    }
    if (!allowedSet.has(rel)) {
      reject('not an asset this run may optimize');
      continue;
    }
    if (!categoryFor(rel)) {
      reject('not a supported asset type');
      continue;
    }
    const source = path.join(artifactDir, 'files', rel);
    if (!regular(source)) {
      reject('the artifact copy is missing or not a regular file');
      continue;
    }
    const content = fs.readFileSync(source);
    if (content.length !== entry.size) {
      reject('the size does not match the manifest');
      continue;
    }
    if (crypto.createHash('sha256').update(content).digest('hex') !== entry.sha256) {
      reject('the sha256 does not match the manifest');
      continue;
    }
    const target = path.join(cwd, rel);
    if (!regular(target)) {
      reject('the file in the checkout is missing or not a regular file');
      continue;
    }
    let realParent;
    try {
      realParent = fs.realpathSync(path.dirname(target));
    } catch {
      reject('the directory in the checkout is missing');
      continue;
    }
    if (realParent !== realCwd && !realParent.startsWith(realCwd + path.sep)) {
      reject('the path leaves the checkout through a symlink');
      continue;
    }
    if (content.length >= fs.statSync(target).size) {
      reject('the optimized file is not smaller');
      continue;
    }
    const why = sniff(rel, content);
    if (why) {
      reject(why);
      continue;
    }
    accepted.push({ rel, source, target });
  }
  // Copy over the existing file: this keeps its mode, so git sees only a content change.
  for (const { rel, source, target } of accepted) {
    fs.copyFileSync(source, target);
    applied.push(rel);
  }
  return {
    state: 'ok',
    applied,
    rejected,
    results: sanitizeResults(manifest.results, allowedSet),
    dimensions: sanitizeDimensions(manifest.dimensions),
  };
}

function parseCli(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--') || argv[i + 1] === undefined)
      throw new Error(`bad argument ${argv[i]}`);
    args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let args;
  try {
    args = parseCli(process.argv.slice(2));
    for (const name of ['artifact', 'head-sha', 'pending'])
      if (!args[name]) throw new Error(`--${name} is required`);
  } catch (error) {
    console.error(
      `${error.message}\nUsage: apply-artifact.mjs --artifact <dir> --head-sha <sha> --pending <pending.json> [--report f] [--applied f] [--optimize-report f] [--dimensions f]`,
    );
    process.exit(2);
  }
  const pending = JSON.parse(fs.readFileSync(args.pending, 'utf8'));
  const allowed = Array.isArray(pending.pendingFiles)
    ? pending.pendingFiles.filter((f) => typeof f === 'string')
    : [];
  const result = applyArtifact({
    artifactDir: args.artifact,
    cwd: process.cwd(),
    headSha: args['head-sha'],
    allowed,
  });
  if (args.report) fs.writeFileSync(args.report, JSON.stringify(result, null, 2));
  if (args.applied)
    fs.writeFileSync(args.applied, result.applied.map((f) => `${f}\0`).join(''));
  if (args['optimize-report'])
    fs.writeFileSync(args['optimize-report'], JSON.stringify(result.results, null, 2));
  if (args.dimensions)
    fs.writeFileSync(args.dimensions, JSON.stringify(result.dimensions, null, 2));
  if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `state=${result.state}\napplied=${result.applied.length}\n`,
    );
  for (const r of result.rejected)
    console.log(`::warning::Rejected ${r.path}: ${r.reason}`);
  console.log(
    result.state === 'ok'
      ? `${result.applied.length} optimized file(s) applied, ${result.rejected.length} rejected.`
      : `The artifact was not applied (${result.state}): ${result.error}.`,
  );
}
