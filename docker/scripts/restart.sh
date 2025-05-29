#!/bin/bash

MODE="dev"
if [[ "$1" == "--prod" ]]; then
    MODE="prod"
    shift
fi

FILES="-f compose/docker-compose.yml -f compose/docker-compose.${MODE}.yml"

if [ "$#" -eq 0 ]; then
    echo "No services specified. Restarting all services in $MODE mode."
    docker compose $FILES down
    docker compose $FILES up -d
else
    echo "Restarting specified services: $@ in $MODE mode."
    docker compose $FILES down "$@"
    docker compose $FILES up -d "$@"
fi