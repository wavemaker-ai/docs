#!/usr/bin/env node
// Replace flow (R): swaps a real asset in the working tree for a pointer file, once the object is
// confirmed in the bucket. It never uploads (that is upload.mjs) and it only touches files the upload
// step reported as stored. Per file:
//
//   1. the file is a regular file (no symlink) and still has the bytes that were uploaded;
//   2. the key is recomputed from the path and the hash, never taken from a report;
//   3. the object's PUBLIC URL answers 200 with the stored size (the site reads it from there, so a
//      private or missing object would break the build), redirects are not followed;
//   4. only then the pointer is written, next to nothing else: the real file is replaced in place.
//
// A file whose object is missing, private or of another size is left as it is and reported as a
// warning: the real file keeps working, and the next run tries again. Nothing is deleted from the
// bucket, and the real file stays in the PR's earlier commits.
//
// Before anything is swapped, the bucket, region and prefix from the repository variables must agree
// with the base URL in docusaurus.config.js (read as text): otherwise the pointers would resolve to a
// place the files were not uploaded to.
//
// Usage (inside the PR checkout, after upload.mjs):
//   node replace.mjs --upload-report <json> [--config docusaurus.config.js] [--dimensions <json>]
//     [--report <json>] [--replaced <txt>]
// Environment: ASSET_S3_BUCKET, ASSET_S3_REGION, ASSET_S3_PREFIX.
// Writes `state` (success | error), `description` and counts to $GITHUB_OUTPUT. `--replaced` lists the
// swapped paths, NUL-separated, for `git add --`.
//
//   success  every file was swapped, or left as it is with a warning
//   error    the flow could not run (configuration mismatch, unreadable report) or the bucket could not
//            be reached for some file after retries

import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { parseCli } from './pointer-check.mjs';
import { displayName, escapeData, escapeProperty } from './workflow-commands.mjs';

const { extractBaseUrl, keyFor, urlFor } = createRequire(import.meta.url)('./pointer.cjs');

const DEFAULTS = { attempts: 3, retryDelayMs: 2000, timeoutMs: 15000, concurrency: 8 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The base URL the repository variables describe, in the one form the bucket's public URL takes.
export function expectedBaseUrl({ bucket, region, prefix }) {
  const folder = String(prefix ?? '').replace(/^\/+|\/+$/g, '');
  return `https://${bucket}.s3.${region}.amazonaws.com${folder ? `/${folder}` : ''}`;
}

// A measurement is used only when it is two bounded integers, whatever produced it.
export function validDimensions(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const { width, height } = entry;
  const ok = (n) => Number.isInteger(n) && n >= 1 && n <= 99999;
  return ok(width) && ok(height) ? { width, height } : null;
}

export function pointerText({ sha256, size, key, dimensions }) {
  const lines = ['s3-asset v1', `sha256 ${sha256}`, `size ${size}`, `key ${key}`];
  if (dimensions) lines.push(`width ${dimensions.width}`, `height ${dimensions.height}`);
  return `${lines.join('\n')}\n`;
}

// Asks for the object's public URL. Returns { kind: 'ok' | 'missing' | 'size' | 'redirect' |
// 'unexpected' | 'unreachable', problem }.
async function probe(url, size, { attempts, retryDelayMs, timeoutMs, fetchImpl }) {
  let last = 'no answer';
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const { status, headers } = await fetchImpl(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (status === 200) {
        const length = Number(headers.get('content-length'));
        if (!Number.isInteger(length)) return { kind: 'unexpected', problem: 'the bucket sent no Content-Length' };
        return length === size
          ? { kind: 'ok' }
          : { kind: 'size', problem: `the object has ${length} bytes, the file has ${size}` };
      }
      if (status === 404 || status === 403)
        return { kind: 'missing', problem: 'the object is missing or not public' };
      if (status >= 300 && status < 400)
        return { kind: 'redirect', problem: `the bucket answered with a redirect (${status})` };
      if (status >= 500 || status === 429) last = `the bucket answered ${status}`;
      else return { kind: 'unexpected', problem: `the bucket answered ${status}` };
    } catch (error) {
      last = error.name === 'TimeoutError' ? 'the request timed out' : `the request failed (${error.message})`;
    }
    if (attempt < attempts) await sleep(retryDelayMs);
  }
  return { kind: 'unreachable', problem: last };
}

