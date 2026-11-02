// The decision logic for the three flows (O optimize, U upload, R replace), through every on/off
// combination, with and without permission to act, on a collection branch and on another one.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { COLLECTION_BRANCHES, decide } from './flows.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const workflowFile = path.join(here, '..', '..', '.github', 'workflows', 'assets.yaml');
const flag = (b) => (b ? 'true' : 'false');
const COMBINATIONS = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({ o: !!(n & 4), u: !!(n & 2), r: !!(n & 1) }));
const args = (c, extra = {}) => ({
  optimize: flag(c.o),
  upload: flag(c.u),
  replace: flag(c.r),
  mayAct: true,
  baseRef: 'docs',
  ...extra,
});

test('with permission, on a collection branch, each flow runs exactly when its switch is on', () => {
  for (const c of COMBINATIONS) {
    const d = decide(args(c));
    assert.deepEqual(d.run, { optimize: c.o, upload: c.u, replace: c.r }, JSON.stringify(c));
    assert.equal(d.decode, c.o || c.r, `decode for ${JSON.stringify(c)}`);
  }
});

test('all off: nothing runs, no decode, and the optional flows say they are turned off', () => {
  const d = decide(args({ o: false, u: false, r: false }));
  assert.equal(d.decode, false);
  assert.match(d.status.upload.description, /turned off/);
  assert.match(d.status.replace.description, /turned off/);
  assert.equal(d.status.upload.state, 'success');
  assert.equal(d.status.replace.state, 'success');
});

test('a flow that runs has no preset status; one that does not never blocks a merge', () => {
  for (const c of COMBINATIONS) {
    const d = decide(args(c));
    assert.equal(d.status.upload === null, c.u);
    assert.equal(d.status.replace === null, c.r);
    for (const s of [d.status.upload, d.status.replace]) if (s) assert.equal(s.state, 'success');
  }
});

test('without permission to act nothing runs, whatever the switches say', () => {
  for (const c of COMBINATIONS) {
    const d = decide(args(c, { mayAct: false }));
    assert.deepEqual(d.run, { optimize: false, upload: false, replace: false }, JSON.stringify(c));
    assert.equal(d.decode, false);
    if (c.u) assert.match(d.status.upload.description, /\/optimize-assets/);
    if (c.r) assert.match(d.status.replace.description, /\/optimize-assets/);
  }
});

test('replace only runs on the collection branches; upload and optimize run anywhere', () => {
  const all = { o: true, u: true, r: true };
  for (const branch of COLLECTION_BRANCHES) assert.equal(decide(args(all, { baseRef: branch })).run.replace, true, branch);
  for (const branch of ['main', 'prod', 'feature/x', '', undefined]) {
    const d = decide(args(all, { baseRef: branch }));
    assert.deepEqual(d.run, { optimize: true, upload: true, replace: false }, String(branch));
    assert.match(d.status.replace.description, /only runs on pull requests into release and docs/);
  }
});

test('the defaults: optimize is on unless it says false, upload and replace are on only when they say true', () => {
  const unset = decide({ mayAct: true, baseRef: 'docs' });
  assert.deepEqual(unset.run, { optimize: true, upload: false, replace: false });
  for (const value of [' TRUE ', 'True']) assert.equal(decide({ upload: value, mayAct: true, baseRef: 'docs' }).run.upload, true, value);
  for (const value of ['yes', '1', 'on', 'enabled', 'tru', '']) {
    const d = decide({ upload: value, replace: value, mayAct: true, baseRef: 'docs' });
    assert.equal(d.run.upload, false, value);
    assert.equal(d.run.replace, false, value);
  }
  assert.equal(decide({ optimize: ' FALSE ', mayAct: true, baseRef: 'docs' }).run.optimize, false);
  assert.equal(decide({ optimize: 'no', mayAct: true, baseRef: 'docs' }).run.optimize, true, 'only false turns it off');
});

test('risky but valid combinations carry a warning for the PR comment', () => {
  assert.equal(decide(args({ o: true, u: true, r: true })).warnings.length, 0);
  assert.match(decide(args({ o: false, u: true, r: true })).warnings.join(' '), /optimization is off/);
  assert.match(decide(args({ o: true, u: false, r: true })).warnings.join(' '), /upload is off/);
  assert.equal(decide(args({ o: false, u: false, r: false })).warnings.length, 0);
  assert.equal(decide(args({ o: false, u: true, r: false })).warnings.length, 0);
});

