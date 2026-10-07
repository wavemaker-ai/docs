---
name: wm-ai-release-notes-draft
description: >
  Use this skill when drafting a whole release notes file from a source list of shipped work — a CSV or
  XLSX export of Jira tickets, a GitLab branch-compare HTML report, or a block of notes pasted by a
  developer. Activate when the user hands over a sheet or report and asks to turn it into release notes,
  fill in a version's notes, or process a release's tickets in bulk. For adding or editing one entry at a
  time in an existing file, use `wm-ai-release-notes` instead.
license: MIT
metadata:
  version: 0.1.0
  surface: docs/release-notes
  docusaurus: ^3.9.0
---

# Drafting Release Notes From a Source Sheet

Turn a list of shipped tickets into a complete draft of a versioned release notes file. The source is written by and for engineers and QA — your job is to decide what customers should be told, and say it in their language.

This skill covers **triage, enrichment, and reporting**. It does not restate entry format. Titles, bodies, pills, links, tabs, accordians, and the release overview line are defined in `../wm-ai-release-notes/references/conventions.md` — read it before writing entries.

## When to use

- The user provides a sheet, report, or pasted list covering a release and wants the notes drafted.
- The user wants a source list triaged into Features / Enhancements / Bug Fixes.
- The user wants to know what in a source list is worth announcing at all.

## When NOT to use

- Adding or editing one entry in an existing file → use `wm-ai-release-notes`.
- A public-facing post celebrating a feature → use `wm-ai-feature-announcements`.

## Relationship to `wm-ai-release-notes`

That skill confirms every entry with the user before writing. **Bulk drafting replaces per-entry confirmation** — otherwise a 50-ticket sheet becomes 50 round trips. Confirm these two things up front instead, then write the whole draft and report:

1. **Target file and version** — resolve the path and say which file you will write.
2. **Whether to enrich from Jira** — the user has answered both ways on different releases. Ask; do not assume.

Everything else is reported after the draft is written, not asked before.

## Procedure

### Step 1 — Parse the source

Read the sheet into a ticket list: id, title, description, and any repo or branch column. See `references/source-formats.md` for CSV, XLSX, GitLab-HTML, and pasted-notes recipes.

**Always de-duplicate by ticket id.** These sheets repeat rows — one 60-row export covered 49 unique tickets. Report both counts.

### Step 2 — Follow the sources

**Every reference in the sheet is a lead, and every lead gets followed or raised. Never silently skip one.**

A ticket's real content is often not in the sheet. It sits behind a link. An entry written without opening that link is a guess dressed as a finding.

This applies to **any** outbound reference, whatever the host. Jira, Basecamp, GitLab, GitHub, and Jenkins are the common ones, but the rule is not a list of approved platforms — a wiki page, a dashboard, a spreadsheet, a recording, or a one-off internal URL all count. If a ticket points somewhere, go there.

#### Jira

Fetch every ticket by key and pull `summary`, `description`, `issuetype`, `status`, `resolution`, and `fixVersions`. The recipe, including the large-output workaround, is in `references/source-formats.md`.

Jira earns its keep in three ways:

- **Umbrella tickets.** A ticket whose description is just links to other tickets is unwritable as-is. Fetch the linked ids and you get the real list.
- **`issuetype`.** A Jira `Improvement` is an Enhancement; a `Bug` is a Bug Fix. Use it to check your own classification.
- **`fixVersions`.** Evidence about which release an item belongs to — see Step 3.

#### Everything else a ticket points to

Open it if any connector or fetch tool can reach it, whatever the platform. A ticket whose entire description is a link is the strongest signal that the link holds the content.

#### When you cannot resolve a reference

Four cases, one rule — **ask the user, and say exactly what you could not reach.**

| Situation                                     | What to do                                                                                                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No connector, or it needs authorizing         | Name the platform and ask the user to authorize it. OAuth cannot run in a non-interactive session. Offer to continue meanwhile, with the affected entries flagged |
| The link is dead, private, or returns nothing | Say which ticket and which link, and ask how they want it handled                                                                                                 |
| Only an id, no URL (`WMS-12345`, `#4821`)     | Ask for the base URL or project rather than guessing a host                                                                                                       |
| Opened it and it is still unclear             | Say what you read and what remains ambiguous. Ask rather than inventing a plausible reading                                                                       |

