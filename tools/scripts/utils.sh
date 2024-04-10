current_dir="$PWD"

create_env() {
    # dev tools directory
    declare -a projectDirs=(
        "$current_dir" #for root project as well
        "$current_dir/tools/docker-compose/dev-tools"
    )

    for project in "${projectDirs[@]}"; do
        env_file="$project/.env"
        example_content=$(<"$project/.env.example")
        echo "$example_content" >"$env_file"
    done
}

generate_mnemonic() {
    pnpm generate:mnemonic $current_dir
}

get_ganache_accounts() {
    docker cp ganache:/db/accounts ./accounts.json
}

migrate_seed() {
    pnpm migrate:dev
    pnpm seed:devsettings $current_dir
}

create_rahat_volumes() {
    docker volume create rahat_pg_data &&
        docker volume create rahat_pg_admin_data &&
        docker volume create rahat_ganache_data &&
        docker volume create rahat_redis_data &&
        docker volume create rahat_pg_graph_data &&
        docker volume create rahat_ipfs_data
}

start_dev_tools() {
    declare -a composeDirs=(
        "$current_dir/tools/docker-compose/dev-tools"
        "$current_dir/tools/docker-compose/graph"
    )

    for project in "${composeDirs[@]}"; do
        compose_file="$project/docker-compose.yml"
        docker compose -f $compose_file up -d
    done
}

stop_dev_tools() {
    declare -a composeDirs=(
        "$current_dir/tools/docker-compose/dev-tools"
        "$current_dir/tools/docker-compose/graph"
    )

    for project in "${composeDirs[@]}"; do
        compose_file="$project/docker-compose.yml"
        docker compose -f $compose_file down
    done
}

remove_rahat_volumes() {
    docker volume rm rahat_pg_data &&
        docker volume rm rahat_pg_admin_data &&
        docker volume rm rahat_ganache_data &&
        docker volume rm rahat_redis_data &&
        docker volume rm rahat_pg_graph_data &&
        docker volume rm rahat_ipfs_data
}

rm_modules() {
    rm -rf dist node_modules tmp
}

reset() {
    stop_dev_tools
    remove_rahat_volumes
    rm_modules
}
