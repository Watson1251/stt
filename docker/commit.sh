#!/bin/bash

dirname=docker_images

# Capture all services if none are provided as arguments
if [ "$#" -eq 0 ]; then
    echo "No services specified. Committing and exporting all running services."
    services=$(docker compose config --services)
else
    echo "Committing and exporting specified services: $@"
    services="$@"
fi

# Iterate through each specified service, commit and export as tar file
for service in $services; do
    # Get the container ID of the running service
    container_id=$(docker compose ps -q "$service")
    
    # Check if container is running
    if [ -n "$container_id" ]; then
        # Commit the container to an image with prefix 'dev-'
        image_name="dev-$service"
        docker commit "$container_id" "$image_name"
        
        # Export the committed image to a .tar file
        mkdir -p $dirname  # Ensure the '$dirname' directory exists
        docker save -o "$dirname/$image_name.tar" "$image_name"
        
        echo "[+] Service '$service' committed to image '$image_name' and exported as '$dirname/$image_name.tar'"
        echo ""
    else
        echo "[!] Service '$service' is not running. Skipping..."
        echo ""
    fi
done

echo "All specified services have been committed and exported."
