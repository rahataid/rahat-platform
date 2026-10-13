#!/bin/bash
set -e

echo "Starting Test-Load MSA Deployment"
echo

# ====== HELPERS ======
wait_for_running() {
  CONTAINER=$1
  echo "Waiting for $CONTAINER to be running..."
  until [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null)" == "true" ]; do
    sleep 2
  done
  echo "$CONTAINER is running"
}

is_running() {
  [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" == "true" ]
}

# Runs the full migrate/seed/extract flow for a single AA container.
# Args: index label, container name, project env file, name, description, private key
provision_aa_project() {
  local idx_label=$1 AA_CONTAINER=$2 PROJECT_ENV=$3 NAME=$4 DESC=$5 PKEY=$6

  echo "================ AA: $idx_label ($AA_CONTAINER) =================="
  wait_for_running "$AA_CONTAINER"

  docker cp "$PROJECT_ENV" "$AA_CONTAINER":/usr/src/app/"$(basename "$PROJECT_ENV")"

  echo "Running AA Migration..."
  docker exec -i "$AA_CONTAINER" sh -c "pnpm migrate:aa"

  local ENV_BASENAME
  ENV_BASENAME=$(basename "$PROJECT_ENV")

  echo "Setting project name/description in $ENV_BASENAME..."
  docker exec -i "$AA_CONTAINER" sh -c "
    cd /usr/src/app
    grep -v '^PROJECT_NAME=' $ENV_BASENAME 2>/dev/null > $ENV_BASENAME.tmp || true
    grep -v '^PROJECT_DESCRIPTION=' $ENV_BASENAME.tmp > $ENV_BASENAME.tmp2 || true
    mv $ENV_BASENAME.tmp2 $ENV_BASENAME
    echo 'PROJECT_NAME=\"$NAME\"' >> $ENV_BASENAME
    echo 'PROJECT_DESCRIPTION=\"$DESC\"' >> $ENV_BASENAME
  "

  echo "Seeding AA — you'll be dropped into the container's prompts now."
  echo "Suggested answers:"
  echo "  Project name:        $NAME"
  echo "  Project description: $DESC"
  echo "  Private key:         ${PKEY:-<leave blank, press Enter>}"
  docker exec -it "$AA_CONTAINER" sh -c "cd /usr/src/app && npx tsx tools/scripts/seed.aa.ts $ENV_BASENAME"

  sleep 8

  echo "Extracting projectId..."
  local PROJECT_ID
  PROJECT_ID=$(docker exec -i "$AA_CONTAINER" sh -c \
    "cd /usr/src/app && node -e \"console.log(require('./project-setup-summary.json').project.uuid)\"" 2>/dev/null)

  if [ -z "$PROJECT_ID" ]; then
    echo "Could not extract projectId for $idx_label"
    exit 1
  fi

  echo "$idx_label ID = $PROJECT_ID"
  echo "$idx_label|$NAME|$AA_CONTAINER|$PROJECT_ID" >> "$PROJECT_ID_LOG"

  sed -i "s/^PROJECT_ID=.*/PROJECT_ID=$PROJECT_ID/" "$PROJECT_ENV" 2>/dev/null || \
    echo "PROJECT_ID=$PROJECT_ID" >> "$PROJECT_ENV"

  echo "Seeding Chain Settings..."
  docker exec -i "$AA_CONTAINER" sh -c "
    cd prisma && \
    npx tsx seed-evm-chainsettings.ts
  "

  echo "$idx_label ($NAME) provisioned on $AA_CONTAINER"
  echo
}

# ====== READ docker-compose.yaml ======
COMPOSE_FILE=""
for f in docker-compose.yml docker-compose.yaml compose.yml compose.yaml; do
  [ -f "$f" ] && COMPOSE_FILE="$f" && break
done

if [ -z "$COMPOSE_FILE" ]; then
  echo "No docker-compose.yml/yaml found in $(pwd). Aborting."
  exit 1
fi
echo "Using compose file: $COMPOSE_FILE"

ALL_PROFILES=$(docker compose config --profiles 2>/dev/null || true)
PROFILE_ARGS=()
while IFS= read -r p; do
  [ -n "$p" ] && PROFILE_ARGS+=(--profile "$p")
done <<< "$ALL_PROFILES"

if [ "${#PROFILE_ARGS[@]}" -gt 0 ]; then
  COMPOSE_JSON=$(docker compose "${PROFILE_ARGS[@]}" config --format json 2>/dev/null || true)
else
  COMPOSE_JSON=$(docker compose config --format json 2>/dev/null || true)
fi
if [ -z "$COMPOSE_JSON" ]; then
  echo "Could not parse '$COMPOSE_FILE' with 'docker compose config --format json'."
  echo "(Requires Compose v2.21+. Check 'docker compose version'.) Aborting."
  exit 1
fi

ALL_SERVICES=$(echo "$COMPOSE_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print('\n'.join(d.get('services',{}).keys()))")

compose_field() {
  local service=$1 field=$2
  echo "$COMPOSE_JSON" | python3 -c "
import json, sys
d = json.load(sys.stdin)
svc = d.get('services', {}).get('$service', {})
val = svc.get('$field')
if isinstance(val, list):
    print(val[0] if val else '')
elif val is None:
    print('')
else:
    print(val)
"
}

detect_service() {
  local keyword=$1 label=$2
  local match
  match=$(echo "$ALL_SERVICES" | grep -i "$keyword" | head -n1)
  if [ -z "$match" ]; then
    echo "Could not auto-detect the '$label' service from $COMPOSE_FILE." >&2
    echo "Available services:" >&2
    echo "$ALL_SERVICES" | sed 's/^/  /' >&2
    read -rp "Enter the $label service name: " match
  fi
  echo "$match"
}

echo
echo "=== Detecting services from $COMPOSE_FILE ==="
PLATFORM_SERVICE=$(detect_service "platform" "platform")
DB_SERVICE=$(detect_service "^db$\|-db$\|_db$\|^postgres" "db")
TRIGGERS_SERVICE=$(detect_service "trigger" "triggers")
mapfile -t ALL_AA_SERVICES < <(echo "$ALL_SERVICES" | grep -i "project.aa\|_aa$\|-aa$\|_aa_\|-aa-" | sort)

echo "  platform  -> $PLATFORM_SERVICE"
echo "  db        -> $DB_SERVICE"
echo "  triggers  -> $TRIGGERS_SERVICE"
echo "  aa services found (${#ALL_AA_SERVICES[@]}):"
for svc in "${ALL_AA_SERVICES[@]}"; do
  cn=$(compose_field "$svc" container_name)
  ef=$(compose_field "$svc" env_file)
  echo "    - $svc  (container: ${cn:-$svc}, env_file: ${ef:-none})"
done
echo

if [ "${#ALL_AA_SERVICES[@]}" -eq 0 ]; then
  echo "No AA-pattern services found in $COMPOSE_FILE. Aborting."
  exit 1
fi

PLATFORM_CONTAINER=$(compose_field "$PLATFORM_SERVICE" container_name)
PLATFORM_CONTAINER="${PLATFORM_CONTAINER:-$PLATFORM_SERVICE}"
DB_CONTAINER=$(compose_field "$DB_SERVICE" container_name)
DB_CONTAINER="${DB_CONTAINER:-$DB_SERVICE}"
TRIGGERS_CONTAINER=$(compose_field "$TRIGGERS_SERVICE" container_name)
TRIGGERS_CONTAINER="${TRIGGERS_CONTAINER:-$TRIGGERS_SERVICE}"

PLATFORM_ENV_FILE=$(compose_field "$PLATFORM_SERVICE" env_file)
PLATFORM_ENV_FILE="${PLATFORM_ENV_FILE:-.env.platform}"
TRIGGERS_ENV_FILE=$(compose_field "$TRIGGERS_SERVICE" env_file)
TRIGGERS_ENV_FILE="${TRIGGERS_ENV_FILE:-.env.project.triggers}"
read -rp "Triggers in-container destination path [default: /usr/src/app/packages/database/.env]: " TRIGGERS_ENV_DEST
TRIGGERS_ENV_DEST="${TRIGGERS_ENV_DEST:-/usr/src/app/packages/database/.env}"
echo

# ====== DETECT WHICH AA SERVICES ARE ALREADY RUNNING (pre-up snapshot) ======
declare -A AA_WAS_RUNNING
NEW_AA_SERVICES=()
for svc in "${ALL_AA_SERVICES[@]}"; do
  cn=$(compose_field "$svc" container_name)
  cn="${cn:-$svc}"
  if is_running "$cn"; then
    AA_WAS_RUNNING["$svc"]=1
  else
    AA_WAS_RUNNING["$svc"]=0
    NEW_AA_SERVICES+=("$svc")
  fi
done

PLATFORM_WAS_RUNNING=0
is_running "$PLATFORM_CONTAINER" && PLATFORM_WAS_RUNNING=1
TRIGGERS_WAS_RUNNING=0
is_running "$TRIGGERS_CONTAINER" && TRIGGERS_WAS_RUNNING=1

echo "=== Status ==="
echo "  Platform ($PLATFORM_CONTAINER): $([ "$PLATFORM_WAS_RUNNING" -eq 1 ] && echo already running — will skip migrate/seed || echo not running — will provision)"
echo "  Triggers ($TRIGGERS_CONTAINER): $([ "$TRIGGERS_WAS_RUNNING" -eq 1 ] && echo already running — will skip migrate/seed || echo not running — will provision)"
echo "  AA services already running (skipped): $(( ${#ALL_AA_SERVICES[@]} - ${#NEW_AA_SERVICES[@]} ))"
echo "  AA services to provision now: ${#NEW_AA_SERVICES[@]} (${NEW_AA_SERVICES[*]:-none})"
echo

if [ "${#NEW_AA_SERVICES[@]}" -eq 0 ] && [ "$PLATFORM_WAS_RUNNING" -eq 1 ] && [ "$TRIGGERS_WAS_RUNNING" -eq 1 ]; then
  echo "Nothing new to do — everything in the compose file is already up and provisioned."
  echo "(Add a new AA service block to $COMPOSE_FILE and re-run to provision just that one.)"
  exit 0
fi

# ====== COLLECT NAME/DESCRIPTION/KEY ONLY FOR NEW AA SERVICES ======
declare -A AA_NAME
declare -A AA_DESC
declare -A AA_PKEY

if [ "${#NEW_AA_SERVICES[@]}" -gt 0 ]; then
  echo "=== New AA project details ==="
  for svc in "${NEW_AA_SERVICES[@]}"; do
    echo "  $svc:"
    read -rp "    Project name: " pname
    read -rp "    Project description: " pdesc
    read -rsp "    Private key (hidden): " pkey
    echo
    AA_NAME["$svc"]="${pname:-Test Load Project}"
    AA_DESC["$svc"]="${pdesc:-Automated Deployment Project}"
    AA_PKEY["$svc"]="$pkey"
  done
  echo
fi

read -rp "Proceed? [y/N] " CONFIRM
[[ "$CONFIRM" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
echo

PROJECT_ID_LOG="deployed_project_ids.txt"
touch "$PROJECT_ID_LOG"

# ====== 1. CORE ======
echo "================ CORE =================="
docker compose --profile core up -d
wait_for_running "$PLATFORM_CONTAINER"

if [ "$PLATFORM_WAS_RUNNING" -eq 0 ]; then
  docker cp "$PLATFORM_ENV_FILE" "$PLATFORM_CONTAINER":/usr/src/app/"$(basename "$PLATFORM_ENV_FILE")"
  docker exec -i "$PLATFORM_CONTAINER" sh -c "
  pnpm prisma migrate deploy
  cd prisma && \
  npx tsx seed.chainsettings.ts && \
  npx tsx seed.communication-settings.ts && \
  npx tsx seed.user.ts
  "
  echo "Core infrastructure provisioned"
else
  echo "Platform already running — skipped migrate/seed"
fi
echo

# ====== 2. TRIGGERS ======
echo "================ TRIGGERS =================="
docker compose --profile triggers up -d
wait_for_running "$TRIGGERS_CONTAINER"

if [ "$TRIGGERS_WAS_RUNNING" -eq 0 ]; then
  docker cp "$TRIGGERS_ENV_FILE" "$TRIGGERS_CONTAINER":"$TRIGGERS_ENV_DEST"

  echo "Deploying Trigger DB Schema..."
  docker exec -i "$TRIGGERS_CONTAINER" sh -c "
  set -e
  . '$TRIGGERS_ENV_DEST'
  if ! grep -q '^DATABASE_URL=' '$TRIGGERS_ENV_DEST'; then
    echo \"DATABASE_URL=postgresql://\${DB_USERNAME}:\${DB_PASSWORD}@\${DB_HOST}:\${DB_PORT}/\${DB_NAME}\" >> '$TRIGGERS_ENV_DEST'
  fi
  cd packages/database && npm run db:deploy
  "

  echo "Seeding Trigger DB..."
  docker exec -i "$TRIGGERS_CONTAINER" sh -c "
  cd packages/database/prisma && \
  export DATABASE_URL=\$(grep '^DATABASE_URL=' '$TRIGGERS_ENV_DEST' | cut -d '=' -f2-) && \
  source seed-db.sh
  "

  docker compose --profile triggers restart
  wait_for_running "$TRIGGERS_CONTAINER"
  echo "Triggers provisioned"
else
  echo "Triggers already running — skipped deploy/seed"
fi
echo

# ====== 3. AA — bring up all defined AA services, provision only the new ones ======
echo "================ AA =================="
docker compose --profile aa up -d

for svc in "${NEW_AA_SERVICES[@]}"; do
  cn=$(compose_field "$svc" container_name)
  cn="${cn:-$svc}"
  env=$(compose_field "$svc" env_file)
  env="${env:-.env.project.aa}"
  provision_aa_project "$svc" "$cn" "$env" "${AA_NAME[$svc]}" "${AA_DESC[$svc]}" "${AA_PKEY[$svc]}"
done

if [ "${#NEW_AA_SERVICES[@]}" -gt 0 ]; then
  docker compose --profile aa restart
fi

echo "Project IDs (cumulative log) -> $PROJECT_ID_LOG"
cat "$PROJECT_ID_LOG"
echo
echo "DEPLOYMENT COMPLETE"