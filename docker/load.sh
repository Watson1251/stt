#!/bin/bash

# Set variables
backup_dir="./docker_backup"

# Check if the backup directory exists
if [[ ! -d "$backup_dir" ]]; then
    echo "Error: Backup directory $backup_dir does not exist."
    exit 1
fi

# Load all images from .tar files in the backup directory
for tar_file in "$backup_dir"/*.tar; do
    if [[ -f "$tar_file" ]]; then
        echo "Loading Docker image from $tar_file"
        docker load -i "$tar_file"
    else
        echo "No tar files found in $backup_dir."
        exit 1
    fi
done

echo "All images loaded."
