#!/bin/bash

# Set default service name
DEFAULT_SERVICE="frontend-stt"

# Check if a service is passed as an argument, otherwise use the default
SERVICE="${1:-$DEFAULT_SERVICE}"

echo "Running bash inside the service: $SERVICE"
docker exec -it "$SERVICE" bash