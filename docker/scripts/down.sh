#!/bin/bash

MODE="dev"
if [[ "$1" == "--prod" ]]; then
    MODE="prod"
    shift
fi

FILES="-f compose/docker-compose.yml -f compose/docker-compose.${MODE}.yml"

if [ "$#" -eq 0 ]; then
    echo "No services specified. Bringing down all services in $MODE mode."
    docker compose $FILES down
else
    echo "Bringing down specified services: $@ in $MODE mode."
    docker compose $FILES rm -s -f "$@"
fi
