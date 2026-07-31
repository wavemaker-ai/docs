---
name: wm-feature-announcements
description: Create a WaveMaker feature announcement post under blogs/feature-announcements/. Use when the user wants to announce a new product feature, capability launch, or public-facing change that should appear on the /feature-announcements page (distinct from release notes or blog posts).
license: MIT
metadata:
  version: 0.1.0
  surface: blogs/feature-announcements
  docusaurus: ^3.9.0
---

# WaveMaker Feature Announcement

Use this skill to author a new entry on the Feature Announcements page (`/feature-announcements`). Feature announcements are short, public-facing posts that celebrate a shipped capability and point readers to deeper material (docs, release notes, blog posts).

## When to use

- User says "announce", "publish an announcement", "feature announcement", "add to what's new".
- A new feature has shipped and needs visibility on the `/feature-announcements` page.

## When NOT to use

- The user wants a technical blog post with a narrative or deep-dive → use the `wm-ai-blog` skill.
- The user wants to document a versioned release → use the release-notes skill.
- The user wants a reference/how-to page → use the docs-page skill.

## Inputs to collect

Before writing, confirm:

1. **Title** — short, product-facing (e.g., "Introducing AI Guardrails for Studio").
2. **Publish date** — ISO date (`YYYY-MM-DD`). Defaults to today.
3. **Slug** — kebab-case, used in filename (e.g., `ai-guardrails-launch`).
4. **Author key** — must exist in `data/author/authors.yml`. If it does not, ask the user whether to add it before proceeding.
5. **Tags** — must exist in `blogs/feature-announcements/tags.yml`. If missing, ask the user whether to add them.
6. **Summary** — one-sentence hook shown in the listing.
7. **Available from version** — **required**. The WaveMaker version the feature first ships in (e.g., `v12.0`, `v12.1.0`). Readers need to know where it lands. Ask the user explicitly; do not guess, do not default, do not proceed without it.
8. **Links** — related docs page, release note, or blog post (optional but recommended).
9. **Hero image** (optional) — path or asset to place under `./assets/images/`.
10. **Academy content** (optional) — an Academy walkthrough URL (`https://academy.wavemaker.ai/Walkthrough?wm=XXX`) and/or a video URL (`https://academy.wavemaker.ai/Watch?wm=XXX`), plus short `title` and `description` for each. Ask the user; do not fabricate.

## File layout

Create exactly one file:

```
blogs/feature-announcements/YYYY-MM-DD-<slug>.mdx
```

If the announcement has images or GIFs, place them at:

```
blogs/feature-announcements/assets/img/<image>.png
```

Reference assets with relative paths from the `.mdx` file (`./assets/img/hero.png`). Do not place these under `static/img/` — that directory is reserved for globally-shared assets.

## Procedure

1. **Verify prerequisites**
   - Read `data/author/authors.yml` and confirm the author key exists.
   - Read `blogs/feature-announcements/tags.yml` and confirm each tag exists.
   - If either is missing, stop and ask the user whether to add them. Do not invent author or tag entries silently.

2. **Compute the filename**
   - Format: `YYYY-MM-DD-<slug>.mdx` using the publish date and kebab-case slug.
   - Confirm no file with the same date+slug already exists.

3. **Create the file** using `assets/announcement-template.mdx` as the starting point.
   - Fill frontmatter (`title`, `authors`, `tags`, optional `image`).
   - Write the summary paragraph before the `{/* truncate */}` marker — this is what appears on the listing page.
   - Immediately after the `{/* truncate */}` marker, on its own line, add the availability line:

     ```
     **Available from WaveMaker vX.Y(.Z).**
     ```

     Use the version the user supplied. This line is required on every announcement.
   - Write the body after that.
   - Use MDX-style comments only: `{/* ... */}`. HTML comments (`<!-- ... -->`) are not valid in MDX and will fail the build.

4. **Place images** (if any) under `blogs/feature-announcements/assets/images/<slug>/` and reference with relative paths.

   **Academy / video content** (if provided): embed inline using the globally-registered MDX components. No import is needed — they are wired in `src/theme/MDXComponents/index.js`.

   - Walkthrough: `<AcademyCard title="..." description="..." academyLink="https://academy.wavemaker.ai/Walkthrough?wm=XXX" />`
   - Video: `<VideoCard videoUrl="https://academy.wavemaker.ai/Watch?wm=XXX" title="..." description="..." thumbnailText="..." />`
   - Compact inline form (use only when a card is overkill): `▶️ [Title](https://academy.wavemaker.ai/Walkthrough?wm=XXX)`

   Place Academy content either alongside "How to try it" (when the walkthrough is the fastest onboarding path) or under "Learn more" (when it is supplementary).

