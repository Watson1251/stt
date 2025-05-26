#!/bin/bash

MODE="dev"
if [[ "$1" == "--prod" ]]; then
    MODE="prod"
    shift
fi

FILES="-f docker-compose.yml -f docker-compose.${MODE}.yml"

if [ "$#" -eq 0 ]; then
    echo "No services specified. Showing logs for all services in $MODE mode."
    docker compose $FILES logs -f
else
    echo "Showing logs for specified services: $@ in $MODE mode."
    docker compose $FILES logs -f "$@"
fi