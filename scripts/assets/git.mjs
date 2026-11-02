import { execFileSync } from 'node:child_process';
import path from 'node:path';

export function gitWith(options, ...args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
}

export function git(...args) {
  return gitWith({}, ...args);
}

// Same as git(), but pathspecs are taken literally (no globbing or magic).
export function gitLiteral(...args) {
  return gitWith(
    { env: { ...process.env, GIT_LITERAL_PATHSPECS: '1' } },
    ...args,
  );
}

// Maps each file path in a commit's tree to its blob id.
export function treeBlobs(rev) {
  const blobs = new Map();
  for (const entry of git('ls-tree', '-r', '-z', rev).split('\0')) {
    const match = entry.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/s);
    if (match) blobs.set(match[2], match[1]);
  }
  return blobs;
}

// The blob id git would store for this file, i.e. what `git add` produces.
export function blobId(file) {
  return git('hash-object', '--', file).trim();
}

export function repoRoot() {
  return git('rev-parse', '--show-toplevel').trim();
}

// Absolute path of a file inside the git dir (correct for worktrees too).
export function gitPath(name) {
  return path.resolve(git('rev-parse', '--git-path', name).trim());
}

// The repository's own index. Unlike gitPath('index'), this ignores GIT_INDEX_FILE, which git sets
// to a temporary index for `git commit <paths>`.
export function defaultIndexPath() {
  return path.join(git('rev-parse', '--absolute-git-dir').trim(), 'index');
}
