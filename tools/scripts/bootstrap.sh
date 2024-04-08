#! /bin/bash

pnpm i

source ./tools/scripts/utils.sh

create_env

generate_mnemonic

create_rahat_volumes

start_dev_tools

migrate
