---
name: wm-ai-blog
description: >
  Use this skill when writing a narrative engineering or thought-leadership blog post
  under `blogs/blog/` for the WaveMaker docs site. Activate when the user wants a blog
  post, an engineering story, a "how we built X" writeup, or an opinion/thought-leadership
  piece for `/blog` — distinct from a feature announcement (short, public "we shipped X"
  notice), release notes (versioned changelog), or a core doc (reference/how-to page).
license: MIT
metadata:
  version: 0.1.0
  surface: blogs/blog
  docusaurus: ^3.9.0
---

# WaveMaker Blog Post

Use this skill to author a new post on the main blog (`/blog`). Blog posts are longer, narrative pieces — engineering deep-dives, "how we built it" retrospectives, and thought-leadership arguments — distinct from the short public-facing notices on `/feature-announcements` and the versioned changelog in `docs/release-notes/`.

## When to use

- User wants to write a blog post, engineering story, or "how we built X" retrospective.
- User wants a thought-leadership or opinion piece published to `/blog`.
- User has a draft, notes, or a rough narrative and wants it turned into a publish-ready post.

## When NOT to use

- User wants a short, public "we shipped X" notice → use the `wm-ai-feature-announcements` skill.
- User wants a versioned, comprehensive list of changes in a release → use the `wm-ai-release-notes` skill.
- User wants a reference or conceptual doc page under `docs/` → use the `wm-ai-documentation` skill.
- User wants a step-by-step how-to or tutorial → use the `wm-ai-create-guide` skill.

If the request is borderline (e.g., "write about the feature we shipped"), ask: "Is this a short public notice, or a longer story about how it works / how you built it?" The former is a feature announcement; the latter is a blog post.

## Operating principles

