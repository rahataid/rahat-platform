#! /bin/bash

source ./tools/docker-scripts/prompts.sh
source ./tools/docker-scripts/utils.sh

export_env_variables

compose_down

if rahat_images_exists; then
    echo "Existing docker images found."
    while true; do
        read -p "Do you want to build new docker images? [y/n]: " yn
        case $yn in
        [Yy]*)
            remove_existing_images
            build_new_images
            break
            ;;
        [Nn]*) break ;;
        *) echo "Please answer with y or n." ;;
        esac
    done
else
    echo "Existing docker images not found."
    build_new_images
fi

start_pg_redis

while true; do
    read -p "Reset database for rahat core? [y/n]: " yn
    case $yn in
    [Yy]*)
        drop_pg_database $DB_NAME
        create_pg_database $DB_NAME
        IS_DB_RESET=true
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer with y or n." ;;
    esac
done

compose_up

if [ -n $IS_DB_RESET ]; then
    run_rahat_migration_seed
fi

echo "Rahat core setup complete"
