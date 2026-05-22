---
name: wm-ai-documentation
description: >
  Use this skill when writing, updating, moving, or deleting a single core documentation
  page under `docs/<section>/...` for WaveMaker docs. Activate when the user wants to
  document a feature, capability, concept, or reference topic — typically a conceptual or
  reference page that lives in the main docs tree (not a how-to in `docs/guide/`, not a
  release note, not a feature announcement). The skill is interactive: it works with the
  user one section at a time, confirms structure before writing, and enforces WaveMaker's
  tone, asset, linking, and sidebar conventions.
metadata:
  version: 0.1.0
  surface: docs/
  docusaurus: ^3.9.0
---

# WaveMaker Core Documentation

Use this skill to help a writer or developer produce a single core documentation page under `docs/<section>/...`. Core docs are the conceptual and reference pages that explain *what* something is, *how it works*, and *what its parts are* — distinct from task-oriented guides, versioned release notes, and feature announcements.

This skill is **interactive**. Work with the user one decision at a time. Outline before drafting. Confirm before writing. Treat every recommendation as a proposal the user can redirect.

## When to use

- User wants to write a new reference or conceptual page somewhere under `docs/`.
- User wants to update an existing core doc — restructure, refresh, fill gaps.
- User wants to move or rename a doc and needs assets, links, and sidebar updates handled together.
- User wants to delete a doc and clean up its assets and inbound references.

## When NOT to use

- User wants a step-by-step how-to or tutorial → use `wm-ai-create-guide`. Guides live under `docs/guide/` and are task-oriented.
- User wants to log a shipped item in a versioned release notes file → use `wm-ai-release-notes`.
- User wants a public-facing announcement on `/feature-announcements` → use `wm-feature-announcements`.
- User wants a narrative engineering blog post → no skill exists for blog posts yet; handle manually or ask the user to follow the blog contribution guide.

If the request is borderline, ask one clarifying question before activating: "Is this a reference page that explains the topic, or a step-by-step guide to do something specific?"

## Operating principles

- **Outline first, prose second.** Agree on the heading structure before drafting any section. This prevents wasted rewrites.
- **One section at a time.** Draft, present, confirm, move on. Do not generate a full page in a single shot unless the user explicitly asks for it.
- **Match the surrounding section's tone.** Read 1–2 sibling docs in the same `_category_` folder before drafting — they set the voice for that area.
- **Prefer text and diagrams over screenshots.** Screenshots are added only when truly necessary (see conventions).
- **Verify everything you reference.** Doc paths, sidebar IDs, asset filenames — confirm they exist before writing them.

## Procedure

### Step 0 — Identify the operation

Before anything else, determine which operation the user wants:

1. **Create** — a new doc.
2. **Update** — change an existing doc.
3. **Move / rename** — relocate a doc and its assets.
4. **Delete** — remove a doc and clean up.

Ask if it is not obvious. The rest of the procedure branches from here.

### Step 1 (Create) — Inputs to collect

For a new doc, confirm the following with the user. Ask these in a single grouped message — do not interrogate one question at a time:

1. **Section and path** — where in `docs/` does this belong? (e.g., `docs/apis-and-services/apis/database-and-crud-apis/`). If unsure, propose 1–2 candidates based on the topic.
2. **Filename slug** — kebab-case, no date prefix (date prefixes are only for blogs and announcements).
3. **File type** — `.mdx` (preferred). Use `.mdx` if the page needs MDX components (`VideoCard`, `AcademyCard`, Redoc, tabs, etc.) or might in the future.
4. **Page title** — sentence case, descriptive (e.g., "Generated APIs", "Stored Procedures"). This goes in frontmatter as `title:`, not as a body `# heading`.
5. **Author name** — required. Goes into `last_update: { author: "Name" }`.
6. **Audience and depth** — who reads this and how much do they already know? Used to set the tone and decide whether to include background context.
7. **Source material** — does the user have draft text, bullet notes, an internal Confluence page, a Slack discussion, or just a topic? Treat raw input as source-of-truth for facts; you handle structure and prose.
8. **Sibling docs to mirror** — ask the user to point at 1–2 existing docs in the same area whose style and depth this page should match. If the user has no preference, read the siblings in the same `_category_` folder yourself.

