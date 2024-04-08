get_project_name() {
    while true; do
        read -p "Enter your new project name: " PROJECT_NAME
        if [ -z "$PROJECT_NAME" ]; then
            echo "Error: Project name cannot be empty. Please enter a valid name."
        else
            break
        fi
    done
}

get_project_type() {
    while true; do
        read -p "Enter your new project type: " PROJECT_TYPE
        if [ -z "$PROJECT_TYPE" ]; then
            echo "Error: Project type cannot be empty. Please enter a valid type."
        else
            break
        fi
    done
}

get_db_container_name() {
    while true; do
        read -p "Enter your postgres container name: " DB_CONTAINER
        if [ -z "$DB_CONTAINER" ]; then
            echo "Error: Postgres container name cannot be empty. Please enter a valid name."
        else
            break
        fi
    done
}
