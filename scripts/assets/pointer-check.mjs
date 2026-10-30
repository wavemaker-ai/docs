#!/usr/bin/env node
// CI check: every pointer file a pull request adds or changes must be valid and must point at an
// object that exists in the asset bucket with the size the pointer claims. Everything from the PR is
// data here: pointer text goes through the strict parser, the base URL is read as text from the PR's
// docusaurus.config.js (never imported or run), and a URL is only ever built from the allowlisted
// host plus a validated key, so a PR cannot point this check at another host.
//
// Usage (inside the PR checkout, from the trusted copy of the scripts):
//   node pointer-check.mjs --base <ref> [--head <ref>] [--config docusaurus.config.js] --report <out.json>
// Writes `state` (success | failure | error) and `description` to $GITHUB_OUTPUT when set, details to
// the job summary, and ::error annotations. It exits 0 whatever the result: the workflow sets the
// status from the outputs.
//
//   success  every checked pointer is valid and its object exists (or no pointer changed)
//   failure  a pointer is invalid, its object is missing (404, or 403 because it is not public) or
//            has another size, the base URL is not acceptable, or the bucket answered with a redirect
//   error    the bucket could not be reached after retries (5xx, network error, timeout), or there are
//            too many pointers to check: not the author's fault, so a re-run can clear it
//
// Without any changed pointer, and without a change to the config or the plugin, nothing is read from
// the config and nothing is requested: a PR from a branch that predates the config literal is fine.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { git } from './git.mjs';

const require = createRequire(import.meta.url);
const {
  EXTENSIONS,
  extractBaseUrl,
  looksLikePointer,
  readHead,
  readPointer,
  urlFor,
} = require('../../plugins/pointer-assets/pointer.cjs');

// The only hosts a pointer may resolve to. Changing the base URL host in docusaurus.config.js means
// changing this too; a test keeps the two in step.
export const ALLOWED_HOSTS = ['wm-docs-flow.s3.us-east-1.amazonaws.com'];

const DEFAULTS = {
  attempts: 3,
  retryDelayMs: 2000,
  timeoutMs: 15000,
  maxPointers: 500,
  concurrency: 8,
};

const hasPointerExtension = (file) =>
  EXTENSIONS.includes(path.extname(file).toLowerCase());

// A regular file (not a symlink) that starts like a pointer.
function isPointerFile(file) {
  try {
    if (!fs.lstatSync(file).isFile()) return false;
    return looksLikePointer(readHead(file));
  } catch {
    return false;
  }
}

const split = (output) => output.split('\0').filter(Boolean);

// Pointer files the PR adds or changes. When the config or the plugin changed, every tracked pointer
// is checked: a new base URL changes no pointer but breaks every URL.
export function selectPointers({ base, head }) {
  const mergeBase = git('merge-base', base, head).trim();
  const changed = split(
    git('diff', '--name-only', '--diff-filter=ACMR', '-z', `${mergeBase}..${head}`),
  );
  const configTouched = changed.some(
    (file) =>
      file === 'docusaurus.config.js' || file.startsWith('plugins/pointer-assets/'),
  );
  const candidates = configTouched ? split(git('ls-files', '-z')) : changed;
  const files = candidates.filter(
    (file) => hasPointerExtension(file) && isPointerFile(file),
  );
  return { files, configTouched };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One pointer: parse it strictly, then ask the bucket about the object.
export async function checkPointer(file, baseUrl, options = {}) {
  const { attempts, retryDelayMs, timeoutMs } = { ...DEFAULTS, ...options };
  const fetchImpl = options.fetchImpl ?? fetch;
  let pointer;
  try {
    pointer = readPointer(file);
  } catch (error) {
    return { file, kind: 'invalid', problem: error.message };
  }
  if (!pointer) return { file, kind: 'invalid', problem: 'the file is not a pointer' };
  const url = urlFor(baseUrl, pointer.key);
  let last = 'no answer';
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      // Redirects are never followed: a redirect would be the only way off the allowlisted host.
      const response = await fetchImpl(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      });
      const { status } = response;
      if (status === 200) {
        const length = Number(response.headers.get('content-length'));
        if (!Number.isInteger(length))
          return { file, kind: 'unexpected', problem: 'the bucket sent no Content-Length' };
        if (length !== pointer.size)
          return {
            file,
            kind: 'size',
            problem: `the object has ${length} bytes, the pointer says ${pointer.size}`,
          };
        return { file, kind: 'ok' };
      }
      if (status === 404 || status === 403)
        return { file, kind: 'missing', problem: 'the object is missing or not public' };
      if (status >= 300 && status < 400)
        return {
          file,
          kind: 'redirect',
          problem: `the bucket answered with a redirect (${status}); is the base URL region right?`,
        };
      if (status >= 500 || status === 429) last = `the bucket answered ${status}`;
      else return { file, kind: 'unexpected', problem: `the bucket answered ${status}` };
    } catch (error) {
      last = error.name === 'TimeoutError' ? 'the request timed out' : `the request failed (${error.message})`;
    }
    if (attempt < attempts) await sleep(retryDelayMs);
  }
  return { file, kind: 'unreachable', problem: last };
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