Do not start drafting until the user has confirmed at least path, slug, title, and author.

### Step 2 (Create) — Propose an outline

Before writing prose, propose the heading structure as a bulleted list of `##` and `###` headings. Lean on the patterns in `references/conventions.md` (Overview → When to use → How it works → Configuration → Examples → Notes/Limitations → Summary). Adapt to the topic — do not force every section. Do not add a `## Related` section unless the user asks for it or there are genuinely useful links to include — propose it as an option if relevant sibling docs exist.

Present the outline and ask: "Does this structure look right? I can add, remove, or reorder sections before we start writing."

Only proceed to drafting after the user confirms the outline.

### Step 3 (Create) — Draft one section at a time

For each section in the agreed outline:

1. Draft the section in WaveMaker's tone — descriptive, present tense, active voice, no marketing language. See `references/conventions.md` for tone rules.
2. Decide whether the section benefits from a visual. Default is **no asset**. Add one only when:
   - **Mermaid** — the content is a flow, decision tree, sequence, or state transition. Prefer mermaid over an image for anything that can be drawn as nodes and edges.
   - **Infographic / diagram / illustration** — the content is an abstract concept (architecture, layered model, data flow). Ask the user whether they have or can provide one; do not invent file paths.
   - **Screenshot** — only when the visual is genuinely necessary (e.g., a unique UI shape that words cannot describe). Default is no screenshot.
3. Present the drafted section to the user. Ask for revisions. Once approved, hold it until all sections are drafted, then write the file in one operation.

When the user says "just write it" or otherwise asks to skip section-by-section review, switch to a single-shot draft — but still surface every asset and link as a separate question before finalising.

### Step 4 (Create) — Place assets and links

Apply the asset and link rules from `references/conventions.md`:

- **Images and GIFs** → `./assets/img/<filename>.png`, co-located next to the `.mdx` / `.md` file. Never `static/img/`.
- **Mermaid** → inline fenced ` ```mermaid ` block. No file needed.
- **Internal links to other docs** → relative MDX path from this file, no `.md` / `.mdx` extension, target must exist.
- **External links** → full `https://` URL.
- **Academy walkthroughs / videos** → user-supplied URL only. Use the globally-registered `<AcademyCard>` or `<VideoCard>` components, no import.

Verify every path before writing it. If a target does not exist, stop and ask the user.

### Step 5 (Create) — Write the file

Use `assets/doc-template.mdx` as the starting skeleton. Fill in frontmatter, drop in the agreed sections, attach assets, and write to disk.

After writing, do not move on until you have also done Step 9 (sidebar) and Step 10 (validation).

### Step 6 (Update) — Procedure for updates

For an existing doc:

1. **Read the current file in full** before suggesting changes.
2. **Read 1–2 sibling docs** to confirm the surrounding voice.
3. Ask the user what they want to change — a single section, a refresh, a restructure, missing details, or stale facts.
4. For each change, present the proposed edit (old → new) and confirm before writing.
5. If the change adds new headings or sections, re-run the outline check from Step 2.
6. If the change adds or removes assets, follow Step 4 *and* clean up orphaned files (see "Asset cleanup" below).
7. Proceed to Steps 9 and 10 only if the change affects sidebar wiring or link targets.

### Step 7 (Move / rename) — Procedure for relocation

A move is three concurrent changes — the file, its assets, and every inbound reference. Do them in this order:

1. **Identify inbound references.** Search the repo for the current doc path (with and without the `.md`/`.mdx` extension) and for the sidebar `id`. Report every hit to the user before changing anything.
2. **Identify owned assets.** List every asset referenced from this doc (look for `./assets/img/...`, `./assets/vids/...`, image tags, and `require(...)` calls).
3. **Check asset sharing.** For each asset, grep the repo for other docs that reference it. If shared, the asset moves to the **nearest common ancestor's** `assets/img/` directory (per AGENTS.md). If exclusive, it moves with the doc.
4. **Present the move plan** to the user — new path, asset moves, sidebar update, list of files whose links will change. Ask for confirmation.
5. **Execute** — move the file, move its exclusive assets, rewrite inbound links to the new path, update the sidebar `id`, leave shared assets in place (relocate only if their common-ancestor changes).
6. **Run validation** (Step 10). The build is the source of truth for link and image correctness — it must pass.