Never let an unreachable reference quietly become an exclusion or a confident-sounding sentence. Carry it into the report under **Unchecked sources**.

### Step 3 — Check `fixVersions` against the target release

`fixVersions` is **evidence, not a verdict**. Sheet filenames are often wrong, and the user may deliberately place items elsewhere — for one release they chose to put everything not-yet-documented into the open version regardless of what Jira said.

So: compare, and if a material number of tickets disagree with the target release, **report the mismatch and let the user decide placement.** Never silently re-target.

### Step 4 — Check what is already published

Read the other release notes files in the same version series. Source reports routinely include work already announced — a cherry-picked fix appears in two branches, or a feature's first commit lands one release before its polish.

If an item is already documented in an earlier file, do not announce it again. Report it as already covered.

### Step 5 — Triage

Apply `references/triage-rules.md`. In order:

1. **Drop** what no customer can observe.
2. **Merge** tickets describing one defect, and umbrella tickets into one entry with sub-bullets.
3. **Split** a ticket that contains both a fix and an enhancement.
4. **Classify** into tab and accordian.

### Step 6 — Write entries

Rewrite each kept item in customer language per `references/triage-rules.md`, then format it per `conventions.md`.

Write the release overview line **last**, from the entries that ended up in the file.

### Step 7 — Validate

AGENTS.md makes this a hard gate:

```bash
npm run lint
npm run build
```

Both must pass. Run the build in the background; it is slow.

### Step 8 — Report

See **Reporting** below. Do not skip it — it is the part the user actually reviews.

## Repo to accordian mapping

For GitLab compare reports spanning repos:

| Repo                       | Accordian                                                                | Pill     |
| -------------------------- | ------------------------------------------------------------------------ | -------- |
| `wavemaker-react-codegen`  | User Interface                                                           | web      |
| `wavemaker-react-runtime`  | User Interface                                                           | web      |
| `wavemaker-foundation-css` | User Interface                                                           | per item |
| `wavemaker-ng-studio`      | Platform, except canvas / visual-editor / theming items → User Interface | per item |
| `projects-hub`             | Platform                                                                 | none     |
| `wm-agent-server`          | Platform                                                                 | none     |

## Reporting

The user's standing instruction is **do not skip anything without telling them.** Every source row ends up in exactly one bucket, and the report accounts for all of them:

- **Added** — counts per tab and accordian.
- **Excluded** — every dropped ticket with its reason. List them individually; a total is not enough.
- **Already covered** — items found in an earlier release file, naming that file.
- **Merged or split** — which tickets were combined or divided, and why.
- **Low confidence** — entries where the ticket was too vague to be sure. Say plainly that the wording is your best reading, not established fact.
- **Unchecked sources** — every link or reference you could not open, with the ticket it belongs to and why it failed. This is the bucket that is easiest to drop and most damaging to drop, because a skipped link looks identical to a ticket that had nothing behind it.
- **Open gaps** — a new capability with no doc to link, an unresolved placeholder, a missing pill you could not determine.

## Common mistakes to avoid

- **Trusting the sheet's filename for the version.** Check `fixVersions`, and ask.
- **Per-entry confirmation on a bulk draft.** Confirm the file and the Jira question, then draft.
- **Announcing something twice.** Check earlier files in the series first.
- **Keeping QA phrasing.** See the de-jargon test in `references/triage-rules.md`.
- **Skipping a link you could not open.** Follow every reference, or raise it. An unreachable link is never a silent exclusion.
- **Guessing a host from a bare id.** Ask for the base URL instead.
- **Inventing a cause.** State only what the ticket states.
- **Inventing a doc link.** Grep `docs/` first; if nothing covers it, add no link and report the gap.
- **Counts in the overview line.** They go stale on the next edit.
- **Naming a customer or their app.** This repo is public.

## Reference files

- Triage, exclusion, and rewriting rules: `references/triage-rules.md`
- Parsing and Jira recipes: `references/source-formats.md`
- Entry format and style: `../wm-ai-release-notes/references/conventions.md`