// The whole check. `cwd` is the PR checkout; the repo is found through git in process.cwd().
export async function run({
  base,
  head = 'HEAD',
  configPath = 'docusaurus.config.js',
  allowedHosts = ALLOWED_HOSTS,
  allowInsecure = false,
  ...options
}) {
  const settings = { ...DEFAULTS, ...options };
  const { files, configTouched } = selectPointers({ base, head });
  if (files.length === 0)
    return { state: 'success', description: 'No pointer files changed', results: [], checked: 0 };

  let baseUrl;
  try {
    baseUrl = extractBaseUrl(fs.readFileSync(configPath, 'utf8'));
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:' && !allowInsecure) throw new Error('the base URL is not https');
    if (!allowedHosts.includes(url.host)) throw new Error(`the host ${url.host} is not an allowed asset host`);
  } catch (error) {
    return {
      state: 'failure',
      description: 'The pointer base URL in docusaurus.config.js is missing or not allowed',
      detail: error.message,
      results: [],
      checked: 0,
    };
  }

  if (files.length > settings.maxPointers)
    return {
      state: 'error',
      description: `Too many pointer files to check in one run (${files.length}, limit ${settings.maxPointers})`,
      results: [],
      checked: 0,
    };

  const results = await mapLimit(files, settings.concurrency, (file) =>
    checkPointer(file, baseUrl, settings),
  );
  const problems = results.filter((r) => r.kind !== 'ok');
  const hard = problems.filter((r) => r.kind !== 'unreachable');
  const soft = problems.filter((r) => r.kind === 'unreachable');
  const scope = configTouched ? ' (the config or plugin changed, so all were checked)' : '';
  if (hard.length)
    return {
      state: 'failure',
      description: `${plural(hard.length, 'pointer file')} with a problem${scope}`.slice(0, 140),
      baseUrl,
      results,
      checked: files.length,
    };
  if (soft.length)
    return {
      state: 'error',
      description: `Could not reach the asset bucket for ${plural(soft.length, 'pointer file')}; re-run the check`,
      baseUrl,
      results,
      checked: files.length,
    };
  return {
    state: 'success',
    description: `${plural(files.length, 'pointer file')} verified${scope}`.slice(0, 140),
    baseUrl,
    results,
    checked: files.length,
  };
}

// Workflow commands: a file name comes from the PR, so it is escaped as GitHub requires; a newline or
// a colon in a name must not be able to start another command.
export const escapeData = (text) =>
  String(text).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
export const escapeProperty = (text) =>
  escapeData(text).replace(/:/g, '%3A').replace(/,/g, '%2C');

const html = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '&#124;').replace(/\n/g, '<br>');

function summaryMarkdown(report) {
  let text = `### Pointer check\n\n${report.description}\n`;
  if (report.detail) text += `\n${html(report.detail)}\n`;
  const problems = report.results.filter((r) => r.kind !== 'ok');
  if (problems.length) {
    text += '\n| File | Problem |\n|---|---|\n';
    for (const r of problems) text += `| <code>${html(r.file)}</code> | ${html(r.problem)} |\n`;
  }
  return text;
}

function parseCli(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--') || argv[i + 1] === undefined) throw new Error(`bad argument ${argv[i]}`);
    args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let args;
  try {
    args = parseCli(process.argv.slice(2));
    if (!args.base) throw new Error('--base is required');
  } catch (error) {
    console.error(`${error.message}\nUsage: pointer-check.mjs --base <ref> [--head <ref>] [--config <file>] [--report <file>]`);
    process.exit(2);
  }
  const report = await run({ base: args.base, head: args.head, configPath: args.config });
  if (args.report) fs.writeFileSync(args.report, JSON.stringify(report, null, 2));
  if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `state=${report.state}\ndescription=${report.description}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMarkdown(report));
  for (const r of report.results.filter((x) => x.kind !== 'ok'))
    console.log(`::error file=${escapeProperty(r.file)}::${escapeData(r.problem)}`);
  if (report.detail) console.log(`::error::${escapeData(report.detail)}`);
  console.log(`${report.state}: ${report.description}`);
}