### Step 8 (Delete) — Procedure for deletion

1. **Identify inbound references.** Same search as the move step. If anything links to this doc, surface it to the user and decide together: redirect, rewrite, or remove the link.
2. **Identify owned assets.** Same survey as the move step.
3. **Check asset sharing.** Assets used only by this doc are deleted. Assets shared with other docs stay; if the deleted doc was the only sibling pinning an asset to its current location, consider moving the asset closer to its remaining users.
4. **Present the delete plan** — file to remove, assets to delete, inbound links to fix, sidebar entry to remove.
5. **Execute** only after confirmation.
6. **Run validation** (Step 10).

### Step 9 — Update the sidebar

Every create / move / rename / delete touches `sidebar/sidebars/<area>Sidebar.js`. The right file matches the docs area:

| Docs area                     | Sidebar file                     |
| ----------------------------- | -------------------------------- |
| `docs/apis-and-services`      | `apisServicesSidebar.js`         |
| `docs/build-and-deploy`       | `deploySidebar.js`               |
| `docs/design-system`          | `designSystemSidebar.js`         |
| `docs/developing-with-agents` | `aiAgentsSidebar.js`             |
| `docs/guide`                  | `guideSidebar.js`                |
| `docs/release-notes`          | `releaseNotesSidebar.js`         |
| `docs/studio`                 | `studioSidebar.js`               |
| `docs/user-interfaces/web`    | `userInterfacesWebSidebar.js`    |
| `docs/user-interfaces/mobile` | `userInterfacesMobileSidebar.js` |

#### File hierarchy mirrors sidebar nesting — keep them in sync

The folder structure under `docs/<section>/` and the sidebar nesting are two representations of the same tree. **They must stay in sync at all times.**

- Each **subdirectory** corresponds to a sidebar `category` at the same depth.
- Each **file** corresponds to a sidebar `doc` item at the same depth.
- **Adding a file** to an existing folder → add a `doc` entry inside the matching sidebar category.
- **Adding a file in a new subfolder** → add a new `category` node wrapping a `doc` entry at the correct nesting level, not a flat entry at the top of the sidebar.
- **Moving a file** to a deeper or shallower folder → move its sidebar entry to match the new depth.
- **Renaming a folder** → rename (or reorganise) the matching sidebar category and update all `id` values inside it.

When you place a new doc, derive the correct sidebar position by reading the folder path:

```text
docs/<section>/<sub1>/<sub2>/my-doc.mdx
                ↓       ↓
  sidebar: category<sub1> > category<sub2> > doc id="<section>/<sub1>/<sub2>/my-doc"
```

Before editing the sidebar, read the current file (or a representative slice) to understand the existing nesting so you insert at the right level rather than appending at the top.

Prefer, in order (per AGENTS.md):

1. **`npm run manage-docs`** — interactive CLI that handles insertion, naming variants, and rollback. Recommend this to the user for any non-trivial change.
2. **Helpers from `scripts/doc-manager.mjs`** — `insertItemIntoSidebar`, `getDocTemplate`, `getNameVariants`, `parseSidebarContent`.
3. **Direct edit** — only for small, obvious changes (reordering a known entry, fixing a label typo, removing one entry on deletion).

The sidebar entry format:

```js
{
  type: 'doc',
  id: '<section>/<subpath>/<filename-without-extension>',
  label: '<Short human-readable label>',  // optional; falls back to frontmatter title
},
```

The `id` must exactly match the file path relative to `docs/`, without the `.md` / `.mdx` extension. A mismatch silently breaks the link or the page disappears from navigation.

### Step 10 — Validate

From the repo root:

```sh
npm run lint     # eslint + mdxlint --frail
npm run build    # enforces onBrokenLinks / onBrokenImages: throw
```

Both must pass. The build is the source of truth for link and image correctness — `lint` alone is not sufficient. Per AGENTS.md, do not declare the change done until both pass.

