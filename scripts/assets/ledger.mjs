// Local record of assets this clone has already optimized or reviewed, so repeat local runs skip
// them. Keyed by git blob id (content), not path: a replaced file is picked up again, a moved one
// is not. One "<blob id> <status>" line per entry; the last line for a blob wins. Gitignored.

import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './git.mjs';

function ledgerFile() {
  return path.join(repoRoot(), '.husky', '.asset-cache');
}

// Blob id -> 'optimized' | 'reviewed'.
export function readLedger() {
  const ledger = new Map();
  let text;
  try {
    text = fs.readFileSync(ledgerFile(), 'utf8');
  } catch {
    return ledger;
  }
  for (const line of text.split('\n')) {
    const match = line.match(/^([0-9a-f]{40,64}) (optimized|reviewed)$/);
    if (match) ledger.set(match[1], match[2]);
  }
  return ledger;
}

export function recordLedger(entries) {
  if (!entries.length) return;
  const lines = entries.map(({ blob, status }) => `${blob} ${status}\n`);
  try {
    fs.appendFileSync(ledgerFile(), lines.join(''));
  } catch (error) {
    console.error(
      `assets: could not update the local ledger (${error.message})`,
    );
  }
}
