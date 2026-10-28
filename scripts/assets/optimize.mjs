#!/usr/bin/env node
// Compresses assets in place, keeping each file's path and format so MDX references stay valid.
// A file is replaced only when the result is meaningfully smaller.
//
// Usage:
//   node scripts/assets/optimize.mjs [--base <ref>] [--head <ref>] [--trailers-from <ref>] [--report <out.json>] [files...]
//     Assets added or changed on this branch (what CI runs), or just the listed files.
//     With --trailers-from, assets that commits in <ref>..<head> report as already optimized or
//     reviewed by the pre-commit hook are skipped.
//   npm run optimize-assets [-- -r] [-- --force]
//     Assets in the directory npm was run from (and below, with -r), skipping .gitignore'd files and
//     anything this clone's ledger (.husky/.asset-cache) says was already handled. --force ignores it.

import fs from 'node:fs';
import { formatBytes } from './config.mjs';
import { changedAssets, localAssets, parseArgs } from './changed-assets.mjs';
import { cleanup, optimizeFile, worthReplacing } from './encode.mjs';
import { blobId } from './git.mjs';
import { readLedger, recordLedger } from './ledger.mjs';

const args = parseArgs(process.argv.slice(2));
// npm runs scripts from the package root; INIT_CWD is where the command was typed.
if (args.local) process.chdir(process.env.INIT_CWD || process.cwd());
let assets;
try {
  assets = args.local ? localAssets(args) : changedAssets(args);
} catch (error) {
  console.error(
    `Could not list assets in ${process.cwd()}; run this inside a git repository.\n${error.message}`,
  );
  process.exit(1);
}
const ledger = args.local && !args.force ? readLedger() : new Map();
const handled = [];
const results = [];

for (const asset of assets) {
  const before = fs.statSync(asset.file).size;
  if (args.local && ledger.has(blobId(asset.file))) {
    console.log(
      `seen  ${formatBytes(before).padStart(10)}              ${asset.file}`,
    );
    continue;
  }
  try {
    const output = await optimizeFile(asset);
    const replaced = worthReplacing(output, before);
    if (replaced) fs.writeFileSync(asset.file, output);
    results.push({
      file: asset.file,
      before,
      after: replaced ? output.length : before,
      replaced,
    });
    if (args.local)
      handled.push({
        blob: blobId(asset.file),
        status: replaced ? 'optimized' : 'reviewed',
      });
  } catch (error) {
    results.push({
      file: asset.file,
      before,
      after: before,
      replaced: false,
      error: error.message,
    });
  }
  const r = results.at(-1);
  console.log(
    `${r.error ? 'ERR ' : r.replaced ? 'opt ' : 'keep'}  ${formatBytes(r.before).padStart(10)} -> ${formatBytes(r.after).padEnd(10)} ${r.file}${r.error ? `  (${r.error})` : ''}`,
  );
}

cleanup();
recordLedger(handled);
if (args.report)
  fs.writeFileSync(args.report, JSON.stringify(results, null, 2));

const saved = results.reduce((sum, r) => sum + r.before - r.after, 0);
console.log(
  `\n${results.filter((r) => r.replaced).length} of ${results.length} asset(s) optimized, ${formatBytes(saved)} saved.`,
);
