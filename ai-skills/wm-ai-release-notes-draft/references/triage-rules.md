# Triage Rules

How to decide what from a source sheet becomes an entry, and how to word it.

## The filter: can a customer observe it?

Keep an item if it maps to something the user **clicks, sees, or gets** — a screen, a control, a message, a generated app's behaviour, a build that now succeeds or runs faster.

Drop it if the only thing that changed is an **event field, an API parameter, an internal detector, a tool's error wording, or a framework refactor**.

These were cut from a shipped release by the writer, and are the calibration for "too internal":

| Cut                                                        | Why                  |
| ---------------------------------------------------------- | -------------------- |
| Per-request LLM model override on a WebSocket run API      | API parameter        |
| Correlating ids added to a start/complete event pair       | Event field          |
| Compaction trigger counting system prompt and tool schemas | Internal measurement |
| Reworded error message suggesting an alternate tool        | Tool message         |
| Internal summarization text leaking into a task's output   | Internal plumbing    |

### Try rewriting before dropping

An item can sound internal and still have a surface the user touches. In the same release, a ticket about migrating draft base tracking from tags to marker commits was **not** dropped — it was rewritten in terms of the buttons involved:

> Restore and Edit for earlier conversation states remain available even after Reject All or Sync Studio Changes.

So before dropping: ask what the user would notice. If there is a button, label, list, or screen involved, name it and keep the entry. Drop only when there is genuinely no surface.

## Always exclude

These never produce an entry. List each one in the report with its reason.

| Category               | Examples                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| Merge commits          | `Merge branch 'x' into y`, and tickets literally titled as a dummy JIRA for merge purposes            |
| CI and pipeline config | Fixing a release job trigger, build routing between internal services                                 |
| Build tooling          | Lockfiles, lint config, dependency-group restructuring of internal services                           |
| Auto-generated commits | `Auto commited migration changes by Studio`                                                           |
| Internal repo hygiene  | Merging test repos, moving temp files to a gitignored folder, deleting tracking files                 |
| Test-only work         | Unit test coverage, adding or updating test cases                                                     |
| Internal observability | Tracing span names, log nesting, telemetry plumbing                                                   |
| Reverted work          | A fix and its own revert in the same release net to zero — exclude both                               |
| WIP or debug commits   | `login issue check 1`                                                                                 |
| Vague security bumps   | `Vulnerabilities resolved` with no stated impact. A named CVE that blocked installs **is** includable |

### Never name a customer or their app

This repo is public. Customer names, project codenames, and their application's screen names must not appear in an entry, a title, or an example — even when the ticket is full of them.

## Merge

**Same defect, different tickets.** QA often files the same bug from several screens. If the underlying defect is one thing, write one entry. Two separate tickets about a select-all control failing became a single entry.

**Umbrella plus children.** A parent ticket whose description is a list of links becomes one entry with sub-bullets — one per child. Fetch the children to get their names; do not write "various fixes".

**One capability split across repos.** A codegen change and its runtime counterpart under one ticket are one entry.

## Split

If a ticket contains **both a fix and an improvement**, it becomes two entries. A ticket about preview builds failing with out-of-memory errors because dependencies reinstalled on every build carried both:

- **Bug Fix** — builds intermittently failing with out-of-memory errors.
- **Enhancement** — unchanged builds now skip dependency installation, cutting build time substantially.

The test: would a customer who never hit the bug still care? If yes, the improvement deserves its own entry.

## Classify

| Tab          | Rule                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| Features     | A capability that did not exist                                            |
| Enhancements | An existing capability got better. A Jira `Improvement` usually lands here |
| Bug Fixes    | Something was broken and now works                                         |

Accordian definitions and pill rules are in `../../wm-ai-release-notes/references/conventions.md`.

## Rewriting QA tickets

QA tickets are written from inside a test application. They name screens, dialogs, tabs, and record types that mean nothing to a customer. Translate each into the **platform-level defect a WaveMaker developer would recognise**.

### The test

> Could a reader who has never seen the test app tell which tab, dialog, message, or page is meant?

The failure mode is a definite article pointing at app-specific UI. "The create, clone, and view tabs", "the advanced search dialog", "the no-results message" all fail it — they sound generic but refer to one app's screens. Name the widget or behaviour instead, or describe the shape generically ("a dynamically added tab").

The writer's own critique of an early draft:

> "Status column color missing on page 2" — where, what is page 2? Does this make sense in a release note?

The real defect was a table column's conditional background colour not being re-applied after paging. That is the entry.

### State only the causes the ticket gives

QA tickets report symptoms. If the ticket does not say why, describe the symptom and stop. Writing "because the handler was not registered" when the ticket never says so is inventing a root cause.

### Keep error strings

If a ticket quotes an error, keep it in the body. It is what someone hitting the bug will search for. `Required field(s) missing` and `Indexed property setter is not supported` both survived review for this reason.

### Say "in React apps" when parity is the point

Many tickets exist because behaviour differs between the Angular and React outputs — the ticket says so, or says it works fine in Angular. Without that qualifier, Angular users think the bug affected them too.

### Do not invent mechanisms

No filenames, settings, config keys, or version numbers that the ticket does not give. If a ticket says a package version was flagged for a CVE, do not name the version it moved to.

## Low confidence

Some tickets are too garbled to translate with certainty, and Jira adds nothing. Write the most defensible reading, then **flag it in the report** as your reading rather than established fact, so the writer can correct it. Do not quietly present a guess as a finding.
