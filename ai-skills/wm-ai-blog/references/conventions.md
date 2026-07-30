# Blog Post Conventions

## Where this lives in the site

The main blog is the **default classic-preset blog plugin** (not a named plugin instance like feature announcements), configured in `docusaurus.config.js`:

```js
blog: {
  showReadingTime: true,
  onInlineTags: 'warn',
  onInlineAuthors: 'ignore',
  onUntruncatedBlogPosts: 'warn',
  authorsMapPath: '../../data/author/authors.yml',
  blogSidebarTitle: 'All Blogs',
  blogSidebarCount: 'ALL',
  path: 'blogs/blog',
},
```

Meaning:

- Source files live in `blogs/blog/`.
- Published URL is `/blog/<slug>` (with `routeBasePath` defaulting to `blog`), and any file named `YYYY-MM-DD-<slug>.mdx` is served at `/blog/YYYY/MM/DD/<slug>` — Docusaurus splits the date prefix into path segments.
- Authors are shared with feature announcements via `data/author/authors.yml`.
- Tags are **local** to the main blog: `blogs/blog/tags.yml`.
- Missing tags (`onInlineTags: 'warn'`) and untruncated posts (`onUntruncatedBlogPosts: 'warn'`) only **warn** — they do not fail `npm run build`. Broken links and images still fail the build (`onBrokenLinks: 'throw'`, enforced globally).

This is meaningfully more relaxed than `blogs/feature-announcements/`, which is its own plugin instance with a required availability line and its own tag set. Don't carry announcement rules over here.

## Filename format

```text
blogs/blog/YYYY-MM-DD-<slug>.mdx
```

Keep the slug kebab-case. Existing posts are inconsistent about slug casing (`AI-Native-Developer-Intelligence-at-scale` mixes case) — prefer all-lowercase kebab-case for new posts even though the build doesn't enforce it.

## Frontmatter fields

Observed across every current post — this is the actual, minimal convention, not an aspirational one:

| Field     | Required | Notes                                                                                                                |
| --------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `title`   | yes      | Quoted string. Both sentence case and title case appear; match the user's preference.                                |
| `authors` | yes      | Array of keys from `data/author/authors.yml` (the key, not the display name).                                        |
| `tags`    | no       | No existing post uses this field. Only add if the user wants it and the key already exists in `blogs/blog/tags.yml`. |
| `image`   | no       | Relative path to a hero/social card image. Not used by any current post, but supported.                              |

Example (from an existing post):

```yaml
---
title: "AI-Native Developer Intelligence at Scale"
authors: [SagarV]
---
```

## Authors

Check `data/author/authors.yml` before referencing an author. Always list the existing keys to the user rather than guessing. Example entry:

```yaml
SagarV:
  name: Sagar Vemala
  title: Engineering Manager at WaveMaker
  url: https://github.com/wm-sagarvemala
  image_url: https://github.com/wm-sagarvemala.png
  page: true
  socials:
    github: wm-sagarvemala
    linkedin: sagar-vemala-2b3b6214
```

Reference as `authors: [SagarV]`. If the user wants to add a new author, collect `name`, `title`, `url`, `image_url`, and `socials` from them — do not fabricate any of these fields — and append the entry to `authors.yml` before using the key.

## Tags

`blogs/blog/tags.yml` still holds the unedited Docusaurus starter tags (`facebook`, `hello`, `docusaurus`, `hola`, `tutorial`, `advanced`, `tips`) — none of them describe real content, and no published post references any of them. Treat this file as effectively empty for topical purposes:

- Default to **no tags** unless the user asks for them.
- If the user wants tags, propose real topic keys and add proper entries (label, permalink, description) to `tags.yml` first — do not reuse the placeholder keys as if they meant something.

Structure of a real entry, for reference:

```yaml
<tag-key>:
  label: <Display Label>
  permalink: /<tag-key>
  description: <One-line description>
```

## Asset placement

Assets are co-located under the blog root, not per-post:

- **Images**: `blogs/blog/assets/img/<image>.png`, referenced as `./assets/img/<image>.png`. Always include descriptive `alt` text. Existing posts sometimes have an accidental double slash (`./assets/img//foo.png`) — write a single slash for new posts.
- **Videos**: `blogs/blog/assets/videos/<slug>/<video>.mp4`, one subfolder per post, embedded with the pattern below (not a Markdown image or a bare link).

Never use `static/img/` for post-specific assets — that directory is reserved for globally-shared, site-wide assets (favicons, logos).

### Image with caption

The recurring pattern is an image immediately followed by an italicized one-line caption:

```mdx
![Ecosystem Overview — data sources, per-system indexing pipeline, and external MCP APIs](./assets/img/EcoSystem-Overview.png)
*Ecosystem overview: Data sources, per-system indexing pipeline, and external MCP APIs*
```

### Local video embed

```mdx
<video controls width="100%" playsInline>
  <source src={require('./assets/videos/<slug>/<file>.mp4').default} type="video/mp4" />
</video>
```

## Globally-registered MDX components

These are wired in `src/theme/MDXComponents/index.js` — **never import them**, importing causes a redeclaration error. All are available in any `.mdx` file under `blogs/` or `docs/`.

### `<AcademyCard>` / `<VideoCard>` — Academy content

Same components used by docs and feature announcements:

```mdx
<AcademyCard
  title="Styling with Design Tokens"
  description="Walkthrough on applying and overriding design tokens in Studio."
  academyLink="https://academy.wavemaker.ai/Walkthrough?wm=44FAE42ED5"
/>

<VideoCard
  videoUrl="https://academy.wavemaker.ai/Watch?wm=55311449F7"
  title="Create a Page in WaveMaker"
  description="Step-by-step walkthrough of page creation and management in Studio."
  thumbnailText="Create Page"
/>
```

