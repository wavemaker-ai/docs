#!/usr/bin/env node
// Fails when an asset added or changed on this branch exceeds its size limit.
//
// Usage: node scripts/assets/check-sizes.mjs [--base <ref>] [--head <ref>] [--report <out.json>] [files...]
// With no files, checks assets changed between the merge base of --base and --head. Without --base it
// uses the nearest of origin/release, origin/docs and origin/main (see defaultBase).

import fs from 'node:fs';
import { LIMITS, formatBytes } from './config.mjs';
import { changedAssets, parseArgs } from './changed-assets.mjs';

const args = parseArgs(process.argv.slice(2));
const assets = changedAssets(args).map((asset) => {
  const size = fs.statSync(asset.file).size;
  const limit = LIMITS[asset.category].maxBytes;
  return { ...asset, size, limit, ok: size <= limit };
});
const violations = assets.filter((asset) => !asset.ok);

const limitsLine = Object.values(LIMITS)
  .map(
    (rule) =>
      `${rule.label} (${rule.extensions.join(', ')}): ${formatBytes(rule.maxBytes)}`,
  )
  .join(' · ');

let markdown = `### Asset size check\n\nLimits: ${limitsLine}\n\n`;
if (!assets.length) {
  markdown += 'No added or changed assets.\n';
} else {
  markdown += '| File | Size | Limit | |\n|---|---:|---:|---|\n';
  for (const a of assets) {
    markdown += `| \`${a.file}\` | ${formatBytes(a.size)} | ${formatBytes(a.limit)} | ${a.ok ? '✅' : '❌'} |\n`;
  }
}

if (args.report) {
  fs.writeFileSync(
    args.report,
    JSON.stringify({ limits: limitsLine, assets }, null, 2),
  );
}

if (process.env.GITHUB_ACTIONS) {
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  for (const v of violations) {
    console.log(
      `::error file=${v.file}::${formatBytes(v.size)} exceeds the ${formatBytes(v.limit)} limit`,
    );
  }
}

for (const a of assets) {
  console.log(
    `${a.ok ? 'ok  ' : 'FAIL'}  ${formatBytes(a.size).padStart(10)} / ${formatBytes(a.limit).padEnd(8)} ${a.file}`,
  );
}
console.log(
  violations.length
    ? `\n${violations.length} of ${assets.length} asset(s) exceed the size limit.`
    : `\n${assets.length} asset(s) checked, all within limits.`,
);
process.exit(violations.length ? 1 : 0);
