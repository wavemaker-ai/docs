---
name: wm-ai-release-notes-review
description: >
  Use this skill when evaluating a WaveMaker AI release notes file against what actually shipped.
  Activate when the user asks to review, check, audit, verify, or evaluate a release's notes, asks whether
  the notes cover everything in the release, or wants the notes compared with the Jira items for a version.
  It gathers the release's items from Jira (plus a sheet, Basecamp, and any other info the user provides),
  reconciles them with the written entries, and reports gaps, inaccuracies, and style problems. It does not
  write the release notes. For adding or editing one entry at a time, use `wm-ai-release-notes` instead.
license: MIT
metadata:
  version: 0.2.0
  surface: docs/release-notes
  docusaurus: ^3.9.0
---

# Reviewing Release Notes Against the Release

The writer writes the release notes by hand. This skill checks that work: it collects what shipped, reads what was written, and reports where the two disagree.

The source material is written by and for engineers and QA. The notes are written for customers. Part of the job is judging whether each translation is faithful, and whether each omission is justified.

This skill covers **gathering, reconciliation, and reporting**. It does not restate entry format. Titles, bodies, pills, links, tabs, accordians, and the release overview line are defined in `../wm-ai-release-notes/references/conventions.md` — read it before judging any entry.

## When to use

- The user has written (or partly written) a release notes file and wants it checked against the release.
- The user asks whether the notes miss anything that shipped.
- The user asks whether an entry is accurate, correctly placed, or worth announcing.

## When NOT to use

- The file has no real entries yet (only template `{/* Content */}` placeholders). This skill no longer drafts — tell the user, and offer `wm-ai-release-notes` to add entries one at a time.
- Adding or editing one entry in an existing file → use `wm-ai-release-notes`.
- A public-facing post celebrating a feature → use `wm-ai-feature-announcements`.

## Read-only by default

The writer owns the file. **Do not edit it during the review.** Produce the report, then offer fixes. Apply a fix only when the user accepts that specific one, and keep each edit minimal. A finding is a question put to the writer, not an order — the writer may know something Jira does not.

## Inputs

Collect these up front. Ask for what is missing in one message rather than one question at a time.

| Input                        | Required | Notes                                                                                                                                                                      |
| ---------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target release notes file    | Yes      | Resolve the path, say which file you will review, and confirm. Default to the highest version under `docs/release-notes/`                                                  |
| Jira version name            | Yes      | The **exact** `fixVersion` name. Names are not uniform (`12.1.1-GA`, `12.0.0`, `11.7.5.3`), so never derive it from the file's version. See `references/source-formats.md` |
| Jira projects                | Yes      | Do not assume `WMS` is the only project that ships in the release. Ask                                                                                                     |
| A sheet                      | No       | CSV, XLSX, or GitLab branch-compare HTML. If given, it is a second source and is reconciled with Jira in both directions                                                   |
| Basecamp or other background | No       | Links, pasted notes, or explanations from the user. Treated as evidence, same as everything else                                                                           |

Jira is the primary source, so check access before anything else. See **Jira access** below.

## Jira access

The review needs the Atlassian (Jira) connector, and it needs **read access only**.

**Before gathering anything, confirm the connector works.** Make one cheap read call (for example a `searchJiraIssuesUsingJql` count query). If the call fails because the connector is missing, not authenticated, or the authorization expired, **stop and ask the user to authenticate it with read-only permissions.** Do not carry on from the sheet alone, and do not skip Jira quietly.

Tell the user, in these terms:

- Which connector needs authenticating: the Atlassian connector (Jira).
- To authorize it in their Claude connector settings (claude.ai connectors), or with `/mcp` in an interactive Claude Code session. A non-interactive session cannot run the OAuth flow, so the user has to do this themselves.
- To grant **read-only** access, meaning view and read permissions only. The review never creates, edits, transitions, or comments on a Jira issue, so it needs nothing more. If the consent screen offers write scopes, decline them.
- That you will continue once the connector is authenticated.

Never ask the user for tokens, authorization codes, or callback URLs.

**Read-only in practice.** Use only the search and get tools (`searchJiraIssuesUsingJql`, `getJiraIssue`, and the read tools for Confluence pages). Never call a Jira write tool, even if the connector happens to grant it.

**Only if the user explicitly declines to authenticate**, proceed from the sheet and pasted info alone. The report must then open by saying Jira coverage was not checked, so the Missing bucket is limited to what the sheet shows and may be incomplete.

## Procedure

### Step 1 — Gather what shipped

**Jira.** Fetch every item in the version, paginating until none remain. Pull `summary`, `description`, `issuetype`, `status`, `resolution`, `fixVersions`, and `components`. The recipe, including the zero-result trap and the oversized-output workaround, is in `references/source-formats.md`.

**Sheet, if given.** Parse and de-duplicate by ticket id; report both counts (rows and unique tickets). See `references/source-formats.md`.

**Reconcile the sources with each other.** Build one list of tickets, each tagged with where it was seen:

- In Jira and the sheet.
- In Jira only. The sheet may be stale, or the item may belong to another release.
- In the sheet only. The ticket may carry no `fixVersion`, or the wrong one.