- **This skill is more editorially loose than its siblings.** There is no sidebar to wire and no required tab/accordion classification. The site only *warns* (doesn't fail the build) on an untruncated post, but this skill always places a `{/* truncate */}` marker regardless — ask the user where they'd like the preview to cut if the default (right after the hook) doesn't fit. Do not invent structure beyond that the codebase doesn't enforce.
- **Read 1–2 existing posts in `blogs/blog/` before drafting.** Tone, section rhythm, and component usage vary by author; match the nearest sibling rather than a fixed formula.
- **Outline first for long or multi-section posts.** For a short opinion piece, a single-shot draft is fine — ask the user which they want.
- **Confirm before writing.** Present the draft (or section-by-section, for a long post) and get confirmation before creating the file.
- **Verify everything you reference** — author keys, tags, doc/blog links, image and video paths — before writing them. See `references/conventions.md`.

## Inputs to collect

Ask these together, in one grouped message:

1. **Title** — descriptive, can be a thesis statement or a question (e.g., "AI Guardrails vs Assembly Explained"). Sentence case or title case both appear in existing posts — match whichever the user prefers.
2. **Publish date** — `YYYY-MM-DD`. Defaults to today; this becomes the filename prefix and the post's URL date segments.
3. **Slug** — kebab-case, descriptive, used in the filename.
4. **Author key** — read `data/author/authors.yml` and list the existing authors (key + name) for the user to pick from. If they want someone not on the list, offer to add a new entry and ask for the details needed to do so: display `name`, `title`, profile `url`, `image_url`, and any `socials` (github/linkedin handles). Do not invent or guess any of these fields — add the entry only with what the user supplies.
5. **Source material** — draft text, notes, a Slack thread, or just a topic and a few bullet points. Treat the user's input as source-of-truth for facts; you handle structure and prose.
6. **Tags** (optional) — most existing posts carry no tags at all. Only add tags if the user wants them, and only reuse a key that already exists in `blogs/blog/tags.yml`. That file currently holds unrelated Docusaurus-starter placeholders (`facebook`, `hola`, `tutorial`, ...) — do not reuse those as if they were real topics; if the user wants a real tag, add a proper entry to `tags.yml` first and confirm with them.
7. **Media** (optional) — screenshots/diagrams, a local video file, or an Academy walkthrough/video URL.

Do not start drafting until title, slug, and author are confirmed.

## File layout

```text
blogs/blog/YYYY-MM-DD-<slug>.mdx
```

Assets are co-located and shared across all posts in this plugin instance (not per-slug for images):

```text
blogs/blog/assets/img/<image>.png
blogs/blog/assets/videos/<slug>/<video>.mp4
```

Never place post assets under `static/img/` — that directory is for globally-shared, site-wide assets only.

## Procedure

1. **Verify prerequisites**
   - Confirm the author key was resolved per the "Author key" step above (existing key picked, or new entry added with user-supplied details).
   - If the user wants tags, read `blogs/blog/tags.yml` and confirm each tag key already exists there as a real (non-placeholder) entry.
   - Read 1–2 existing posts under `blogs/blog/` (pick ones closest in topic or the same author) to calibrate tone and structure.

2. **Compute the filename**
   - Format: `YYYY-MM-DD-<slug>.mdx`. Confirm no file with the same date+slug already exists in `blogs/blog/`.

3. **Agree on structure**
   - For a short piece, propose a simple flow (hook → 2-4 sections → close) and confirm.
   - For a long narrative or technical deep-dive, propose a heading outline first (see `references/conventions.md` for the recurring shapes) and get it confirmed before drafting prose.

4. **Draft the post** using `assets/blog-template.mdx` as the starting skeleton.
   - Fill frontmatter (`title`, `authors`, optional `tags`/`image`).
   - Write the hook, then the body, following the tone and component conventions in `references/conventions.md`.
   - **Always place `{/* truncate */}`.** Default to right after the hook (and after any pill strip, if used) — tell the user that's where you're putting it, and ask if they'd prefer a different cut point. Never leave it out just because the build only warns without it.
   - Use `{/* ... */}` for any MDX comments (including `{/* truncate */}`) — never HTML `<!-- ... -->`, which fails the MDX build.
   - **Pills, if used**: list the existing preset types (see `references/conventions.md`) and prefer one. If the user wants a new type not in that list, ask for (or suggest) a label and a color before adding it — see "New pill types" in `references/conventions.md`.

5. **Place media**
   - Images → `blogs/blog/assets/img/<file>.png`, referenced as `./assets/img/<file>.png`, with descriptive `alt` text and an optional italic caption line below.
   - Local video → `blogs/blog/assets/videos/<slug>/<file>.mp4`, embedded with the `<video>` + `require()` pattern in `references/conventions.md`.
   - Academy content → `<AcademyCard>` / `<VideoCard>` (globally registered, no import) — only with a real user-supplied URL, never fabricated.

6. **Cross-link** related docs, release notes, or other posts using **site-internal URL paths**, not filesystem-relative MDX paths — this plugin instance does not share the docs plugin's relative-link resolver:
   - Doc: `/docs/<section>/<page>` (no extension).
   - Another blog post: `/blog/YYYY/MM/DD/<slug>`.
   - A feature announcement: `/feature-announcements/YYYY/MM/DD/<slug>`.
   - Release notes index: `/docs/release-notes/`.

7. **Validate** from the repo root:

   ```sh
   npm run lint
   npm run build
   ```

   Both must pass. `onBrokenLinks: 'throw'` means any broken link fails the build even though untruncated posts and missing tags only warn.

## No sidebar step

Unlike guides and core docs, blog posts do not need a sidebar entry. The blog plugin auto-lists every post (`blogSidebarCount: 'ALL'`) ordered by filename date. There is nothing to wire — do not go looking for a `blogSidebar.js`.

## Common mistakes to avoid

- **Copying the feature-announcement rules verbatim.** This is a different, more relaxed surface: no required "Available from vX.Y" line, no sidebar file, and tags are rare rather than required. (Unlike announcements, though, still always add `{/* truncate */}` — see below.)
- **Forgetting `{/* truncate */}`.** The build only warns, never fails, without one — but this skill places one anyway. Default to right after the hook and confirm the placement with the user rather than skipping it.
- **Inventing a one-off pill `type` without checking existing presets first.** List the presets from `references/conventions.md` to the user and prefer one of them. Only add a brand-new type (with its own color) to `Pills.jsx`/`Pills.css` after the user confirms a label and color for it.
- **Reusing `blogs/blog/tags.yml` placeholders** (`facebook`, `hola`, `hello`, `docusaurus`) as if they were real topic tags. They are unedited starter content. Add a real entry first if the user wants a tag.
- **HTML comments (`<!-- ... -->`) anywhere in the body** — MDX parses `<` as JSX and the build fails. Use `{/* ... */}`.
- **Importing `Pill`, `PillGroup`, `StatPill`, `StatPills`, `AcademyCard`, `VideoCard`, `Accordian`, `TabsWrapper`** — all globally registered in `src/theme/MDXComponents/index.js`. An `import` causes a redeclaration error.
- **Using an invalid `StatPill` color** — only `blue`, `green`, `indigo` are styled in `Pills.css`.
- **Filesystem-relative links to docs** (`../../docs/...`) — this plugin instance can't resolve them. Use `/docs/...` URL paths instead.
- **Linking to a post or announcement without date segments** — `/blog/<slug>` is wrong; it must be `/blog/YYYY/MM/DD/<slug>`.
- **Fabricating an Academy `wm=<ID>` URL** — always get the real URL from the user.
- **Placing images under `static/img/`** instead of the co-located `blogs/blog/assets/img/`.
- **Adding a body `<h1>`** — the title comes from frontmatter; body headings start at `##`.
- **Inventing structure the site doesn't enforce** — no fixed section list, no required word count, no mandatory tags. Match the nearest sibling post instead of a rigid template.

## Validation checklist

- [ ] Filename is `YYYY-MM-DD-<slug>.mdx` under `blogs/blog/`.
- [ ] `title` and `authors` are set in frontmatter; the author key exists in `data/author/authors.yml`.
- [ ] Any `tags` used already exist as real (non-placeholder) entries in `blogs/blog/tags.yml`.
- [ ] No HTML comments (`<!-- ... -->`) anywhere in the body; MDX comments use `{/* ... */}`.
- [ ] A `{/* truncate */}` marker is present (placed after the hook by default, or wherever the user requested).
- [ ] Any pill `type` used is either an existing preset (listed to the user beforehand) or a new one added to `Pills.jsx`/`Pills.css` with a label and color the user confirmed.
- [ ] Images live under `blogs/blog/assets/img/`, referenced with a single `./assets/img/...` (no double slash).
- [ ] Local videos live under `blogs/blog/assets/videos/<slug>/` and use the `<video>` + `require()` embed.
- [ ] Any Academy walkthrough/video URL was supplied by the user, not invented.
- [ ] Cross-links use site-internal URL paths (`/docs/...`, `/blog/YYYY/MM/DD/...`), not filesystem-relative MDX paths.
- [ ] No new sidebar file was touched — none is needed.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

## Reference files

- Template: `assets/blog-template.mdx`
- Tone, structure, component, and linking conventions: `references/conventions.md`
