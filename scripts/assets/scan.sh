#!/usr/bin/env bash
# Finds the assets a workflow run has to look at. Both the decode job (to know what to optimize) and
# the publish job (to know which files an artifact may touch) run this, so they always agree.
#
# Run it inside the PR checkout, from the trusted copy of the scripts:
#   bash ../trusted/scripts/assets/scan.sh
#
# Environment:
#   BASE_REF           base branch of the PR
#   OPTIMIZE           "true" when this run may optimize
#   FORCE, FORCE_ONLY  "/optimize-assets force [names]": "true" and a JSON array of names
#   GITHUB_REPOSITORY, RUNNER_TEMP, GITHUB_OUTPUT  as provided by GitHub Actions
#   SCRIPTS_DIR        optional, default ../trusted/scripts/assets
#   PENDING_REPORT     optional, default $RUNNER_TEMP/pending.json (see pending.mjs)
# Step outputs: opt_base, optimize, and pending, covered, retried (written by pending.mjs).
set -euo pipefail

SCRIPTS_DIR="${SCRIPTS_DIR:-../trusted/scripts/assets}"
PENDING_REPORT="${PENDING_REPORT:-$RUNNER_TEMP/pending.json}"
FORCE="${FORCE:-false}"
FORCE_ONLY="${FORCE_ONLY:-[]}"

git fetch --no-tags --filter=blob:none "https://github.com/${GITHUB_REPOSITORY}.git" \
  "+refs/heads/${BASE_REF}:refs/remotes/upstream/${BASE_REF}"

# Only optimize changes since the bot's last optimization commit, so already-optimized files aren't
# re-encoded on every push (this also makes the bot's own push a no-op).
BOT_COMMIT=$(git log -1 --format=%H -F --grep='[asset-bot]' "upstream/${BASE_REF}..HEAD")
OPT_BASE="${BOT_COMMIT:-upstream/${BASE_REF}}"

# A forced run looks at every changed asset of the PR (not only what came after the bot's last
# commit) and ignores the hook's trailers; FORCE_ONLY can narrow it to named files.
SCAN_ARGS=(--trailers-from "upstream/${BASE_REF}")
if [ "$FORCE" = "true" ]; then
  OPT_BASE="upstream/${BASE_REF}"
  SCAN_ARGS=(--force --only-json "$FORCE_ONLY")
fi
echo "opt_base=${OPT_BASE}" >> "$GITHUB_OUTPUT"

# Skip assets the contributor's pre-commit hook already optimized or reviewed. The hook records that
# in commit-message trailers, each tied to the file's exact content (blob id), so a changed or
# unlisted file is still optimized. The trailers are untrusted PR input: they are parsed in Node by
# the trusted script and only yield numbers and file names here.
# If the scan itself fails, assume there is work: the optimizer then runs, and its own failure shows
# up in the PR comment instead of optimization silently turning off.
PENDING=1
if node "$SCRIPTS_DIR/pending.mjs" --base "$OPT_BASE" "${SCAN_ARGS[@]}" --report "$PENDING_REPORT"; then
  PENDING=$(node -p "require(process.argv[1]).pending" "$PENDING_REPORT")
fi
if [ "${OPTIMIZE:-false}" = "true" ] && [ "$PENDING" -gt 0 ]; then
  echo "optimize=true" >> "$GITHUB_OUTPUT"
else
  echo "optimize=false" >> "$GITHUB_OUTPUT"
fi
