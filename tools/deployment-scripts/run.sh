#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOYMENT_DIR="$SCRIPT_DIR/deployments"
PROMPT="node $SCRIPT_DIR/lib/prompt.js"
PROMPT_RESULT_FILE="$(mktemp)"
export PROMPT_RESULT_FILE

echo ""
echo "=== Rahat Deployment Scripts ==="
echo ""

# ── Helper: arrow-key list prompt — runs directly (no subshell) ─────────────
ask_list() {
  local message="$1"
  shift
  $PROMPT list "$message" "$@"
}

# ── Step 1: New or existing project? ────────────────────────────────────────
ask_list "New or existing project?" "New project" "Existing project"
PROJECT_CHOICE="$(cat "$PROMPT_RESULT_FILE")"

if [ "$PROJECT_CHOICE" = "New project" ]; then
  START_STEP=0

elif [ "$PROJECT_CHOICE" = "Existing project" ]; then
  mkdir -p "$DEPLOYMENT_DIR"
  JSON_FILES=()
  while IFS= read -r -d '' f; do
    JSON_FILES+=("$(basename "$f")")
  done < <(find "$DEPLOYMENT_DIR" -maxdepth 1 -name '*.json' -print0 | sort -z)

  if [ "${#JSON_FILES[@]}" -eq 0 ]; then
    echo "No deployment files found in $DEPLOYMENT_DIR. Run a new project first."
    exit 1
  fi

  ask_list "Select deployment file:" "${JSON_FILES[@]}"
  SELECTED_FILE="$(cat "$PROMPT_RESULT_FILE")"
  echo "Selected: $SELECTED_FILE"

  # ── Which step to start from? ──────────────────────────────────────────────
  SCRIPTS=()
  SCRIPT_LABELS=()
  for f in $(find "$SCRIPT_DIR" -maxdepth 1 -name '[0-9]*.js' | sort -t. -k1 -V); do
    [ -f "$f" ] || continue
    base="$(basename "$f")"
    num="${base%%.*}"
    [ "$num" = "0" ] && continue
    SCRIPTS+=("$f")
    SCRIPT_LABELS+=("$base")
  done

  if [ "${#SCRIPTS[@]}" -eq 0 ]; then
    echo "No setup scripts found."
    exit 1
  fi

  ask_list "Start from which step?" "${SCRIPT_LABELS[@]}"
  CHOSEN_LABEL="$(cat "$PROMPT_RESULT_FILE")"

  # Find index of chosen label
  START_INDEX=0
  for i in "${!SCRIPT_LABELS[@]}"; do
    if [ "${SCRIPT_LABELS[$i]}" = "$CHOSEN_LABEL" ]; then
      START_INDEX=$i
      break
    fi
  done

  START_STEP=1

else
  echo "Invalid choice."
  exit 1
fi

# ── Run scripts ──────────────────────────────────────────────────────────────

if [ "$START_STEP" -eq 0 ]; then
  STEP0="$SCRIPT_DIR/0.setup-project.js"
  if [ ! -f "$STEP0" ]; then
    echo "Error: 0.setup-project.js not found."
    exit 1
  fi

  # Snapshot existing files before step 0
  BEFORE="$(find "$DEPLOYMENT_DIR" -maxdepth 1 -name '*.json' 2>/dev/null | sort)"

  echo ""
  echo ">>> 0.setup-project.js"
  echo "---"
  node "$STEP0"
  STATUS=$?
  echo "---"
  if [ $STATUS -ne 0 ]; then
    echo "Step 0 failed. Stopping."
    exit $STATUS
  fi

  # Detect newly created file
  AFTER="$(find "$DEPLOYMENT_DIR" -maxdepth 1 -name '*.json' 2>/dev/null | sort)"
  CREATED_PATH="$(comm -13 <(echo "$BEFORE") <(echo "$AFTER") | head -1)"
  SELECTED_FILE="$(basename "$CREATED_PATH")"

  if [ -z "$SELECTED_FILE" ]; then
    echo "Could not detect created file. Stopping."
    exit 1
  fi

  echo "Continuing with: $SELECTED_FILE"

  # Collect remaining scripts (1 onward)
  SCRIPTS=()
  for f in $(find "$SCRIPT_DIR" -maxdepth 1 -name '[0-9]*.js' | sort -t. -k1 -V); do
    [ -f "$f" ] || continue
    base="$(basename "$f")"
    num="${base%%.*}"
    [ "$num" = "0" ] && continue
    SCRIPTS+=("$f")
  done
  START_INDEX=0
fi

FILE_ARG=""
[ -n "$SELECTED_FILE" ] && FILE_ARG="--file=$SELECTED_FILE"

# Run from START_INDEX onward
for i in "${!SCRIPTS[@]}"; do
  [ "$i" -lt "$START_INDEX" ] && continue
  SCRIPT="${SCRIPTS[$i]}"
  echo ""
  echo ">>> $(basename "$SCRIPT")"
  echo "---"
  node "$SCRIPT" $FILE_ARG
  STATUS=$?
  echo "---"
  if [ $STATUS -ne 0 ]; then
    echo "Step failed: $(basename "$SCRIPT"). Stopping."
    exit $STATUS
  fi
done

echo ""
echo "All steps completed."
