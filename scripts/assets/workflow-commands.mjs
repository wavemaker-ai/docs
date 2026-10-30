// Escaping for GitHub Actions workflow commands (`::error file=...::message`). A file name comes from
// a pull request, so it is escaped as GitHub requires: a newline or a colon in a name must not be
// able to start another command.
export const escapeData = (text) =>
  String(text).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

export const escapeProperty = (text) =>
  escapeData(text).replace(/:/g, '%3A').replace(/,/g, '%2C');

// A file name for an ordinary log line. GitHub reads a workflow command from any line that starts with
// `::`, so a name containing a newline must never reach the log raw.
export const displayName = (text) =>
  String(text).replace(/\r/g, '\\r').replace(/\n/g, '\\n');
