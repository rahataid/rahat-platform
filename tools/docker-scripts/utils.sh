export_env_variables() {
    echo "Exporting env variables."
    export $(grep -v '^#' .env | xargs -d '\n')
    echo "Export complete."
}

drop_pg_database() {
    CONTAINER_NAME=postgres_local
    DB_NAME=$1
    echo "Dropping database $DB_NAME."
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USERNAME" -c "DROP DATABASE $DB_NAME WITH (FORCE);"
    echo "Database dropped."
}

create_pg_database() {
    CONTAINER_NAME=postgres_local
    DB_NAME=$1
    echo "Creating new database with name $DB_NAME."
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USERNAME" -c "CREATE DATABASE $DB_NAME;"
    echo "Database created."
}

remove_existing_images() {
    echo "Removing existing images."
    docker rmi rahat_local_image --force
    docker rmi beneficiary_local_image --force
}

remove_existing_el_image() {
    echo "Removing existing EL project image."
    docker rmi el_local_image --force
}

build_new_el_image() {
    echo "Building new EL project docker image."
    docker build -t el_local_image -f "$EL_PROJECT_DIR/Dockerfile.dev" $EL_PROJECT_DIR
    echo "Build complete."
}

build_new_images() {
    echo "Building new docker images."
    docker compose build
    echo "Build complete."
}

compose_up() {
    echo "Starting rahat container."
    docker compose up -d
    echo "Sleeping for 20 seconds."
    sleep 10
}

compose_down() {
    echo "Removing stale containers."
    docker compose down
}

compose_restart_containers() {
    docker compose restart rahat_local beneficiary_local
}

start_pg_redis() {
    echo "Starting postgres and redis containers."
    docker compose up postgres_local redis_local -d
    echo "Sleeping for 5 seconds."
    sleep 5
}

rahat_images_exists() {
    if [ -n "$(docker images -q rahat_local_image 2>/dev/null)" ] || [ -n "$(docker images -q beneficiary_local_image 2>/dev/null)" ]; then
        # at least one image exists
        return 0
    else
        # neither image exists
        return 1
    fi
}

run_rahat_migration_seed() {
    CONTAINER_NAME=rahat_local
    docker exec -i "$CONTAINER_NAME" /bin/sh -c "cd /usr/src/app && sh ./tools/docker-scripts/migration.sh"
    echo "Sleeping for 5 seconds."
    sleep 5
}