Report the second and third groups. Never silently merge them or drop either.

### Step 2 — Follow the sources

**Every reference in a ticket is a lead, and every lead gets followed or raised. Never silently skip one.**

A ticket's real content is often not in its description. It sits behind a link. Judging an entry against a ticket you only half read is a guess dressed as a finding.

This applies to **any** outbound reference, whatever the host. Jira, Basecamp, GitLab, GitHub, and Jenkins are the common ones, but the rule is not a list of approved platforms — a wiki page, a dashboard, a spreadsheet, a recording, or a one-off internal URL all count. If a ticket points somewhere, go there. A ticket whose entire description is a link is the strongest signal that the link holds the content.

Jira earns its keep in three ways here:

- **Umbrella tickets.** A ticket whose description is just links to other tickets is unreadable as-is. Fetch the linked ids to see what the entry should cover.
- **`issuetype`.** A Jira `Improvement` is an Enhancement; a `Bug` is a Bug Fix. Use it to check the writer's tab.
- **`status` and `resolution`.** A ticket that is not Done, or is resolved Won't Do or Duplicate, should not back an entry.

#### When you cannot resolve a reference

Four cases, one rule — **ask the user, and say exactly what you could not reach.**

| Situation                                     | What to do                                                                                                                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No connector, or it needs authorizing         | Name the platform and ask the user to authenticate it with read-only permissions (see **Jira access**). Continue without it only if they decline, with the affected items flagged |
| The link is dead, private, or returns nothing | Say which ticket and which link, and ask how they want it handled                                                                                                                 |
| Only an id, no URL (`WMS-12345`, `#4821`)     | Ask for the base URL or project rather than guessing a host                                                                                                                       |
| Opened it and it is still unclear             | Say what you read and what remains ambiguous. Ask rather than inventing a plausible reading                                                                                       |

Never let an unreachable reference quietly become a pass on an entry. Carry it into the report under **Unchecked sources**.

### Step 3 — Read the written notes

Read the target file in full. List every entry with its line number, tab, accordian, title, pills, body, and link. Also read the overview line, the release date, and any sub-bullets.

Read the other files in the same version series. They are needed for the duplicate check in Step 5.

### Step 4 — Match entries to tickets

Entries carry no ticket ids, so matching is a judgement. Do it in both directions.

**Jira → file.** Every ticket from Step 1 lands in exactly one bucket:

1. **Covered** — an entry describes it. Note which entry.
2. **Justifiably omitted** — it meets an exclusion rule in `references/triage-rules.md`. Cite the rule. Omission is the writer's call, so do not flag it unless the item is customer-observable.
3. **Already published** — an earlier file in the series announces it. Name that file.
4. **Missing** — customer-observable, not covered, not already published. This is the main finding.
5. **Not shipped** — status or resolution says it did not ship, and no entry should exist.

**File → Jira.** Every entry is backed by a ticket, a sheet row, or information the user gave. An entry with **no backing** is flagged, not judged wrong — the writer may know something the sources do not. Ask which ticket it came from.

For each match, record how sure you are. A title that echoes the ticket summary is a firm match. A guess from a vague phrase is not. **Send ambiguous matches to the user** rather than picking one. If the writer can name the ticket id for an entry, that settles it.

A merged entry (one entry covering several tickets) and a split ticket (one ticket covered by two entries) are both fine when the writer's reasoning holds — see Merge and Split in `references/triage-rules.md`.

### Step 5 — Evaluate each matched entry

For every entry that has a backing ticket, check:

- **Accuracy.** Does the entry claim anything the ticket does not say? A stated cause, a setting name, a version number, a scope ("all apps") the ticket never gave. State only what the sources state.
- **Completeness of the translation.** Does it drop a meaningful part of the ticket — one of several sub-fixes in an umbrella, or the "in React apps" qualifier when the ticket is about Angular and React parity?
- **Placement.** Is the tab right for the `issuetype` and the actual change? Is the accordian right for the area? Are the pills right? See the repo to accordian mapping below.
- **Customer language.** Apply the de-jargon test in `references/triage-rules.md`. A reader who has never seen the test app must be able to tell what is meant.
- **Customer names.** This repo is public. A customer name, project codename, or their app's screen names must not appear.
- **Duplicates.** Is it already announced in an earlier file in the series, or near-identical to an existing title?

### Step 6 — Check the file mechanically

These checks need no source material. Use the validation checklist in `../wm-ai-release-notes/SKILL.md` as the list.

- Overview line: replaced, the version is its subject, one sentence, no counts, no "WaveMaker announces".
- Release date: present, `DD Month YYYY`.
- Each title is a `###` heading of 4–7 words, no trailing punctuation.
- Each body is one sentence, active voice, present tense, no marketing language.
- Relative links: no `.md` or `.mdx` extension, and the target exists. Grep `docs/` to verify.
- No placeholder links (`#`, "link to be added").
- The tab and accordian set is unchanged. Empty tabs use the self-closing `<TabItem name="..." />` form.
- No leftover `{/* Content */}` in an accordian that has entries, and none of the template's `Overview\...`.
- A new capability with no doc to link is an **open gap**, not an error. Say so.

