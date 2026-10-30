#!/usr/bin/env node
// Upload flow (U): stores each real asset a PR adds or changes in the asset bucket, under a key that
// mirrors its repository path with a hash before the extension (see pointer.cjs). It never edits the
// repository, and it never overwrites or deletes an object:
//
//   - the key contains the hash of the bytes, so a changed file is a different object;
//   - the upload is a conditional write (If-None-Match: *) with a SHA-256 checksum that S3 verifies;
//   - an existing object is only accepted after its size and checksum match (a missing checksum is
//     settled by downloading the object and hashing it), otherwise the upload fails loudly.
//
// It runs in the publish job and uses the AWS CLI that GitHub's runners ship, so no npm package is
// installed in a job that holds credentials. It needs AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.
//
// Usage (inside the PR checkout, after the optimizer's output was applied):
//   node upload.mjs --base <ref> [--report out.json]
// Environment: ASSET_S3_BUCKET, ASSET_S3_REGION, ASSET_S3_PREFIX (the repository-name folder in the
// bucket), PR_NUMBER, COMMIT, and for tests ASSET_S3_ENDPOINT.
// Writes `state` (success | failure | error), `description` and counts to $GITHUB_OUTPUT.
//
//   success  every file is stored (new, or already there with the same content), or was skipped
//   failure  a file could not be stored, or an object with the same key has other content
//   error    the flow could not run (no credentials, no AWS CLI, no bucket configured)
//
// A file is skipped, not failed, when it cannot be stored by design: SVG (it stays in the repository),
// a folder that cannot hold pointers, a name the key rules do not allow, a file over its size limit,
// or bytes that are not the type the extension claims. The size check and the optimizer report those.

import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { sniff } from './apply-artifact.mjs';
import { classifyAssets, parseArgs } from './changed-assets.mjs';
import { LIMITS, formatBytes } from './config.mjs';
import { displayName, escapeData, escapeProperty } from './workflow-commands.mjs';

const { keyFor } = createRequire(import.meta.url)('./pointer.cjs');