test('the command line reads the environment and writes the outputs', () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'flows-')), 'out');
  const run = spawnSync(process.execPath, [path.join(here, 'flows.mjs')], {
    env: { ...process.env, ASSET_OPTIMIZE: '', ASSET_UPLOAD: 'true', ASSET_REPLACE: 'true', MAY_ACT: 'true', BASE_REF: 'release', GITHUB_OUTPUT: out },
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr);
  const lines = Object.fromEntries(fs.readFileSync(out, 'utf8').trim().split('\n').map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  assert.equal(lines.run_optimize, 'true');
  assert.equal(lines.run_upload, 'true');
  assert.equal(lines.run_replace, 'true');
  assert.equal(lines.decode, 'true');
  assert.equal(lines.status_upload, '""');
  assert.deepEqual(JSON.parse(lines.warnings), []);
});

test('the collection branches match the ones the workflow triggers on', () => {
  const text = fs.readFileSync(workflowFile, 'utf8');
  const list = (match) => match[1].split(',').map((s) => s.trim().replace(/'/g, ''));
  const trigger = list(/pull_request_target:[\s\S]*?branches: \[([^\]]*)\]/.exec(text));
  assert.deepEqual([...COLLECTION_BRANCHES].sort(), trigger.sort());
  const declared = /const COLLECTION_BRANCHES = \[([^\]]*)\]/.exec(text)[1].split(',').map((s) => s.trim().replace(/'/g, ''));
  assert.deepEqual(declared.sort(), [...COLLECTION_BRANCHES].sort());
});

// A step's `if:` condition, read as text from the workflow.
function stepCondition(name) {
  const text = fs.readFileSync(workflowFile, 'utf8');
  const start = text.indexOf(`      - name: ${name}\n`);
  assert.notEqual(start, -1, `step ${name} exists`);
  const block = text.slice(start, text.indexOf('\n      - ', start + 10));
  return /^ {8}if: (.+)$/m.exec(block)?.[1];
}

test('upload and replace never run when optimization was expected but its output was not applied', () => {
  for (const name of ['Upload to the bucket', 'Replace assets with pointer files']) {
    const condition = stepCondition(name);
    assert.match(condition, /steps\.scan\.outputs\.optimize != 'true' \|\| steps\.apply\.outputs\.state == 'ok'/, name);
  }
});

test('the replace step hands the optimizer and apply reports over when optimization was expected', () => {
  const text = fs.readFileSync(workflowFile, 'utf8');
  assert.match(text, /--pending "\$RUNNER_TEMP\/pending\.json" --optimize-report "\$RUNNER_TEMP\/optimize\.json" --apply-report "\$RUNNER_TEMP\/apply\.json"/);
});

test('the AWS credentials are referenced in the upload step only, and the push token in the push step only', () => {
  const text = fs.readFileSync(workflowFile, 'utf8');
  const uses = (secret) => [...text.matchAll(new RegExp(`secrets\\.${secret}`, 'g'))].length;
  assert.equal(uses('AWS_ACCESS_KEY_ID'), 1);
  assert.equal(uses('AWS_SECRET_ACCESS_KEY'), 1);
  assert.equal(uses('ASSET_BOT_TOKEN'), 1);
});

test('each override command is wired to its own status, in the trigger, the concurrency key and the resolve step', () => {
  const text = fs.readFileSync(workflowFile, 'utf8');
  for (const command of ['/allow-upload-failure', '/allow-size-failure']) {
    // the job trigger and the concurrency group, plus the resolve map
    assert.ok(text.split(`'${command}'`).length >= 4, `${command} in the trigger, the concurrency key and the map`);
  }
  assert.match(text, /'\/allow-upload-failure': \{ context: 'asset-upload-check'/);
  assert.match(text, /'\/allow-size-failure': \{ context: 'asset-size-check'/);
  // The override job may set these two statuses and nothing else.
  assert.match(text, /\['asset-upload-check', 'asset-size-check'\]\.includes\(process\.env\.CONTEXT\)/);
});
