#!/usr/bin/env node
// Loop guard for the publish job: counts the bot commits at the tip of the PR branch with no human
// commit in between, and says `blocked=true` from `--limit` (default 3) on. Every bot push starts a
// new workflow run, so a bug that kept changing files would otherwise push forever. A person's push
// ends the streak, and the next run may push again.
//
// The marker is free text in a commit message, so a person can fake it. That can only turn the push
// off for their own PR, never on, so the guard fails safe.
//
// Usage (inside the PR checkout): node bot-streak.mjs --base <ref> [--limit 3]
// Writes `streak` and `blocked` to $GITHUB_OUTPUT when set.
import fs from 'node:fs';
import { git } from './git.mjs';

const MARKER = '[asset-bot]';

export function botStreak(base, head = 'HEAD') {
  const subjects = git('log', '--first-parent', '--format=%s%x00', '-z', `${base}..${head}`)
    .split('\0')
    .filter((entry) => entry.length);
  let streak = 0;
  for (const subject of subjects) {
    if (!subject.includes(MARKER)) break;
    streak++;
  }
  return streak;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  if (!args.base) {
    console.error('Usage: bot-streak.mjs --base <ref> [--limit 3]');
    process.exit(2);
  }
  const limit = Number.isInteger(Number(args.limit)) && Number(args.limit) > 0 ? Number(args.limit) : 3;
  const streak = botStreak(args.base);
  const blocked = streak >= limit;
  if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `streak=${streak}\nblocked=${blocked}\n`);
  console.log(
    blocked
      ? `${streak} bot commits in a row: the bot will not push again until a person does.`
      : `${streak} bot commit(s) at the tip.`,
  );
}
