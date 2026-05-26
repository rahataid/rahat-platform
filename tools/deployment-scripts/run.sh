#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "=== Rahat Deployment Scripts ==="
echo ""

i=0
for f in "$SCRIPT_DIR"/[0-9]*.js; do
  [ -f "$f" ] || continue
  echo "  [$i] $(basename "$f")"
  eval "SCRIPT_$i=\"$f\""
  i=$((i + 1))
done
COUNT=$i

if [ "$COUNT" -eq 0 ]; then
  echo "No numbered scripts found."
  exit 1
fi

echo ""
printf "Enter number to run (0-%d): " "$((COUNT - 1))"
read -r INPUT

if ! echo "$INPUT" | grep -qE '^[0-9]+$' || [ "$INPUT" -ge "$COUNT" ]; then
  echo "Invalid selection: $INPUT"
  exit 1
fi

eval "SCRIPT=\$SCRIPT_$INPUT"

echo ""
echo ">>> $(basename "$SCRIPT")"
echo "---"
node "$SCRIPT"
echo "---"
echo "Done."
