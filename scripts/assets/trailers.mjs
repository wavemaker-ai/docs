// Commit-message trailers that carry the pre-commit hook's result to CI. Each line names the blob
// the status applies to, so CI trusts it only while the file still has exactly that content:
//
//   Assets-Optimized: <blob id> <path>   optimized locally and the result was kept
//   Assets-Reviewed:  <blob id> <path>   left as is (discarded in review, or nothing to gain)
//   Assets-Failed:    <blob id> <path>   local optimization failed; CI should try
//
// Trailer text comes from PR commits, so it is untrusted: it is only ever compared against blob ids.

import { git } from './git.mjs';

export const STATUS_KEYS = {
  optimized: 'Assets-Optimized',
  reviewed: 'Assets-Reviewed',
  failed: 'Assets-Failed',
};

const KEY_STATUS = Object.fromEntries(
  Object.entries(STATUS_KEYS).map(([status, key]) => [key, status]),
);

const LINE =
  /^(Assets-(?:Optimized|Reviewed|Failed)):[ \t]+([0-9a-f]{40}|[0-9a-f]{64})[ \t]+(\S.*?)[ \t]*$/;

export function formatTrailer({ status, blob, path }) {
  return `${STATUS_KEYS[status]}: ${blob} ${path}`;
}

export function parseTrailerLine(line) {
  const match = LINE.exec(line);
  if (!match) return null;
  return { status: KEY_STATUS[match[1]], blob: match[2], path: match[3] };
}

// Blob ids named by the trailers of the commits in `range`.
// `done`: optimized or reviewed, so CI leaves them alone. `failed`: CI should retry.
export function processedBlobs(range) {
  const done = new Set();
  const failed = new Set();
  const trailers = git(
    'log',
    '--format=%(trailers:only=true,unfold=true)',
    range,
  );
  for (const line of trailers.split('\n')) {
    const trailer = parseTrailerLine(line);
    if (!trailer) continue;
    (trailer.status === 'failed' ? failed : done).add(trailer.blob);
  }
  return { done, failed };
}
