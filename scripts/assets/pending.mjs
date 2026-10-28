#!/usr/bin/env node
// CI helper: counts the changed assets that still need optimizing, and those the pre-commit hook
// already handled (per commit-message trailers). Imports nothing outside this directory's
// dependency-free modules, so it runs without installing the optimizer packages.
//
// Usage: node scripts/assets/pending.mjs [--base <ref>] [--head <ref>] --trailers-from <ref> [--report <out.json>]
// Writes pending/covered/retried counts (numbers only) to $GITHUB_OUTPUT when set.

import fs from 'node:fs';
import { classifyAssets, parseArgs } from './changed-assets.mjs';

const args = parseArgs(process.argv.slice(2));
const { pending, covered, retried } = classifyAssets(args);

if (process.env.GITHUB_OUTPUT)
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `pending=${pending.length}\ncovered=${covered.length}\nretried=${retried}\n`,
  );
if (args.report)
  fs.writeFileSync(
    args.report,
    JSON.stringify(
      {
        pending: pending.length,
        covered: covered.map((a) => a.file),
        retried,
      },
      null,
      2,
    ),
  );
console.log(
  `${pending.length} asset(s) to optimize, ${covered.length} already handled by the pre-commit hook, ${retried} retried after a local failure.`,
);