If the build fails, read the error, fix the root cause, and re-run. Never bypass hooks with `--no-verify`.

## Asset cleanup (move and delete)

When moving or deleting a doc, the assets it owns must be handled deliberately:

- **Exclusive asset** (referenced only by this doc) → moves with the doc, or is deleted with it.
- **Shared asset** (referenced by other docs as well) → stays where it is unless the nearest common ancestor of the remaining users changes. If so, relocate it and update the other docs that reference it.
- **Orphaned asset** (no longer referenced by anything) → delete it. Do not leave dangling files.

To find sharers, search the repo for the asset filename. Any `.mdx`, `.md`, or component file that references it is a sharer.

If the assets directory becomes empty after the operation, remove the empty directory.

## Common mistakes to avoid

- **Generating a full page on the first turn** — this skill is interactive. Outline, draft, confirm, repeat.
- **Adding `# Heading` body H1** — the title comes from frontmatter (`title:`). Body headings start at `##`. Per AGENTS.md.
- **Marketing tone** — describe what the feature does, not how impressive it is. No "powerful", "seamless", "exciting".
- **Screenshots by default** — screenshots get added only when words and diagrams cannot do the job.
- **Inventing asset paths** — if the user has not given an image, do not write a `./assets/img/...` reference and "leave it for later". Either get the image or skip the visual.
- **Placeholder links** — never write `[Documentation](#)` or `[TBD]`. Verify the target exists, or omit the link.
- **`.md` / `.mdx` extension in relative links** — Docusaurus resolves them without the extension. Drop the extension.
- **Putting content-specific assets in `static/img/`** — that directory is for globally shared assets (favicons, site-wide logos). Everything else is co-located.
- **HTML comments in MDX** — `<!-- ... -->` fails the MDX build. Use `{/* ... */}`.
- **Importing globally-registered components** — `AcademyCard`, `VideoCard`, `Pill`, `PillGroup`, `Accordian`, `TabsWrapper` are wired in `src/theme/MDXComponents/index.js`. Importing them causes redeclaration errors.
- **Angle-bracket placeholders in MDX bodies** — `<Your text here>` is parsed as a JSX element and breaks the build. Use plain-text placeholders or wrap examples inside `{/* ... */}`.
- **Skipping the sidebar update** — a doc with no sidebar entry is published but unreachable. Always update the matching sidebar file.
- **Adding a sidebar entry at the wrong nesting level** — the sidebar tree must mirror the folder tree. A file at `docs/a/b/c/doc.mdx` belongs inside category `a` > category `b` > category `c`, not at the top level of the sidebar. Read the folder path, then insert the entry at the matching depth.
- **Moving a file without rewriting inbound links** — `onBrokenLinks: 'throw'` means a stale link fails the build. Fix every reference, not just the file path.
- **Leaving orphaned assets** — after a delete, remove any image that no other doc references.
- **Skipping validation** — `npm run lint` and `npm run build` must both pass before declaring the change done.

## Validation checklist

- [ ] File lives at the correct path under `docs/<section>/` and uses a kebab-case filename.
- [ ] Frontmatter includes `last_update: { author: "Name" }`; `title:` is set; no body `# H1`.
- [ ] Body headings start at `##`.
- [ ] Tone is descriptive, present tense, active voice, no marketing language.
- [ ] Every image has descriptive `alt` text and lives in a co-located `assets/img/` directory.
- [ ] Every mermaid block compiles (no stray characters; node IDs are unique).
- [ ] Every internal link is relative, has no `.md` / `.mdx` extension, and points to a file that exists.
- [ ] The matching sidebar file is updated; the entry `id` matches the file path relative to `docs/`.
- [ ] The sidebar entry is nested at the depth that mirrors the folder depth — each subfolder level = one category level in the sidebar.
- [ ] On move / rename: every inbound link has been rewritten; exclusive assets moved; orphans cleaned up.
- [ ] On delete: every inbound link resolved; exclusive assets removed; sidebar entry removed.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

## Reference files

- Tone, structure, asset, and linking conventions: `references/conventions.md`
- Page skeleton: `assets/doc-template.mdx`
