# Source Formats and Recipes

Gathering what shipped: Jira first, then the optional sheet and background. Reconcile them with each other before comparing to the notes.

Write intermediate files to the session scratchpad, never into the repo.

## XLSX

`openpyxl` is available; `pandas` is not.

```python
import openpyxl
wb = openpyxl.load_workbook('<path>.xlsx', data_only=True)
ws = wb[wb.sheetnames[0]]
rows = list(ws.iter_rows(values_only=True))
header, body = rows[0], rows[1:]
```

Columns are typically: `S.No`, `Jira ID`, `Title`, `Description`, `Developer (Assignee)`, `Jira Link`.

Dumping every row at once can blow the context budget. Probe the shape first, then pull the columns you need.

## CSV

Standard CSV with quoted multi-line descriptions. Use `csv.DictReader`, not line splitting — descriptions contain commas, newlines, and code blocks.

## GitLab branch-compare HTML

Reports titled "Listing Differences Between Branches". Structure:

- An `h4` per repo, each followed by a table of commits.
- Columns: `S.NO`, `Commit Message`, `WMS ID(s)`, `Title`, `Description`, `Author`, `URL`, `Date & Time`, `Branch`.
- A "Nothing to compare in:" list naming repos with no changes — that is a real finding, not an omission.

Notes specific to this format:

- The `Title` and `Description` columns are the **Jira** title and description, so several commits repeat the same text. Group by ticket id, not by row.
- The `Branch` column can name a different release branch than the report's own comparison, usually a cherry-pick. Treat it as a hint to check whether the item is already published.
- One ticket commonly spans several repos.

## Pasted notes and other background

The user may paste prose from a developer, a Basecamp thread, or a chat. Treat it as evidence about what shipped, not as a verdict. When it groups items into Features / Improvements / Bug Fixes, the grouping is a proposal. Their "Improvements" usually map to Enhancements.

Check for an item appearing as both a feature and a bug fix — adding a capability and fixing that same capability within one release is churn. Raise the duplicate with the user rather than choosing one.

## De-duplicating

Source sheets repeat rows. Always collapse by ticket id and report both numbers:

```python
seen, unique = set(), []
for r in body:
    tid = r[1]
    if tid in seen:
        continue
    seen.add(tid)
    unique.append(r)
print(len(body), "rows ->", len(unique), "tickets")
```

## Jira

Jira is the primary source for a release's items. Query by `fixVersion`.

```yaml
searchJiraIssuesUsingJql
  cloudId: wavemaker.atlassian.net
  jql: project = WMS AND fixVersion = "<exact version name>"
  fields: ["summary","description","status","issuetype","resolution","fixVersions","components"]
  maxResults: 100
  responseContentFormat: markdown
```

Ask the user which projects ship in the release and cover each with `project in (...)`; do not assume `WMS` alone.

### Find the exact version name

`fixVersion` names are not uniform. Real ones include `12.1.1-GA`, `12.0.0`, and `11.7.5.3`. Querying `fixVersion = "12.1.2"` returns nothing if the version is actually named `12.1.2-GA`.

**A result of zero is ambiguous.** Either the name is wrong or the version has no items yet. Never conclude that nothing shipped. Ask the user for the exact name. To help, sample recent names:

```yaml
searchJiraIssuesUsingJql
  cloudId: wavemaker.atlassian.net
  jql: project = WMS AND fixVersion is not EMPTY ORDER BY updated DESC
  fields: ["fixVersions"]
  maxResults: 50
```

Read the distinct `fixVersions[].name` values from the result and offer the closest ones.

### Paginate

`maxResults` caps at 100. When the response has `pageInfo.hasNextPage`, pass `pageInfo.endCursor` back as `nextPageToken` and repeat until it is false. Compare the total you collected against a `searchResultMode: count` query for the same JQL, and report both.

### Do not treat Jira's flags as proof

- `released: false` on a version does not mean the notes are unpublished. `12.1.1-GA` shows `released: false` while its release notes are already live.
- `fixVersions` is evidence of intended placement, not a verdict. See Step 7 of `SKILL.md`.
- A ticket in the version that is not Done, or was resolved Won't Do or Duplicate, should not back an entry.

### Linked tickets

Umbrella tickets list their children by link. Fetch the children in a second query with `key in (WMS-1111,WMS-2222,...)` so the whole set is read.

### Handling the oversized result

The response exceeds the tool's token cap and is written to a file instead. Extract with `jq`, putting the filter in a file — escaping a quoted `join(", ")` inline fails under the shell:

