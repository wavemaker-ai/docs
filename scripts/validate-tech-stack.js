const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const dataDir = path.join(__dirname, '../data/tech-stack-data');
const schema = require('../data/tech-stack.schema.json');

const validate = new Ajv({ allErrors: true }).compile(schema);

// Rules JSON Schema cannot express.
function extraChecks(data) {
  const errors = [];
  const platforms = Object.entries(data).filter(([, n]) => !n.appliesTo);

  const checkNames = (where, libs) => {
    const seen = new Set();
    (Array.isArray(libs) ? libs : (libs?.libraries ?? [])).forEach(
      ({ name }) => {
        if (seen.has(name))
          errors.push(`${where}: duplicate library "${name}"`);
        seen.add(name);
      },
    );
  };

  Object.entries(data).forEach(([key, node]) => {
    if (node.appliesTo) {
      checkNames(key, node);
      Object.entries(node.appliesTo).forEach(([platform, { after }]) => {
        const target = data[platform];
        if (!target || target.appliesTo) {
          errors.push(`${key}: appliesTo "${platform}" is not a platform`);
        } else if (after && !(after in target)) {
          errors.push(`${key}: "${after}" does not exist in ${platform}`);
        } else if (key in target) {
          errors.push(`${key}: ${platform} already has a "${key}" node`);
        }
      });
    }
  });
  platforms.forEach(([platform, node]) =>
    Object.entries(node).forEach(([key, child]) => {
      if (key !== 'description') checkNames(`${platform} > ${key}`, child);
    }),
  );
  return errors;
}

const files = fs
  .readdirSync(dataDir)
  .filter((f) => /^\d+-\d+-\d+\.json$/.test(f));

let failed = false;
files.forEach((file) => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  const errors = [];
  if (!validate(data)) {
    validate.errors.forEach((e) =>
      errors.push(`${e.dataPath || '/'} ${e.message}`),
    );
  } else {
    errors.push(...extraChecks(data));
  }
  if (errors.length) {
    failed = true;
    console.error(`\n${file} does not match tech-stack.schema.json:`);
    errors.forEach((e) => console.error(`  - ${e}`));
  }
});

if (failed) process.exit(1);
console.log(`Tech stack data valid (${files.length} versions).`);