Then run the gate from AGENTS.md. Both are read-only checks of the writer's file:

```bash
npm run lint
npm run build
```

Run the build in the background; it is slow. Report both results exactly. A failure is a finding — quote the error.

### Step 7 — Check `fixVersions` against the target release

`fixVersions` is **evidence, not a verdict**. Jira's `released` flag and the version name alone do not prove placement — a version can show as unreleased while its notes are already published. The writer may also deliberately place items in a different release than Jira says.

Compare, and if a material number of tickets disagree with the target release, **report the mismatch and let the user decide.** Never conclude an entry is misplaced from `fixVersions` alone.

### Step 8 — Report

See **Reporting** below. It is the deliverable. Lead with the verdict, then the findings.

## Repo to accordian mapping

For sheets or GitLab compare reports that name repos, use this to check placement:

| Repo                       | Accordian                                                                | Pill     |
| -------------------------- | ------------------------------------------------------------------------ | -------- |
| `wavemaker-react-codegen`  | User Interface                                                           | web      |
| `wavemaker-react-runtime`  | User Interface                                                           | web      |
| `wavemaker-foundation-css` | User Interface                                                           | per item |
| `wavemaker-ng-studio`      | Platform, except canvas / visual-editor / theming items → User Interface | per item |
| `projects-hub`             | Platform                                                                 | none     |
| `wm-agent-server`          | Platform                                                                 | none     |

## Reporting

The user's standing instruction is **do not skip anything without telling them.** Every Jira ticket and every sheet row ends up in exactly one bucket, and the report accounts for all of them.

Start with a short verdict: how many tickets were checked, how many entries were reviewed, and how many findings need action. Then, in this order:

1. **Missing** — customer-observable tickets with no entry. List each by key and summary, with a suggested tab, accordian, and one-line description of what a customer would notice.
2. **Inaccurate or unsupported** — entries that claim more than the ticket says, or contradict it. Quote the entry and the ticket's actual words.
3. **No backing** — entries matched to no ticket or sheet row. Ask where they came from.
4. **Misplaced** — wrong tab, accordian, or pill. Say what it should be and why.
5. **Not shipped** — entries backed only by tickets that are not Done or were resolved Won't Do or Duplicate.
6. **Already published** — entries or tickets found in an earlier release file, naming that file.
7. **Wording and conventions** — de-jargon, multi-sentence bodies, title length, customer names, link problems, overview and date.
8. **Justifiably omitted** — every ticket left out under an exclusion rule, each with its rule. List them individually; a total is not enough.
9. **Low-confidence matches** — where you could not tell which ticket an entry came from, or which entry covers a ticket. Say plainly that it is your reading.
10. **Unchecked sources** — every link or reference you could not open, with the ticket it belongs to and why it failed. This bucket is the easiest to drop and the most damaging to drop, because a skipped link looks identical to a ticket that had nothing behind it.
11. **Source mismatches** — Jira-only and sheet-only tickets, `fixVersion` disagreements, and sheet row versus unique ticket counts.
12. **Open gaps** — a new capability with no doc to link, a missing pill you could not determine.
13. **Gate results** — `npm run lint` and `npm run build`, pass or fail, with the error if any.

Every finding cites the entry's `file:line` and the ticket key. Say which findings are firm and which are your reading. Omit a bucket that is empty, but say that it is empty rather than leaving the reader to wonder.

End by offering to apply the fixes the user accepts. Do not apply any before they answer.

## Common mistakes to avoid

- **Editing the file during the review.** Report first. The writer owns the text.
- **Rewriting the notes.** This skill evaluates. It suggests a fix for a finding, not a new draft.
- **Carrying on without Jira when the connector is not authenticated.** Stop and ask the user to authenticate it with read-only permissions. Go on without Jira only if they decline.
- **Writing to Jira.** The review is read-only. Never edit, transition, or comment on an issue.
- **Deriving the Jira version name from the file.** Ask for the exact name. Zero results means the name is wrong or the version is empty — never conclude "nothing shipped".
- **Assuming one Jira project.** Ask which projects ship in the release.
- **Treating a missing entry as an error when it is excluded.** Check the exclusion rules first, and cite the rule.
- **Treating an unbacked entry as wrong.** Ask where it came from.
- **Picking an ambiguous match.** Ask the user, or ask for the ticket id.
- **Trusting `fixVersions` or `released` as proof of placement.** It is evidence only.
- **Skipping a link you could not open.** Follow every reference, or raise it. An unreachable link is never a silent pass.
- **Guessing a host from a bare id.** Ask for the base URL instead.
- **Passing an entry without reading its ticket.** The summary alone is not enough when the description is a link.
- **Counts in the overview line.** They go stale on the next edit.
- **Naming a customer or their app.** This repo is public.

## Reference files

- Exclusion, merge, split, and wording rules: `references/triage-rules.md`
- Jira, sheet, and parsing recipes: `references/source-formats.md`
- Entry format and style: `../wm-ai-release-notes/references/conventions.md`
