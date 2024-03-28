export_env_variables() {
    echo "Exporting env variables."
    export $(grep -v '^#' .env | xargs -d '\n')
    echo "Export complete."
}

export_env_variables_macos() {
    echo "Exporting env variables."
    export $(grep -v '^#' .env | gxargs -d '\n')
    echo "Export complete."
}

configure_env_variables_macos() {
    ENV_FILE='.env'

    echo "Updating database values in .env file."
    gsed -i "s/^DB_HOST=.*/DB_HOST=postgres_local/" $ENV_FILE
    gsed -i "s/^DB_PORT=.*/DB_PORT=5432/" $ENV_FILE
    gsed -i "s/^DB_USERNAME=.*/DB_USERNAME=admin/" $ENV_FILE
    gsed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=admin/" $ENV_FILE

    echo "Updating redis values in $ENV_FILE file."
    gsed -i "s/^REDIS_HOST=.*/REDIS_HOST=redis_local/" $ENV_FILE
    gsed -i "s/^REDIS_PORT=.*/REDIS_PORT=6379/" $ENV_FILE
    gsed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=/" $ENV_FILE

    DB_USERNAME=$(grep "^DB_USERNAME=" $ENV_FILE | cut -d '=' -f2)
    DB_PASSWORD=$(grep "^DB_PASSWORD=" $ENV_FILE | cut -d '=' -f2)
    DB_HOST=$(grep "^DB_HOST=" $ENV_FILE | cut -d '=' -f2)
    DB_PORT=$(grep "^DB_PORT=" $ENV_FILE | cut -d '=' -f2)
    DB_NAME=$(grep "^DB_NAME=" $ENV_FILE | cut -d '=' -f2)

    echo "Reconstructing database URL."
    NEW_DB_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

    gsed -i "s|^DATABASE_URL=.*|DATABASE_URL=${NEW_DB_URL}|" $ENV_FILE
    echo ".env file updated"
}

configure_env_variables() {
    ENV_FILE='.env'

    echo "Updating database values in .env file."
    sed -i "s/^DB_HOST=.*/DB_HOST=postgres_local/" $ENV_FILE
    sed -i "s/^DB_PORT=.*/DB_PORT=5432/" $ENV_FILE
    sed -i "s/^DB_USERNAME=.*/DB_USERNAME=admin/" $ENV_FILE
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=admin/" $ENV_FILE

    echo "Updating redis values in $ENV_FILE file."
    sed -i "s/^REDIS_HOST=.*/REDIS_HOST=redis_local/" $ENV_FILE
    sed -i "s/^REDIS_PORT=.*/REDIS_PORT=6379/" $ENV_FILE
    sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=/" $ENV_FILE

    DB_USERNAME=$(grep "^DB_USERNAME=" $ENV_FILE | cut -d '=' -f2)
    DB_PASSWORD=$(grep "^DB_PASSWORD=" $ENV_FILE | cut -d '=' -f2)
    DB_HOST=$(grep "^DB_HOST=" $ENV_FILE | cut -d '=' -f2)
    DB_PORT=$(grep "^DB_PORT=" $ENV_FILE | cut -d '=' -f2)
    DB_NAME=$(grep "^DB_NAME=" $ENV_FILE | cut -d '=' -f2)

    echo "Reconstructing database URL."
    NEW_DB_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${NEW_DB_URL}|" $ENV_FILE
    echo ".env file updated"
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

network_create() {
    DOCKER_NETWORK_NAME="rahat_network"
    echo "Setting up docker network."
    docker network inspect $DOCKER_NETWORK_NAME >/dev/null 2>&1 || docker network create --driver bridge $DOCKER_NETWORK_NAME
}

compose_up() {
    echo "Starting rahat container."
    docker compose up -d
    echo "Sleeping for 10 seconds."
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

el_image_exists() {
    if [ -n "$(docker images -q el_local_image 2>/dev/null)" ]; then
        return 0
    else
        return 1
    fi
}

run_rahat_migration_seed() {
    CONTAINER_NAME=rahat_local
    docker exec -i "$CONTAINER_NAME" /bin/sh -c "cd /usr/src/app && sh ./tools/docker-scripts/migrate-seed.sh"
    echo "Sleeping for 5 seconds."
    sleep 5
}
