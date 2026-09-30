# Tech stack data structure

Source of truth is `data/tech-stack.schema.json`; this file explains how to use it.

## File

`data/tech-stack-data/<major>-<minor>-<patch>.json`. The page lists versions newest first and, by default, compares each with its immediate predecessor. Users can pick any other version to compare with.

## Shape

```text
Platform (tab) → Node (accordion) → libraries
```

Every node is an object with two optional reserved keys:

- `description` — one line shown under the node's title.
- `libraries` — array of `{ name, description, link, version }`.

Any other key inside a platform is a node. A node holds `libraries`; it does not contain other nodes.

## Current layout

| Platform | Nodes (in order)                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------ |
| Web      | Frontend/UI - Angular, Frontend/UI - React, Backend (shared), Deployment - Angular, Deployment - React |
| Mobile   | Frontend/UI, Backend (shared), Developer setup                                                         |

There is no Web developer setup and no Mobile deployment.

## Shared nodes

Data used by more than one platform is stored once at the top level with `appliesTo`:

```json
"Backend": {
  "description": "…",
  "appliesTo": {
    "Web":    { "after": "Frontend/UI - React" },
    "Mobile": { "after": "Frontend/UI" }
  },
  "libraries": []
}
```

The page copies it into each listed platform, after the sibling named in `after` (or at the end when `after` is omitted). A top-level entry without `appliesTo` is a normal platform tab.

## Library entry

```json
{
  "name": "Angular",
  "description": "Platform for building mobile and desktop web applications",
  "link": "https://angular.io/",
  "version": "21.2.20"
}
```

- `name` and `version` are required.
- One sentence for `description`; official site for `link`.
- Names must be unique within a node and must not contain `::`.
- Match the version style of neighbouring entries.

## Placement guide

| Library is…                                                         | Goes in                                     |
| ------------------------------------------------------------------- | ------------------------------------------- |
| a UI framework or front-end library shipped in the generated app    | Frontend/UI (Angular or React node for Web) |
| a Java library in the generated backend                             | Backend (shared)                            |
| a tool the developer needs to build or run the app locally (mobile) | Mobile › Developer setup                    |
| a runtime or server the app is deployed on                          | Web › Deployment (per framework)            |

A library genuinely needed in more than one node is listed in each.

Mobile › Developer setup is ordered by concern: base runtimes (Node.js, npm, JDK, Maven), the WaveMaker CLI, Android tooling (Android Studio, SDK Build Tools, Gradle plugin), then iOS (Xcode). Keep new entries in the matching group.
