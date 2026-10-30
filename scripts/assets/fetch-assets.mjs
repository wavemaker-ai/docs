#!/usr/bin/env node
// Turns pointer files back into the real assets, so a contributor can edit or replace one:
//   npm run fetch-assets -- docs/studio/assets/img/a.png      one pointer
//   npm run fetch-assets -- docs/studio                       every pointer under a folder
// Each download is checked against the pointer's size and sha256 before it replaces the pointer, and
// the pointer is only overwritten by a complete, verified file. The URL is built from the validated key
// and the base URL in docusaurus.config.js, never from anything else in the pointer.
//
// A fetched file is a normal asset again: commit it and the pipeline treats it like any other. If it
// is byte-for-byte the stored one, the upload finds the object already there and the replace flow
// turns it back into the same pointer.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const { EXTENSIONS, extractBaseUrl, looksLikePointer, readHead, readPointer, urlFor } = createRequire(import.meta.url)('./pointer.cjs');

const MAX_BYTES = 100 * 1024 * 1024;

// Pointer files at or under each given path.
export function findPointers(targets) {
  const found = [];
  const visit = (target) => {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) return;
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(target)) {
        if (name === 'node_modules' || name === '.git' || name === 'build' || name === '.docusaurus') continue;
        visit(path.join(target, name));
      }
    } else if (stat.isFile() && EXTENSIONS.includes(path.extname(target).toLowerCase()) && looksLikePointer(readHead(target))) {
      found.push(target);
    }
  };
  for (const target of targets) visit(target);
  return found;
}

// Downloads and verifies one pointer's asset. Returns { file, state: 'fetched' | 'failed', problem? }.
export async function fetchOne(file, baseUrl, { fetchImpl = fetch, timeoutMs = 60000 } = {}) {
  let pointer;
  try {
    pointer = readPointer(file);
  } catch (error) {
    return { file, state: 'failed', problem: error.message };
  }
  if (!pointer) return { file, state: 'failed', problem: 'not a pointer file' };
  if (pointer.size > MAX_BYTES) return { file, state: 'failed', problem: 'the asset is larger than the limit' };
  try {
    const response = await fetchImpl(urlFor(baseUrl, pointer.key), { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    if (response.status !== 200) return { file, state: 'failed', problem: `the bucket answered ${response.status}` };
    const body = Buffer.from(await response.arrayBuffer());
    if (body.length !== pointer.size) return { file, state: 'failed', problem: `got ${body.length} bytes, the pointer says ${pointer.size}` };
    if (crypto.createHash('sha256').update(body).digest('hex') !== pointer.sha256)
      return { file, state: 'failed', problem: 'the downloaded file does not match the pointer\'s sha256' };
    const temp = `${file}.fetch-tmp`;
    fs.writeFileSync(temp, body, { flag: 'wx' });
    fs.renameSync(temp, file);
    return { file, state: 'fetched' };
  } catch (error) {
    return { file, state: 'failed', problem: error.message };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // npm runs scripts from the package root; INIT_CWD is where the command was typed.
  const base = process.env.INIT_CWD || process.cwd();
  const targets = process.argv.slice(2).map((t) => path.resolve(base, t));
  if (!targets.length) {
    console.error('Usage: npm run fetch-assets -- <pointer file or folder> [...]');
    process.exit(2);
  }
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
  const baseUrl = extractBaseUrl(fs.readFileSync(path.join(root, 'docusaurus.config.js'), 'utf8'));
  const pointers = findPointers(targets);
  if (!pointers.length) {
    console.log('No pointer files found.');
    process.exit(0);
  }
  let failed = 0;
  for (const file of pointers) {
    const result = await fetchOne(file, baseUrl);
    const shown = path.relative(base, file) || file;
    if (result.state === 'fetched') console.log(`fetched ${shown}`);
    else {
      failed++;
      console.error(`failed  ${shown}: ${result.problem}`);
    }
  }
  console.log(`${pointers.length - failed} of ${pointers.length} fetched.`);
  process.exit(failed ? 1 : 0);
}
