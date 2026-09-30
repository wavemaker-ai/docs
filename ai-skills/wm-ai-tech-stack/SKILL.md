---
name: wm-ai-tech-stack
description: >
  Use this skill when creating or editing a WaveMaker tech stack version file under
  data/tech-stack-data/. Activate when the user wants to add, update, or remove a library or tool
  on the /tech-stack page, start the tech stack for a new release, change a description or
  category, or check a tech stack file against its schema. This is distinct from release notes
  (docs/release-notes) and reference docs.
license: MIT
metadata:
  version: 0.1.0
  surface: data/tech-stack-data
  docusaurus: ^3.9.0
---

# WaveMaker AI Tech Stack

Use this skill to help a writer or developer create or edit a versioned tech stack file that feeds the `/tech-stack` page. The data is strictly structured and schema-validated — your job is to make the change in the right node, keep the file valid, and never guess at versions or links.

## When to use

- Add, update, or remove a library or tool in a version's tech stack.
- Start the tech stack for a new release (new version file).
- Change a platform, node, or shared-node description.
- Check a tech stack file against the schema, or fix a validation error.

## When NOT to use

- Release notes for a version → use the `wm-ai-release-notes` skill.
- A narrative or announcement post → use `wm-ai-feature-announcements` or `wm-ai-blog`.
- Changing the page UI or the diff logic → that is a code change, not a data change.
- Changing the data shape itself → update `data/tech-stack.schema.json`, `scripts/validate-tech-stack.js`, `src/pages/tech-stack/_components/techStackDiff.js`, and the **Tech stack data** section of `AGENTS.md` together, not this skill's flow.

## Inputs to collect

Before editing, confirm:

1. **Which version** — default to the newest file in `data/tech-stack-data/`. Confirm with the user. If the version file does not exist yet, see Step 1.
2. **What changes** — for each library: name, new version, and whether it is added, updated, or removed. Versions come from the user or the project's source of truth; do not infer them.
3. **Which node** — see `references/structure.md`. Ask when the placement is ambiguous (e.g. a tool needed in two nodes belongs in both).
4. **Description and link** — for a new library, get a one-sentence description and the official URL from the user. Do not invent either.

## Procedure

### Step 0 — Read the current state

Read the target version file and `data/tech-stack.schema.json`. Never edit `data/tech-stack-data/versionDataMap.js` — it is generated.

### Step 1 — New version file (only if asked)

1. Name it `<major>-<minor>-<patch>.json` (kebab-case, e.g. `12-1-0.json`).
2. Copy the newest existing file as the starting point, so unchanged libraries carry over and the page diff stays meaningful.
3. Keep the `"$schema": "../tech-stack.schema.json"` line first.
4. Tell the user which file you copied from.

### Step 2 — Plan the edits

List every change as `node → library → action (added / updated / removed) → old → new`. Present the list and get an explicit confirmation before editing.

### Step 3 — Edit the file

- Keep each library to the fields `name`, `description`, `link`, `version` (only `name` and `version` are required; other keys are rejected).
- Keep the version string style used by neighbouring entries in that node (some carry a leading `v`).
- Names must be unique within a node. The same tool may appear in more than one node when it is genuinely needed in both.
- Data shared by several platforms (today: `Backend`) lives once in the top-level shared node with `appliesTo` — edit it there, not per platform.
- Never add a new platform, node, or shared node unless the user explicitly asks for one. New top-level entries are allowed by the schema; they show up as new tabs.

### Step 4 — Validate

Run from the repo root:

```bash
npm run validate-tech-stack
npm run lint
npm run build
```

All three must pass. The validator names the exact path of any schema problem. Fix the data, do not loosen the schema to make an error go away.

### Step 5 — Sanity-check the diff

Open `/tech-stack?v=<version>` (or `npm start`) and confirm the New / Updated / Removed badges match what you intended. Use the "Compare With" dropdown to compare against a specific earlier version.

## Common mistakes to avoid

- **Invented versions or links** — ask; never guess.
- **Editing the wrong copy of shared data** — Backend is stored once, not under Web and Mobile.
- **Test or mock entries left behind** — remove anything marked `[Mock]` or `[Test]` before finishing, unless the user says to keep it.
- **Adding extra keys** — typos like `versoin` fail validation. Use only the documented keys.
- **Editing the generated map** — `versionDataMap.js` is rebuilt on every build.
- **Skipping the build** — lint alone does not exercise the page.
- **Committing generated files** — do not commit `build/` or `.docusaurus/`.

## Validation checklist

- [ ] Correct version file targeted, and confirmed with the user.
- [ ] Every change was listed and confirmed before editing.
- [ ] Each library is in the right node; shared data edited in the shared node.
- [ ] Only `name`, `description`, `link`, `version` keys used; no duplicates within a node.
- [ ] No invented versions, descriptions, or links.
- [ ] No mock/test entries remain.
- [ ] `npm run validate-tech-stack`, `npm run lint`, and `npm run build` pass.

## Reference files

- Node layout, shared-node rules, and entry format: `references/structure.md`
- Schema: `data/tech-stack.schema.json`