```bash
cat > "$SP/extract.jq" << 'EOF'
.issues.nodes[] | "===== \(.key) =====\nSUMMARY: \(.fields.summary)\nTYPE: \(.fields.issuetype.name)\nSTATUS: \(.fields.status.name)\nRESOLUTION: \(.fields.resolution.name // "null")\nFIXVERSIONS: \([.fields.fixVersions[]?.name] | join(", "))\nDESCRIPTION:\n\(.fields.description // "null")\n"
EOF
jq -r -f "$SP/extract.jq" "$RESULT_FILE" > "$SP/jira.txt"
```

Then scan the one-line fields across all tickets before reading any full description:

```bash
grep -E "^=====|^SUMMARY:|^TYPE:|^FIXVERSIONS:" "$SP/jira.txt"
```

Read full descriptions only for the tickets that are ambiguous, or that you need in order to judge an entry's accuracy.

### When the connector is unauthorized

Confirm access with one cheap read call before gathering anything. If it fails because the Atlassian connector is missing, unauthenticated, or expired, stop and ask the user to authenticate it with **read-only** permissions, as described under **Jira access** in `SKILL.md`. OAuth cannot run in a non-interactive session, so the user has to authorize it in their connector settings (or `/mcp` in an interactive session). Never ask for tokens or authorization codes.

Use only read tools. Never call a Jira write tool.

Proceed from the sheet and pasted info alone only if the user explicitly declines. The report must then say that Jira coverage could not be checked.

## Links inside tickets

Ticket descriptions frequently carry the real content behind a link. Treat **every** outbound reference as a lead to follow, and report any you could not reach.

The table below is what turns up most often — it is **not** an allowlist. Anything a ticket points to counts, including internal URLs, dashboards, wikis, spreadsheets, and recordings on hosts not named here. If you do not recognise the host, still try it, and raise it if you cannot reach it.

| Source                                                       | Typically holds                                                           | Notes                                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Jira (`browse/WMS-nnnnn`)                                    | The ticket itself, or the children of an umbrella                         | Fetch with the connector; include linked ids in the same JQL query                            |
| Basecamp (`app.basecamp.com/.../todos/...`, `/messages/...`) | The entire specification for a feature whose Jira description is one line | A description that is *only* a Basecamp link means the ticket text is not the source of truth |
| GitLab / GitHub (merge request, PR, commit)                  | What actually changed, when the ticket is vague                           | Useful for deciding fix vs enhancement                                                        |
| Jenkins or any other CI                                      | Build and job history behind a build-related ticket                       |                                                                                               |
| Confluence or any wiki                                       | Specs and design docs                                                     |                                                                                               |
| Google Drive                                                 | Screen recordings and screenshots                                         | Often the only evidence for a QA ticket; usually not machine-readable                         |
| Figma                                                        | Design specs for a UI ticket                                              |                                                                                               |
| Anything else                                                | Whatever the author thought was worth linking                             | Same rule: open it, or raise it                                                               |

Two shapes to watch for in exported descriptions:

- Atlassian smart links appear as a `custom` element wrapping the URL rather than as plain markdown.
- Inline images appear as `blob:` URLs that resolve to nothing outside the browser session. An image-only description carries no text you can use — treat it as unreachable and say so.

### A bare id with no URL

A sheet or note may reference `WMS-12345`, `#4821`, or `PROJ-99` with no host. Do not guess the instance. Ask the user for the base URL or the project, then fetch.

### Still unclear after opening it

Opening a link does not guarantee an answer — a Drive recording, a screenshot-only ticket, or a thread that never states the outcome can all leave the behaviour ambiguous. Say what you read, say what is still missing, and ask. A plausible-sounding sentence built on an unresolved reference is the failure this rule exists to prevent.

## Checking what is already published

Before writing, pull the headings from the other files in the version series to catch both duplicate announcements and near-identical titles:

```bash
grep -h "^      - ###" docs/release-notes/<series>/*.mdx
```

Make a new title distinct from an existing one even when the underlying defects differ.

## Counting entries in the notes file

```bash
python3 -c "
c = open('<file>.mdx').read()
print('entries:', c.count('- ###'))
print('tabs:', c.count('<ReleaseNotesTabs>'), c.count('</ReleaseNotesTabs>'))
print('placeholders left:', c.count('{/* Content */}'))
"
```

A balanced-tag check will not catch leftover QA phrasing — a keyword scan only finds names you already thought of. Re-read each body against the de-jargon test in `triage-rules.md`.

Then run the `npm run lint` and `npm run build` gate from AGENTS.md and report the results. These are read-only checks of the writer's file.
