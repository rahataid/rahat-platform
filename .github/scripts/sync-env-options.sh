#!/usr/bin/env bash
# Regenerates the `environment` dropdown in ALL-IN-ONE-CICD.yaml from
# .github/ALL-IN-ONE-CICD.environments.json. GitHub reads choice options only from the
# workflow file, so run this after editing the JSON and commit both files.
#
#   .github/scripts/sync-env-options.sh          # rewrite the options
#   .github/scripts/sync-env-options.sh --check  # fail if they are out of date
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
CONFIG="$ROOT/.github/ALL-IN-ONE-CICD.environments.json"
WORKFLOW="$ROOT/.github/workflows/ALL-IN-ONE-CICD.yaml"
BEGIN='# BEGIN env-options'
END='# END env-options'

OPTIONS=$(jq -e -r 'to_entries[] | "          - \"\(.key) | Tag: \(.value.tag) | \(.value.description)\""' "$CONFIG")

UPDATED=$(OPTIONS="$OPTIONS" awk -v begin="$BEGIN" -v end="$END" '
  index($0, begin) { print; print ENVIRON["OPTIONS"]; skip = 1; next }
  index($0, end)   { skip = 0 }
  !skip            { print }
' "$WORKFLOW")

if [ "${1:-}" = "--check" ]; then
  if [ "$UPDATED" != "$(cat "$WORKFLOW")" ]; then
    echo "Dropdown options are out of date. Run: .github/scripts/sync-env-options.sh" >&2
    exit 1
  fi
  echo "Dropdown options are in sync."
else
  printf '%s\n' "$UPDATED" > "$WORKFLOW"
  echo "Updated environment options in ${WORKFLOW#$ROOT/}"
fi
