#!/bin/bash

MODE="dev"
COMMIT_MODE=false
SERVICES=()

# Parse flags and service names
while [[ $# -gt 0 ]]; do
    case "$1" in
        --prod)
            MODE="prod"
            shift
            ;;
        --commit)
            COMMIT_MODE=true
            shift
            ;;
        *)
            SERVICES+=("$1")
            shift
            ;;
    esac
done

FILES="-f compose/docker-compose.yml -f compose/docker-compose.${MODE}.yml"
IMAGE_DIR="images"
mkdir -p "$IMAGE_DIR"

# Get all services if none specified
if [ ${#SERVICES[@]} -eq 0 ]; then
    echo "[~] No specific services provided. Using all services from $MODE mode."
    SERVICES=($(docker compose $FILES config --services))
fi

for service in "${SERVICES[@]}"; do
    image_name="$service"

    if [ "$COMMIT_MODE" = true ]; then
        container_id=$(docker compose $FILES ps -q "$service")

        if [ -n "$container_id" ]; then
            echo "[~] Committing container for '$service' to image '$image_name'..."
            docker commit "$container_id" "$image_name"
        else
            echo "[-] No running container for '$service'. Skipping commit."
            continue
        fi
    fi

    echo "[~] Saving image '$image_name' to '$IMAGE_DIR/$image_name.tar'..."
    if docker save -o "$IMAGE_DIR/$image_name.tar" "$image_name" 2>/dev/null; then
        echo "[+] Saved '$image_name.tar' successfully."
    else
        echo "[-] Failed to save image '$image_name'. Image does not exist."
        rm -f "$IMAGE_DIR/$image_name.tar"  # Clean up empty/incomplete tar
    fi
    echo
done

echo "[✓] Operation complete for services: ${SERVICES[*]}"
