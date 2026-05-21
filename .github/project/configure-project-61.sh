#!/usr/bin/env bash
# Configure @rahat2026 (org project #61) fields and optionally fix "No Status" items.
# Requires: gh CLI logged in with project scope
#   gh auth login -s project,read:org,repo

set -euo pipefail

ORG="${ORG:-rahataid}"
PROJECT_NUMBER="${PROJECT_NUMBER:-61}"
DRY_RUN="${DRY_RUN:-0}"
FIX_NO_STATUS="${FIX_NO_STATUS:-0}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Run: gh auth login -s project,read:org,repo"
  exit 1
fi

gql() {
  gh api graphql -f query="$1" "${@:2}"
}

echo "Fetching project ${ORG}#${PROJECT_NUMBER}..."
PROJECT_JSON="$(gql 'query($org: String!, $num: Int!) {
  organization(login: $org) {
    projectV2(number: $num) {
      id
      title
      fields(first: 50) {
        nodes {
          __typename
          ... on ProjectV2Field { id name }
          ... on ProjectV2SingleSelectField { id name options { id name } }
          ... on ProjectV2IterationField { id name configuration { iterations { id title startDate duration } } }
        }
      }
    }
  }
}' -f org="$ORG" -F num="$PROJECT_NUMBER")"

PROJECT_ID="$(echo "$PROJECT_JSON" | jq -r '.data.organization.projectV2.id')"
if [[ "$PROJECT_ID" == "null" || -z "$PROJECT_ID" ]]; then
  echo "Could not load project. Check org access and project number."
  echo "$PROJECT_JSON" | jq .
  exit 1
fi

echo "Project ID: $PROJECT_ID"
echo "Existing fields:"
echo "$PROJECT_JSON" | jq -r '.data.organization.projectV2.fields.nodes[] | "\(.name) (\(.__typename))"'

field_exists() {
  local name="$1"
  echo "$PROJECT_JSON" | jq -e --arg n "$name" '.data.organization.projectV2.fields.nodes[] | select(.name == $n)' >/dev/null
}

create_single_select() {
  local name="$1"
  shift
  local options=("$@")

  if field_exists "$name"; then
    echo "  skip: field '$name' already exists"
    return
  fi

  local options_json
  options_json="$(printf '%s\n' "${options[@]}" | jq -R . | jq -s 'map({name: ., color: "GRAY", description: ""})')"

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "  [dry-run] would create single-select: $name"
    return
  fi

  echo "  creating single-select: $name"
  local input_json
  input_json="$(jq -n \
    --arg pid "$PROJECT_ID" \
    --arg name "$name" \
    --argjson opts "$options_json" \
    '{projectId: $pid, dataType: "SINGLE_SELECT", name: $name, singleSelectOptions: $opts}')"

  gql 'mutation($input: CreateProjectV2FieldInput!) {
    createProjectV2Field(input: $input) {
      projectV2Field { ... on ProjectV2SingleSelectField { id name } }
    }
  }' -f input="$input_json"
}

create_single_select "Environment" DEV STAGE PROD "Not deployed"
create_single_select "Priority" P0 P1 P2 P3
create_single_select "Work type" Bug Feature Chore Spike

echo ""
echo "Refresh field list after creates..."
PROJECT_JSON="$(gql 'query($org: String!, $num: Int!) {
  organization(login: $org) {
    projectV2(number: $num) {
      id
      fields(first: 50) {
        nodes {
          __typename
          ... on ProjectV2SingleSelectField { id name options { id name } }
        }
      }
    }
  }
}' -f org="$ORG" -F num="$PROJECT_NUMBER")"

STATUS_FIELD="$(echo "$PROJECT_JSON" | jq -r '.data.organization.projectV2.fields.nodes[] | select(.name == "Status") | .id' | head -1)"
BACKLOG_OPTION="$(echo "$PROJECT_JSON" | jq -r '.data.organization.projectV2.fields.nodes[] | select(.name == "Status") | .options[]? | select(.name == "Backlog") | .id' | head -1)"
NO_STATUS_OPTION="$(echo "$PROJECT_JSON" | jq -r '.data.organization.projectV2.fields.nodes[] | select(.name == "Status") | .options[]? | select(.name == "No Status") | .id' | head -1)"

echo "Status field: ${STATUS_FIELD:-not found}"
echo "Backlog option: ${BACKLOG_OPTION:-not found}"

if [[ "$FIX_NO_STATUS" == "1" && -n "$STATUS_FIELD" && -n "$BACKLOG_OPTION" && -n "$NO_STATUS_OPTION" ]]; then
  echo "Finding items in No Status..."
  ITEMS="$(gql 'query($pid: ID!, $status: String!) {
    node(id: $pid) {
      ... on ProjectV2 {
        items(first: 100) {
          nodes {
            id
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field { ... on ProjectV2SingleSelectField { name } }
                }
              }
            }
          }
        }
      }
    }
  }' -f pid="$PROJECT_ID" -f status="No Status")"

  count=0
  echo "$ITEMS" | jq -c '.data.node.items.nodes[]' | while read -r item; do
    item_id="$(echo "$item" | jq -r '.id')"
    current="$(echo "$item" | jq -r '[.fieldValues.nodes[]? | select(.field.name == "Status") | .name] | first // empty')"
    if [[ "$current" == "No Status" ]]; then
      count=$((count + 1))
      if [[ "$DRY_RUN" == "1" ]]; then
        echo "  [dry-run] would move item $item_id → Backlog"
      else
        gql 'mutation($project: ID!, $item: ID!, $field: ID!, $value: String!) {
          updateProjectV2ItemFieldValue(
            input: { projectId: $project, itemId: $item, fieldId: $field, value: { singleSelectOptionId: $value } }
          ) { projectV2Item { id } }
        }' -f project="$PROJECT_ID" -f item="$item_id" -f field="$STATUS_FIELD" -f value="$BACKLOG_OPTION"
        echo "  moved $item_id → Backlog"
      fi
    fi
  done
  echo "Done fixing No Status items."
fi

cat <<EOF

================================================================================
NEXT: Project workflows (UI only — API cannot create these yet)
================================================================================
Open: https://github.com/orgs/${ORG}/projects/${PROJECT_NUMBER}/workflows

Create these built-in workflows (see .github/project/PROJECT-61-WORKFLOWS.md).

================================================================================
THEN: Add org secret RAHAT_PROJECT_TOKEN (PAT or GitHub App with project scope)
================================================================================
Used by .github/workflows/project-*.yml in rahataid repos.

================================================================================
OPTIONAL: Fix existing No Status cards
  DRY_RUN=1 FIX_NO_STATUS=1 ./.github/project/configure-project-61.sh
  FIX_NO_STATUS=1 ./.github/project/configure-project-61.sh
================================================================================
EOF