async function swapOne(file, baseUrl, dimensionsBySha, settings) {
  let stat;
  try {
    stat = fs.lstatSync(file);
  } catch {
    return { file, state: 'kept', problem: 'the file is gone' };
  }
  if (!stat.isFile()) return { file, state: 'kept', problem: 'the path is not a regular file' };
  const content = fs.readFileSync(file);
  const sha256 = crypto.createHash('sha256').update(content).digest('hex');
  const { key, error } = keyFor(file.split(path.sep).join('/'), sha256);
  if (error) return { file, state: 'kept', problem: `no key can be made: ${error}` };
  const text = pointerText({ sha256, size: content.length, key, dimensions: validDimensions(dimensionsBySha[sha256]) });
  // A pointer that is not smaller than the file would only add a commit.
  if (Buffer.byteLength(text) >= content.length) return { file, state: 'kept', problem: 'the file is smaller than its pointer' };

  const found = await probe(urlFor(baseUrl, key), content.length, settings);
  if (found.kind !== 'ok') return { file, state: found.kind === 'unreachable' ? 'unreachable' : 'kept', problem: found.problem };

  // Write beside the file and rename, so an interrupted run never leaves half a pointer.
  const temp = `${file}.pointer-tmp`;
  fs.writeFileSync(temp, text, { flag: 'wx' });
  fs.renameSync(temp, file);
  return { file, state: 'replaced', key, size: content.length };
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index]);
      }
    }),
  );
  return results;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// `files` are the paths the upload step reported as stored. `env` is { bucket, region, prefix }.
export async function replaceFiles(files, { configText, env, dimensions = {}, ...options }) {
  const settings = { ...DEFAULTS, fetchImpl: fetch, ...options };
  const none = (state, description) => ({ state, description, results: [], counts: { replaced: 0, kept: 0 } });
  let baseUrl;
  try {
    baseUrl = extractBaseUrl(configText);
  } catch (error) {
    return none('error', `The pointer base URL in docusaurus.config.js is not readable (${error.message})`);
  }
  const expected = expectedBaseUrl(env);
  if (baseUrl.replace(/\/+$/, '') !== expected)
    return none('error', `The repository variables (bucket, region, prefix) give ${expected}, but docusaurus.config.js has ${baseUrl}`);
  if (!files.length) return none('success', 'No stored assets to replace');

  const results = await mapLimit(files, settings.concurrency, (file) => swapOne(file, baseUrl, dimensions, settings));
  const count = (state) => results.filter((r) => r.state === state).length;
  const counts = { replaced: count('replaced'), kept: count('kept') + count('unreachable') };
  const unreachable = count('unreachable');
  const description =
    `${plural(counts.replaced, 'file')} replaced by pointers` +
    (counts.kept ? `, ${counts.kept} left as they are` : '');
  if (unreachable)
    return { state: 'error', description: `${description}; could not reach the bucket for ${unreachable}, re-run`, results, counts };
  return { state: 'success', description, results, counts };
}

const html = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '&#124;').replace(/\n/g, '<br>');

function summaryMarkdown(report) {
  let text = `### Replace\n\n${report.description}\n`;
  const rows = report.results.filter((r) => r.state !== 'replaced');
  if (rows.length) {
    text += '\n| File | Left as it is because |\n|---|---|\n';
    for (const r of rows) text += `| <code>${html(r.file)}</code> | ${html(r.problem)} |\n`;
  }
  return text;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseCli(process.argv.slice(2));
  const e = process.env;
  let report;
  try {
    const uploaded = JSON.parse(fs.readFileSync(args['upload-report'], 'utf8'));
    const files = uploaded.results.filter((r) => r.state === 'uploaded' || r.state === 'exists').map((r) => r.file);
    const dimensions = args.dimensions ? JSON.parse(fs.readFileSync(args.dimensions, 'utf8')) : {};
    report = await replaceFiles(files, {
      configText: fs.readFileSync(args.config ?? 'docusaurus.config.js', 'utf8'),
      env: { bucket: e.ASSET_S3_BUCKET, region: e.ASSET_S3_REGION, prefix: e.ASSET_S3_PREFIX },
      dimensions,
    });
  } catch (error) {
    report = { state: 'error', description: `The replace flow could not start (${error.message})`, results: [], counts: { replaced: 0, kept: 0 } };
  }
  if (args.report) fs.writeFileSync(args.report, JSON.stringify(report, null, 2));
  if (args.replaced)
    fs.writeFileSync(args.replaced, report.results.filter((r) => r.state === 'replaced').map((r) => `${r.file}\0`).join(''));
  if (e.GITHUB_OUTPUT)
    fs.appendFileSync(e.GITHUB_OUTPUT, `state=${report.state}\ndescription=${report.description}\nreplaced=${report.counts.replaced}\nkept=${report.counts.kept}\n`);
  if (e.GITHUB_STEP_SUMMARY) fs.appendFileSync(e.GITHUB_STEP_SUMMARY, summaryMarkdown(report));
  for (const r of report.results) {
    if (r.state === 'replaced') console.log(`replaced ${displayName(r.file)}`);
    else console.log(`::warning file=${escapeProperty(r.file)}::${escapeData(`Left as it is: ${r.problem}`)}`);
  }
  console.log(`${report.state}: ${report.description}`);
}