export const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const DEFAULTS = { attempts: 3, retryDelayMs: 2000, concurrency: 4, maxFiles: 200 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (buffer, encoding) => crypto.createHash('sha256').update(buffer).digest(encoding);

// --- the AWS CLI ------------------------------------------------------------------------------------
function aws(args, { bucket, region, endpoint }) {
  const full = [
    's3api',
    ...args,
    '--bucket',
    bucket,
    '--region',
    region,
    '--output',
    'json',
    '--cli-connect-timeout',
    '10',
    '--cli-read-timeout',
    '120',
    ...(endpoint ? ['--endpoint-url', endpoint] : []),
  ];
  return new Promise((resolve) => {
    const child = spawn('aws', full, {
      env: {
        ...process.env,
        // Predictable attempt counts (retries are ours), and no wait for an instance metadata service.
        AWS_MAX_ATTEMPTS: '1',
        AWS_RETRY_MODE: 'standard',
        AWS_PAGER: '',
        AWS_EC2_METADATA_DISABLED: 'true',
        AWS_DEFAULT_REGION: region,
      },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (error) => resolve({ code: -1, stdout, stderr: String(error.message) }));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

// What an AWS CLI result means for us.
export function classify(result) {
  if (result.code === 0) return 'ok';
  const code = /An error occurred \((\w+)\)/.exec(result.stderr)?.[1] ?? '';
  if (['PreconditionFailed', '412'].includes(code)) return 'precondition';
  if (['404', 'NoSuchKey', 'NotFound'].includes(code)) return 'missing';
  if (['403', 'AccessDenied', 'InvalidAccessKeyId', 'SignatureDoesNotMatch', 'ExpiredToken'].includes(code)) return 'denied';
  if (['BadDigest', 'InvalidDigest', 'XAmzContentSHA256Mismatch'].includes(code)) return 'bad-digest';
  if (/^5\d\d$/.test(code) || ['InternalError', 'ServiceUnavailable', 'SlowDown', 'RequestTimeout'].includes(code))
    return 'transient';
  // No S3 error code at all: the connection failed, was closed or timed out.
  if (!code) return 'transient';
  return 'other';
}

const tail = (result) => (result.stderr.trim().split('\n').filter(Boolean).at(-1) ?? 'no output').slice(0, 200);

// --- one file -------------------------------------------------------------------------------------
// Is the object under `s3Key` exactly this content? Returns 'verified', 'mismatch' or 'unknown'.
async function verifyStored(ctx, s3Key, content, b64) {
  const head = await aws(['head-object', '--key', s3Key, '--checksum-mode', 'ENABLED'], ctx);
  const kind = classify(head);
  if (kind !== 'ok') return { state: kind === 'missing' ? 'missing' : 'unknown', detail: tail(head) };
  let info;
  try {
    info = JSON.parse(head.stdout);
  } catch {
    return { state: 'unknown', detail: 'unreadable HEAD answer' };
  }
  if (info.ContentLength !== content.length)
    return { state: 'mismatch', detail: `the stored object has ${info.ContentLength} bytes, the file has ${content.length}` };
  if (info.ChecksumSHA256) {
    return info.ChecksumSHA256 === b64
      ? { state: 'verified' }
      : { state: 'mismatch', detail: 'the stored object has a different SHA-256' };
  }
  // The object was stored without a checksum: size alone proves nothing, so download and hash it.
  const temp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'asset-verify-')), 'object');
  try {
    const got = await aws(['get-object', '--key', s3Key, temp], ctx);
    if (classify(got) !== 'ok') return { state: 'unknown', detail: tail(got) };
    return sha256(fs.readFileSync(temp), 'base64') === b64
      ? { state: 'verified' }
      : { state: 'mismatch', detail: 'the stored object has different content' };
  } finally {
    fs.rmSync(path.dirname(temp), { recursive: true, force: true });
  }
}

// Plans one file: everything that can be decided without the network.
export function plan(file, { prefix = '' } = {}) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.svg') return { skip: 'SVG stays in the repository' };
  const type = CONTENT_TYPES[ext];
  if (!type) return { skip: 'not a type that is stored in the bucket' };
  const category = Object.entries(LIMITS).find(([, rule]) => rule.extensions.includes(ext))?.[0];
  const size = fs.statSync(file).size;
  if (category && size > LIMITS[category].maxBytes)
    return { skip: `over the ${formatBytes(LIMITS[category].maxBytes)} limit` };
  const content = fs.readFileSync(file);
  const mismatch = sniff(file, content);
  if (mismatch) return { skip: `the bytes are not a valid file of this type (${mismatch})` };
  const hex = sha256(content, 'hex');
  const { key, error } = keyFor(file.split(path.sep).join('/'), hex);
  if (error) return { skip: `no key can be made: ${error}` };
  return {
    content,
    hex,
    b64: sha256(content, 'base64'),
    key,
    s3Key: prefix ? `${prefix.replace(/^\/+|\/+$/g, '')}/${key}` : key,
    type,
  };
}

async function storeOne(file, ctx, options) {
  const planned = plan(file, ctx);
  if (planned.skip) return { file, state: 'skipped', reason: planned.skip };
  const { content, hex, b64, key, s3Key, type } = planned;
  const base = { file, key, size: content.length, sha256: hex };

  // Look first: with a replace flow that is off, every run would otherwise send up to 50 MB per file
  // just to be told it already exists. A 403 or an unreachable HEAD means "unknown": the conditional
  // write below decides.
  const before = await verifyStored(ctx, s3Key, content, b64);
  if (before.state === 'verified') return { ...base, state: 'exists' };
  if (before.state === 'mismatch')
    return { ...base, state: 'failed', error: `an object with this key has other content (${before.detail}); it is never overwritten` };

  let last = 'no answer';
  for (let attempt = 1; attempt <= options.attempts; attempt++) {
    const put = await aws(
      [
        'put-object',
        '--key', s3Key,
        '--body', file,
        '--content-type', type,
        '--cache-control', CACHE_CONTROL,
        '--checksum-sha256', b64,
        '--if-none-match', '*',
        '--metadata', `pr=${ctx.pr || 'none'},commit=${ctx.commit || 'none'},uploaded-at=${new Date().toISOString()}`,
      ],
      ctx,
    );
    const kind = classify(put);
    if (kind === 'ok') return { ...base, state: 'uploaded' };
    last = tail(put);
    if (kind === 'precondition') {
      // Someone stored the same key first (a race), or an earlier attempt landed.
      const after = await verifyStored(ctx, s3Key, content, b64);
      if (after.state === 'verified') return { ...base, state: 'exists' };
      return { ...base, state: 'failed', error: `the key already exists with other content or could not be checked (${after.detail ?? after.state}); it is never overwritten` };
    }
    if (kind === 'denied') return { ...base, state: 'failed', error: `access denied by the bucket (${last})` };
    if (kind === 'other') return { ...base, state: 'failed', error: last };
    // Transient, or a checksum S3 rejected: the answer may have been lost after the object landed, so
    // look before sending it again.
    const landed = await verifyStored(ctx, s3Key, content, b64);
    if (landed.state === 'verified') return { ...base, state: 'uploaded' };
    if (attempt < options.attempts) await sleep(options.retryDelayMs);
  }
  return { ...base, state: 'failed', error: `could not upload after ${options.attempts} attempts (${last})` };
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

// Stores the given repository files. `files` are paths relative to the current directory.
export async function storeFiles(files, config, overrides = {}) {
  const options = { ...DEFAULTS, ...overrides };
  const ctx = {
    bucket: config.bucket,
    region: config.region,
    endpoint: config.endpoint,
    prefix: config.prefix ?? '',
    pr: config.pr,
    commit: config.commit,
  };
  const empty = (state, description) => ({ state, description, results: [], counts: { uploaded: 0, existing: 0, failed: 0, skipped: 0 } });
  if (!ctx.bucket || !ctx.region) return empty('error', 'The bucket is not configured (ASSET_S3_BUCKET and ASSET_S3_REGION)');
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return empty('error', 'The upload credentials are not configured');
  const version = spawnSync('aws', ['--version'], { encoding: 'utf8' });
  if (version.error || version.status !== 0) return empty('error', 'The AWS CLI is not available on this runner');
  if (files.length > options.maxFiles)
    return empty('error', `Too many assets to store in one run (${files.length}, limit ${options.maxFiles})`);

  const results = await mapLimit(files, options.concurrency, (file) => storeOne(file, ctx, options));
  const count = (state) => results.filter((r) => r.state === state).length;
  const counts = { uploaded: count('uploaded'), existing: count('exists'), failed: count('failed'), skipped: count('skipped') };
  if (counts.failed)
    return { state: 'failure', description: `${plural(counts.failed, 'upload')} failed`, results, counts };
  const stored = counts.uploaded + counts.existing;
  const description = stored
    ? `${stored} stored (${counts.uploaded} new, ${counts.existing} already there)${counts.skipped ? `, ${counts.skipped} skipped` : ''}`
    : counts.skipped
      ? `Nothing to store (${counts.skipped} skipped)`
      : 'No assets to store';
  return { state: 'success', description, results, counts };
}

// --- command line -----------------------------------------------------------------------------------
const html = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '&#124;').replace(/\n/g, '<br>');

function summaryMarkdown(report) {
  let text = `### Upload\n\n${report.description}\n`;
  const interesting = report.results.filter((r) => r.state !== 'exists');
  if (interesting.length) {
    text += '\n| File | Result |\n|---|---|\n';
    for (const r of interesting) text += `| <code>${html(r.file)}</code> | ${html(r.state === 'skipped' ? `skipped: ${r.reason}` : r.state === 'failed' ? `failed: ${r.error}` : r.state)} |\n`;
  }
  return text;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const e = process.env;
  const { pending } = classifyAssets({ base: args.base, head: 'HEAD', files: [] });
  const report = await storeFiles(
    pending.map((a) => a.file),
    { bucket: e.ASSET_S3_BUCKET, region: e.ASSET_S3_REGION, prefix: e.ASSET_S3_PREFIX, endpoint: e.ASSET_S3_ENDPOINT, pr: e.PR_NUMBER, commit: e.COMMIT },
  );
  if (args.report) fs.writeFileSync(args.report, JSON.stringify(report, null, 2));
  if (e.GITHUB_OUTPUT)
    fs.appendFileSync(
      e.GITHUB_OUTPUT,
      `state=${report.state}\ndescription=${report.description}\nuploaded=${report.counts.uploaded}\nexisting=${report.counts.existing}\nfailed=${report.counts.failed}\nskipped=${report.counts.skipped}\n`,
    );
  if (e.GITHUB_STEP_SUMMARY) fs.appendFileSync(e.GITHUB_STEP_SUMMARY, summaryMarkdown(report));
  for (const r of report.results) {
    if (r.state === 'failed') console.log(`::error file=${escapeProperty(r.file)}::${escapeData(r.error)}`);
    else console.log(`${r.state.padEnd(8)} ${displayName(r.file)}${r.reason ? `  (${r.reason})` : ''}`);
  }
  console.log(`${report.state}: ${report.description}`);
}
