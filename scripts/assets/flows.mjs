#!/usr/bin/env node
// Decides which of the three flows run, and what the status of a flow that does not run says. The
// workflow's `if:` conditions only read this script's outputs, so the logic that can go wrong is in
// one place that the tests run through all eight on/off combinations.
//
//   O  optimize: compress assets in place (the decode job, applied by the publish job)
//   U  upload:   store each real asset in the bucket under its hash; never edits the repository
//   R  replace:  swap a real asset for a pointer file, once its object is verified in the bucket
//
// Switches are repository variables. ASSET_OPTIMIZE is on unless it says `false`, which keeps what the
// pipeline did before the other flows existed. ASSET_UPLOAD and ASSET_REPLACE are on only when they say
// `true`, so nothing is uploaded by accident. A flow also needs `mayAct`: the run is allowed to change
// the pull request (same-repo branch, trusted author, or a maintainer's command), which is what keeps
// an untrusted fork's files out of the bucket until a maintainer has looked at them.
//
// R only runs on PRs into the collection branches (`release`, `docs`): they are squash-merged, so a
// binary never reaches history and a pointer keeps the repository small. On any other branch the
// binary stays in history anyway, so swapping it would only add churn. U runs anywhere.
//
// Usage: node flows.mjs   (reads ASSET_OPTIMIZE, ASSET_UPLOAD, ASSET_REPLACE, MAY_ACT, BASE_REF)
// Writes the outputs below to $GITHUB_OUTPUT.
import fs from 'node:fs';

// Keep in sync with `on.pull_request_target.branches` and COLLECTION_BRANCHES in the workflow's
// "Resolve PR" step (a test compares them).
export const COLLECTION_BRANCHES = ['release', 'docs'];

const normalize = (value) => String(value ?? '').trim().toLowerCase();

export function decide({ optimize, upload, replace, mayAct, baseRef }) {
  const on = {
    optimize: normalize(optimize) !== 'false',
    upload: normalize(upload) === 'true',
    replace: normalize(replace) === 'true',
  };
  const collection = COLLECTION_BRANCHES.includes(baseRef);
  const run = {
    optimize: on.optimize && mayAct,
    upload: on.upload && mayAct,
    replace: on.replace && mayAct && collection,
  };

  // What `asset-upload-check` and `asset-replace-check` say when the flow does not run. Both are
  // success: a flow that is off or does not apply must never block a merge.
  const skipped = (flag, name, reason) =>
    flag.run ? null : { state: 'success', description: `${name}: ${reason}` };
  const why = (isOn, extra) =>
    !isOn ? 'turned off' : !mayAct ? 'not run, a maintainer must comment /optimize-assets first' : extra;
  const status = {
    upload: skipped({ run: run.upload }, 'Upload', why(on.upload, '')),
    replace: skipped(
      { run: run.replace },
      'Replace',
      on.replace && mayAct && !collection
        ? `not applicable, it only runs on pull requests into ${COLLECTION_BRANCHES.join(' and ')}`
        : why(on.replace, ''),
    ),
  };

  // Combinations that are valid but worth saying out loud in the PR comment.
  const warnings = [];
  if (run.replace && !on.optimize)
    warnings.push(
      'Replace is on while optimization is off: files are stored as they are and cannot be optimized later without restoring them first.',
    );
  if (run.replace && !on.upload)
    warnings.push(
      'Replace is on while upload is off: only files whose objects are already in the bucket are replaced.',
    );

  return {
    on,
    run,
    // The decode job also measures image sizes for the pointers, so it runs for R as well as for O.
    decode: run.optimize || run.replace,
    status,
    warnings,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const e = process.env;
  const result = decide({
    optimize: e.ASSET_OPTIMIZE,
    upload: e.ASSET_UPLOAD,
    replace: e.ASSET_REPLACE,
    mayAct: e.MAY_ACT === 'true',
    baseRef: e.BASE_REF,
  });
  const lines = [
    `on_optimize=${result.on.optimize}`,
    `on_upload=${result.on.upload}`,
    `on_replace=${result.on.replace}`,
    `run_optimize=${result.run.optimize}`,
    `run_upload=${result.run.upload}`,
    `run_replace=${result.run.replace}`,
    `decode=${result.decode}`,
    `status_upload=${JSON.stringify(result.status.upload ?? '')}`,
    `status_replace=${JSON.stringify(result.status.replace ?? '')}`,
    `warnings=${JSON.stringify(result.warnings)}`,
  ];
  if (e.GITHUB_OUTPUT) fs.appendFileSync(e.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
  console.log(lines.join('\n'));
}
