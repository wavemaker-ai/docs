---
name: wm-ai-mermaid
description: >
  Use this skill whenever you add or edit a Mermaid diagram in WaveMaker docs, blogs, or
  feature announcements (a ```mermaid fence in any `.md` / `.mdx` file). Activate when the user
  asks for a diagram, flowchart, process flow, or architecture sketch, or asks how diagram colors
  work. Colors are automatic, so this skill covers structure and validation, not color choices.
license: MIT
metadata:
  version: 0.2.0
  surface: docs, blogs
  docusaurus: ^3.9.0
---

# WaveMaker Mermaid diagrams

Diagrams on this site take their colors from `src/theme/Mermaid/styles.module.css` and `src/theme/Mermaid/levels.js`, not from Mermaid's own theme. Colors are automatic. Do not set them per diagram.

## How flowcharts are colored

- **One color per level.** A node's level is one more than its deepest parent along the edges. Nodes with no parent are level 0. The colors run green, violet, amber, steel, rose, slate down the levels, and start again after six levels.
- **No repeats down the tree.** A node never shares a color with any of its parents.
- **Siblings match.** The children of one parent share a color. The exception is a node with several parents at different depths, which sits below the deepest one so it still differs from all of them.
- **Flat, no borders.** Nodes and groups (subgraphs) are a single solid tint, with no gradient or outline. Groups are a light slate tint behind their nodes. Rectangles have rounded corners.
- **Palette.** The six colors are the `--wm-diagram-*` tokens in `src/css/custom.css`. Change a color there, not in a diagram.

Other diagram types (sequence, state, class, ER) are not leveled and use the first palette color.

## Rules

- Do not add `class`, `classDef`, `style`, or `linkStyle` color rules, and do not use `wm-*` classes. The site ignores them, and a hand-picked color could repeat a parent's.
- Shape the diagram so the levels read well: put the parent above its children and avoid edges that skip levels without a reason.
- Do not rely on color alone to tell nodes apart. Labels must still make sense in grayscale.
- Use `subgraph` for grouping only. Levels come from the edges, not from the groups.

## Validation

Mermaid renders in the browser, so a bad diagram only shows up on the page, not in the build. After adding a diagram:

```
npm run lint
npm run build
```

Then check the page in `npm start` in both light and dark mode. Confirm every node's text is readable.
