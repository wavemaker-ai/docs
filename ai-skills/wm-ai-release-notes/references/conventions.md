# Release Notes Conventions

## Fixed structure

Release notes use a fixed three-tab, four-accordian layout, wrapped in `<ReleaseNotesTabs>` (not the generic `<TabsWrapper>` — that's a plain, content-agnostic tabs component used elsewhere; `<ReleaseNotesTabs>` is the release-notes-specific composition on top of it). **Never add, rename, or remove any tab or accordian.**

`<ReleaseNotesTabs>` automatically computes each tab's item-count badge (the sum of entries across its accordians) and auto-expands the first non-empty accordian in each tab. Do not add `count`, `badge`, `emptyState`, or `defaultOpen` props by hand — write plain `<TabItem>` and `<Accordian>` tags as shown below and this is handled for you.

### Tabs

| Tab          | When to use                                     |
| ------------ | ----------------------------------------------- |
| Features     | New capabilities that did not exist before.     |
| Enhancements | Improvements to existing capabilities.          |
| Bug Fixes    | Things that were broken and now work correctly. |

### Accordians (same in every tab)

| Accordian         | What belongs here                                                             |
| ----------------- | ----------------------------------------------------------------------------- |
| User Interface    | Visual editor, canvas, component library, layout tools, theming UI.           |
| Backend           | APIs, data sources, Java/Spring services, custom endpoints, BFF, variables.   |
| Platform          | AI agents, Studio platform, build pipeline, authentication, project settings. |
| Product Ecosystem | Docs site, Academy, Storybook, Marketplace, SDKs, CLI.                        |

### Empty tabs and accordians

An empty tab must use the self-closing form — no inner content block:

```mdx
<TabItem name="Enhancements" />
```

An accordian with no content for this release can be omitted entirely or left with a comment:

```mdx
<Accordian title="Backend">
{/* Content */}
</Accordian>
```

## Entry format

```mdx
- ### Title of the item <Pill type="web" /> <Pill type="mobile" />

  One sentence. Short and precise.

  [Documentation](../relative/path/to/doc)
```

### Title

- Written as a `###` heading inside the list item.
- 4–7 words. Noun-phrase style (e.g., "Auto Layout for responsive UIs", "Design System based projects").
- No trailing punctuation.

### Platform pills

Append pills immediately after the title, on the same line.

| Pill                     | When to use                                     |
| ------------------------ | ----------------------------------------------- |
| `<Pill type="web" />`    | Feature applies to web (Angular or React) apps. |
| `<Pill type="mobile" />` | Feature applies to mobile (React Native) apps.  |

Use both when the feature applies to both platforms. Omit entirely when platform-neutral (e.g., a backend or docs change).

### Body copy

One sentence. No preamble. No marketing filler. Active voice, present tense.

- Good: "Build web and mobile apps using design tokens and standardized component variants for consistent, scalable theming."
- Bad: "This exciting new feature allows users to now build apps with design tokens…"

If the item genuinely needs more explanation, that detail belongs in a linked doc — not here.

### Sub-bullets

Items can have sub-bullets (without a `###` heading) when listing variants or options under a parent:

```mdx
- ### Web Applications <Pill type="web" />
  - **Angular (Default)**: Build robust enterprise-grade web apps with our optimized Angular output.
  - **React (Beta)**: Export production-ready React code from the same visual development experience.
```

Use sub-bullets sparingly — only when the variants are meaningfully distinct and worth surfacing.

## Link rules

### Relative links (internal docs)

- Path is relative to the `.mdx` file being edited, using `../` to navigate up.
- **No file extension** — strip `.md` and `.mdx` from the path.
- **Must be verified** — resolve the path from the current file's directory and confirm the target exists in the repo before writing the link.

```mdx
[Documentation](../../../design-system/concepts)
```

To verify: run `find docs/ -name "<filename>" -type f` or `ls` the directory. If the file does not exist, do not add the link.

### Absolute links (external URLs)

Use for Academy, Storybook, Marketplace, external blogs, or any resource outside the docs repo. Keep the full `https://` URL.

```mdx
[Web Storybook](https://react-components.wavemaker.ai)
[Academy](https://academy.wavemaker.ai)
```

### Link labels

Use one of the standard labels below. Do not invent new ones without a clear reason.

| Label              | Use for                                      |
| ------------------ | -------------------------------------------- |
| `Documentation`    | Internal docs page or guide.                 |
| `Learn more`       | Secondary internal reference.                |
| `Academy`          | Academy learning path or walkthrough.        |
| `Web Storybook`    | React Storybook site.                        |
| `Mobile Storybook` | React Native Storybook site.                 |
| `Marketplace`      | WaveMaker Marketplace.                       |
| (product name)     | External site with a clear product identity. |

## Style rules

| Rule                            | What it means                                                           |
| ------------------------------- | ----------------------------------------------------------------------- |
| One sentence maximum            | The body line is a single sentence. Period. End.                        |
| No detail in the note           | If more than one sentence is needed, write a doc and link to it.        |
| No placeholder links            | Do not write `[Documentation](#)`. Verify the target exists first.      |
| No extensions in relative links | Drop `.md` and `.mdx` — Docusaurus resolves them without the extension. |
| Active voice                    | "Build apps using…" not "Apps can now be built using…"                  |
| No marketing language           | Describe what it does. Avoid "exciting", "powerful", "seamless".        |
| Sentence case for body          | Sentence case only. No Title Case in the body text.                     |

## Examples

### Feature — with two platform pills and a doc link

```mdx
- ### Auto Layout for responsive UIs <Pill type="web" /> <Pill type="mobile" />

  Create structured, responsive layouts visually with precise control over alignment, spacing, orientation and sizing—without writing CSS.

  [Documentation](../../../user-interfaces/web/develop/working-with-layouts/auto-layout)
```

### Feature — sub-bullets, no doc link needed

```mdx
- ### Web Applications <Pill type="web" />
  - **Angular (Default)**: Build robust enterprise-grade web applications with our optimized Angular-based output.
  - **React (Beta)**: Export production-ready React code while using the same visual development experience.
```

### Feature — external link only

```mdx
- ### WaveMaker Academy as a learning platform

  Mentor-led learning paths, self-paced tutorial videos, and certification-oriented programs for faster developer onboarding.

  [Academy](https://academy.wavemaker.ai)
```

### Bug Fix — no link needed

```mdx
- ### Token resolution in nested component variants <Pill type="web" />

  Fixed incorrect token inheritance when a component variant is nested inside another variant.
```

### Bad — multi-sentence body

```mdx
- ### Auto Layout

  Auto Layout allows you to create structured layouts. You can control alignment and spacing.
  It works on both web and mobile. You don't need to write any CSS.
```

> Fix: one sentence only — move the rest to a doc.

### Bad — relative link with extension

```mdx
[Documentation](../../../user-interfaces/web/develop/auto-layout.mdx)
```

> Fix: remove `.mdx` → `../../../user-interfaces/web/develop/auto-layout`

### Bad — unverified placeholder link

```mdx
[Documentation](#)
```

> Fix: resolve the actual doc path and verify the file exists before writing the link.