The `wm=<ID>` identifier is generated when content is published on Academy — always get the exact URL from the user, never fabricate it.

### `<Pill>` / `<PillGroup>` — tech-stack tags at the top of a post

Used as a visual "what this post is about" strip right under the hook. Known preset types (from `src/components/MDXComponents/Pills/Pills.jsx`): `web`, `mobile`, `desktop`, `android`, `ios`, `backend`, `platform`, `design`, `beta`, `langgraph`, `rag`, `mcp`, `langfuse`, `ai`, `ragas`, `golden-datasets`. Any other `type` still renders (falls back to the raw string as the label), but prefer an existing preset or pass explicit `text`.

```mdx
<PillGroup>
  <Pill type="langgraph" />

  <Pill type="rag" />
</PillGroup>
```

### `<StatPill>` / `<StatPills>` — callout stats near the close of a post

```mdx
<StatPills>
  <StatPill color="blue" label="4 → 1" description="knowledge surfaces unified into a single AI-mediated experience" />

  <StatPill color="green" label="< 5 min" description="from documentation contribution to live AI response" />
</StatPills>
```

Valid `color` values (from `Pills.css`): `blue`, `green`, `indigo`. Do not use any other value.

## Truncation

`{/* truncate */}` marks where the listing-page preview cuts off. No current post uses it (the site only warns via `onUntruncatedBlogPosts: 'warn'`), so it is a recommendation, not a requirement. Recommend adding it after the hook so the `/blog` listing doesn't render the entire post.

In `.md` files the equivalent marker is `<!--truncate-->`, but posts here are `.mdx`, where HTML comments are invalid syntax (MDX parses `<` as JSX) and break the build. Always use `{/* truncate */}` and `{/* ... */}` for any other comment.

## Tone and structure

Tone varies more here than in docs or announcements — it's a blog. Read the nearest sibling post before drafting. Recurring patterns across existing posts:

- **Hook**: either a bold one-or-two-sentence lede right under the frontmatter, or an `##` heading that states a thesis, sometimes with an italic subtitle line beneath it.
- **`---` horizontal rules** between major sections — used generously as visual breathing room, more than in docs.
- **`##` for major sections**, occasional `###`/`####` for subsections within a long technical narrative.
- **Tables** for before/after comparisons or dimension-by-dimension breakdowns.
- **Blockquotes (`>`)** for pull quotes, key takeaways, or a quote attributed to "the team."
- **Bold** for key terms and phrases, used inline rather than as a separate callout.
- **Numbered or bulleted closing section** ("Five things worth taking away", "What we are still working on") or a short "Closing Thought" with an attributed quote.
- First person plural ("we") is common when narrating engineering work; second person ("you") appears in more instructional or persuasive passages.
- No enforced word count. Existing posts range from short (\~500 words) to long technical deep-dives (\~2,500+ words).

## Linking out

The main blog is its own plugin instance and does **not** participate in the docs plugin's filesystem-relative MDX link resolver.

| From → To                                    | Pattern                        | Example                                                      |
| -------------------------------------------- | ------------------------------ | ------------------------------------------------------------ |
| Blog post → Doc                              | URL path (no `.mdx` extension) | `/docs/guide/app-solutions/migrate-to-design-system-project` |
| Blog post → another blog post / announcement | URL with date segments         | `/blog/2026/04/09/AI-Native-Developer-Intelligence-at-scale` |
| Blog post → release notes index              | Fixed path                     | `/docs/release-notes/`                                       |
| Blog post → external site                    | Full `https://` URL            | `https://marketplace.wavemaker.ai/artifactDetails?name=...`  |

One existing post links to docs via the absolute `https://docs.wavemaker.ai/docs/...` form. That works, but it bypasses build-time link validation entirely — prefer the site-internal `/docs/...` form for anything the build can actually check.

### Why the relative form fails from here

Relative `.mdx` link resolution belongs to the docs plugin, resolving paths against a file's location inside `docs/`. The blog plugin has its own content root and does not share that resolver. A path like `../../user-interfaces/web/...` from `blogs/blog/...` means nothing to Docusaurus, and with `onBrokenLinks: 'throw'` enabled, the build fails.

## Build-time guarantees

The site enforces:

- `onBrokenLinks: 'throw'`
- `onBrokenMarkdownLinks: 'throw'`
- `onBrokenMarkdownImages: 'throw'`
- `mdxlint --frail` via `npm run lint` (this does lint files under `ai-skills/`, including this skill's own template — keep it free of angle-bracket placeholders and HTML comments)

`onInlineTags: 'warn'` and `onUntruncatedBlogPosts: 'warn'` do not fail the build — don't present them to the user as hard requirements.

Run `npm run lint` and `npm run build` before declaring a post done. Both must pass.

## Difference from adjacent surfaces

| Surface                                         | Use when                                               |
| ----------------------------------------------- | ------------------------------------------------------ |
| Blog post (`/blog`)                             | Longer narrative, engineering story, or thought piece. |
| Feature announcement (`/feature-announcements`) | Short, public-facing "we shipped X" notice.            |
| Release notes (`/docs/release-notes/`)          | Versioned, comprehensive list of changes in a release. |
| Docs page (`/docs/...`)                         | Reference, how-to, or conceptual documentation.        |

A single launch often produces entries on multiple surfaces; a blog post commonly links to the feature announcement and doc that cover the same shipped work.
