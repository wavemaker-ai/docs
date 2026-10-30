import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { botStreak } from './bot-streak.mjs';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'bot-streak.mjs');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'streak-'));
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' } });
let n = 0;
const commit = (message) => {
  fs.writeFileSync(path.join(dir, 'f.txt'), String(++n));
  git('add', '.');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', message);
};
const here = (cwd) => process.chdir(cwd);

test('counts the bot commits at the tip, and a person ends the streak', () => {
  git('init', '-q', '-b', 'main');
  commit('base');
  git('branch', 'base');
  const cwd = process.cwd();
  here(dir);
  try {
    assert.equal(botStreak('base'), 0);
    commit('feat: add image');
    assert.equal(botStreak('base'), 0);
    commit('chore: optimize assets [asset-bot]');
    commit('chore: optimize assets and store them in the bucket [asset-bot]');
    assert.equal(botStreak('base'), 2);
    commit('fix: change text');
    assert.equal(botStreak('base'), 0);
    for (let i = 0; i < 3; i++) commit('chore: optimize assets [asset-bot]');
    assert.equal(botStreak('base'), 3);
  } finally {
    here(cwd);
  }
});

test('the command blocks from the limit on', () => {
  const run = (limit) => {
    const out = path.join(dir, `out-${limit}`);
    fs.writeFileSync(out, '');
    const r = spawnSync('node', [script, '--base', 'base', '--limit', String(limit)], { cwd: dir, env: { ...process.env, GITHUB_OUTPUT: out }, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return fs.readFileSync(out, 'utf8');
  };
  assert.match(run(3), /streak=3\nblocked=true/);
  assert.match(run(4), /streak=3\nblocked=false/);
});
