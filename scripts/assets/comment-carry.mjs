// Used by the "Report" step of .github/workflows/assets.yaml (read from the default branch, like the
// other scripts here).
//
// The PR comment's optimization table is rebuilt from git on every run (history.mjs), which cannot
// know about a file the optimizer looked at and left alone ("already optimized"): nothing was
// committed for it. The run that did the optimizing knows, and says so in its row. The next run, on
// the bot's own commit, scans nothing, so that row would disappear.
//
// keptRows() carries those rows over from the previous comment's optimization section. The previous
// comment is untrusted text, so a row is reused only when
//   - its file cell is a plain `path` and the file is still one of the PR's changed assets,
//   - its size cell has exactly the shape this workflow writes, and
//   - that size still equals the file's size now (a pointer counts by the size it claims).
// Only the file name, the size and a short note are taken from it. Anything else in the row is ignored.

const FILE = /^`([^`|<>&\n]+)`$/;
const AFTER = /^(\d+(?:\.\d+)? (?:KB|MB)) \(([^()<>`|&\n]{1,80})\)$/;
// "(−36%)": a file that was optimized. Those rows come from git, never from here.
const SAVED = /^[−-]\d+%$/;
// A bot commit rows used to be written for a pure pointer swap, as "(−0%)": nothing was saved.
const NO_SAVING = /^[−-]0%$/;

// previous: the text between the optimization markers of the previous comment ('' if none).
// assets: the size check's list, [{ file, size }].
// shown: files that already have a row. formatSize: bytes -> "14.81 MB", as the comment prints it.
export function keptRows({ previous, assets, shown, formatSize }) {
  const sizes = new Map((assets ?? []).map((a) => [a.file, a.size]));
  const rows = [];
  for (const line of String(previous ?? '').split('\n')) {
    const cells = line.split(' | ');
    if (cells.length !== 3 || !cells[0].startsWith('| ') || !cells[2].endsWith(' |')) continue;
    const file = FILE.exec(cells[0].slice(2).trim())?.[1];
    const after = AFTER.exec(cells[2].slice(0, -2).trim());
    if (!file || !after || shown.has(file) || !sizes.has(file)) continue;
    const [, size, note] = after;
    if (SAVED.test(note) && !NO_SAVING.test(note)) continue;
    if (formatSize(sizes.get(file)) !== size) continue;
    rows.push({ file, size: sizes.get(file), note: NO_SAVING.test(note) ? 'already optimized' : note });
    shown.add(file);
  }
  return rows;
}
