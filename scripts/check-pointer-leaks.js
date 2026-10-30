// Fails when a pointer file (see plugins/pointer-assets) ended up in the build output. That means a
// loader or Docusaurus change let a pointer through as if it were the image or video itself, so
// the published site would serve a few lines of text where the asset should be.
//
// Usage: node scripts/check-pointer-leaks.js [build-dir]
const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(
  process.argv[2] ?? path.join(__dirname, '../build'),
);
const MARKER = Buffer.from('s3-asset v');

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

function startsWithMarker(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(MARKER.length);
    const read = fs.readSync(fd, head, 0, head.length, 0);
    return read === MARKER.length && head.equals(MARKER);
  } finally {
    fs.closeSync(fd);
  }
}

if (!fs.existsSync(buildDir)) {
  console.error(`Build directory not found: ${buildDir}`);
  process.exit(1);
}

const leaked = [];
let scanned = 0;
for (const file of walk(buildDir)) {
  scanned += 1;
  if (startsWithMarker(file)) leaked.push(path.relative(buildDir, file));
}

if (leaked.length > 0) {
  console.error(
    `${leaked.length} pointer file(s) were copied into the build instead of being resolved to their URL:`,
  );
  leaked.forEach((file) => console.error(`  ${file}`));
  console.error(
    'Pointer files under static/ are copied as is and are not supported. Otherwise the pointer-assets plugin did not run for these files.',
  );
  process.exit(1);
}
console.log(`No pointer files in the build (${scanned} files checked).`);