5. **Cross-link** related docs, release notes, or blog posts using **URL paths**, not filesystem-relative MDX paths. Feature announcements live in a separate Docusaurus plugin instance, so docs-style relative links (`../../user-interfaces/...`) do not resolve from here and will fail the build. Rules:
   - Link to a doc: `/docs/<section>/<page>` (no `.mdx` extension).
   - Link to a blog post: `/blog/YYYY/MM/DD/<slug>` — Docusaurus splits the `YYYY-MM-DD-` filename prefix into URL segments.
   - Link to another feature announcement: `/feature-announcements/YYYY/MM/DD/<slug>` — same rule.
   - Link to release notes index: `/docs/release-notes/`.
     Prefer site-internal links over external ones.

6. **Validate** by running from the repo root:

   ```
   npm run lint
   npm run build
   ```

   The build must succeed. `onBrokenLinks: 'throw'` and `onBrokenMarkdownLinks: 'throw'` are enabled, so any broken link fails the build.

## Content conventions

- **Tone**: confident, concise, user-focused. Active voice. Present tense.
- **Length**: 150–400 words in the body. Feature announcements are teasers, not deep-dives.
- **Structure** (suggested, not enforced):
  1. One-sentence hook (before `{/* truncate */}`).
  2. **What's new** — 1–3 sentences on the capability.
  3. **Why it matters** — 1–2 sentences on user impact.
  4. **How to try it** — a pointer to the doc/guide, not the full steps.
  5. **Learn more** — bulleted links to related material.
- **Headings**: start at `##`. The page title comes from frontmatter, so do not add an `<h1>`.
- **Callouts**: use Docusaurus admonitions (`:::tip`, `:::note`) sparingly.
- **Images**: always include `alt` text.

## Common mistakes to avoid

- Referencing an author key that does not exist in `authors.yml` — the build will fail or render "unknown author".
- Using `authors: [Author Name]` with a display name instead of the key.
- Placing images under `static/img/` instead of the co-located `./assets/images/` folder.
- Forgetting the `{/* truncate */}` marker — the entire post then renders in the listing.
- Using HTML comments (`<!-- ... -->`) anywhere in the MDX body — MDX treats `<` as the start of a JSX element and the build fails. Use `{/* ... */}` instead.
- Adding `import` statements for `AcademyCard`, `VideoCard`, `Pill`, `PillGroup`, etc. — they are globally registered. Importing them causes redeclaration errors.
- Fabricating Academy URLs. The `wm=XXX` identifier is generated when content is published on Academy; ask the user for the real URL and do not guess.
- Skipping the "Available from" line, or guessing the version. It is a required, user-supplied field — stop and ask if the user has not provided it.
- Editing `assets/announcement-template.mdx` to reintroduce angle-bracket placeholders (e.g., `<Your hook here>`). MDX parses `<Word...` as a JSX element and will fail on the next punctuation or space. Keep placeholders as plain text or wrap examples inside `{/* ... */}` comments.
- Adding an `<h1>` in the body (duplicates the title from frontmatter).
- Using absolute paths for images co-located with the post.
- Using docs-style relative MDX links (`../../user-interfaces/...`) to reach docs — they only work within the docs plugin. From an announcement, use `/docs/<section>/<page>` URL paths.
- Linking to a blog post or announcement without the date segments — `/blog/<slug>` is wrong; the correct form is `/blog/YYYY/MM/DD/<slug>`.

## Validation checklist

- [ ] Filename is `YYYY-MM-DD-<slug>.mdx` under `blogs/feature-announcements/`.
- [ ] `title`, `authors`, `tags` frontmatter present and valid.
- [ ] Author key exists in `data/author/authors.yml`.
- [ ] Every tag exists in `blogs/feature-announcements/tags.yml`.
- [ ] Summary precedes `{/* truncate */}`.
- [ ] No HTML comments (`<!-- ... -->`) anywhere in the body.
- [ ] Availability line (`**Available from WaveMaker vX.Y.**`) is present immediately after `{/* truncate */}` and uses the version supplied by the user.
- [ ] Any Academy walkthrough or video URLs were supplied by the user, not invented.
- [ ] All images live under `blogs/feature-announcements/assets/images/<slug>/` and are referenced relatively.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

## Reference files

- Template: `assets/announcement-template.mdx`
- Conventions and examples: `references/conventions.md`
