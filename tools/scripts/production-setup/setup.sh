
#! /bin/sh
SCRIPT_DIR=$(dirname "$0")

get_env_value() {
  local var_name=$1
  local value=$(grep "^${var_name}=" "$SCRIPT_DIR/.env.setup" | cut -d '=' -f2)
  echo "$value"
}

blockchain_setup() {
    npx ts-node "$SCRIPT_DIR/_setup-deployment.ts"
}

graph_setup() {
    npx ts-node "$SCRIPT_DIR/_modify-graph-contracts.ts"
    npx graph auth --studio $(get_env_value "SUBGRAPH_AUTH_TOKEN")
    local SUBGRAPH_NETWORK=$(get_env_value "SUBGRAPH_NETWORK")
    local SUBGRAPH_NAME=$(get_env_value "SUBGRAPH_NAME")
    cd "$SCRIPT_DIR/../../../apps/graph" && npx graph deploy --studio --network $SUBGRAPH_NETWORK $SUBGRAPH_NAME
}

blockchain_setup
graph_setup
