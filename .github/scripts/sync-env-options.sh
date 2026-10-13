#!/usr/bin/env bash
# Regenerates the `environment` and `branch` dropdowns in ALL-IN-ONE-CICD.yaml from
# .github/ALL-IN-ONE-CICD.environments.json. GitHub reads choice options only from the
# workflow file, so run this after editing the JSON and commit both files.
#
#   .github/scripts/sync-env-options.sh          # rewrite the options
#   .github/scripts/sync-env-options.sh --check  # fail if they are out of date
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
CONFIG="$ROOT/.github/ALL-IN-ONE-CICD.environments.json"
WORKFLOW="$ROOT/.github/workflows/ALL-IN-ONE-CICD.yaml"
# Replaces the lines between "# BEGIN <name>" and "# END <name>" with $2
replace_block() {
  BLOCK="$2" awk -v begin="# BEGIN $1" -v end="# END $1" '
    index($0, begin) { print; if (ENVIRON["BLOCK"] != "") print ENVIRON["BLOCK"]; skip = 1; next }
    index($0, end)   { skip = 0 }
    !skip            { print }
  '
}

ENV_OPTIONS=$(jq -er '.environments | to_entries[] | "          - \"\(.key) | Tag: \(.value.tag) | \(.value.description)\""' "$CONFIG")
BRANCH_OPTIONS=$(jq -er '.branches[] | "          - \"\(.)\""' "$CONFIG")

UPDATED=$(replace_block env-options "$ENV_OPTIONS" < "$WORKFLOW" | replace_block branch-options "$BRANCH_OPTIONS")

if [ "${1:-}" = "--check" ]; then
  if [ "$UPDATED" != "$(cat "$WORKFLOW")" ]; then
    echo "Dropdown options are out of date. Run: .github/scripts/sync-env-options.sh" >&2
    exit 1
  fi
  echo "Dropdown options are in sync."
else
  printf '%s\n' "$UPDATED" > "$WORKFLOW"
  echo "Updated dropdown options in ${WORKFLOW#$ROOT/}"
fi
