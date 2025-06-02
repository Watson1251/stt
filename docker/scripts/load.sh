#!/bin/bash

SOURCE_DIR="images"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "[-] $SOURCE_DIR does not exist."
    exit 1
fi

for tar in "$SOURCE_DIR"/*.tar; do
    echo "[~] Loading image from $tar"
    docker load -i "$tar"
done

echo "[+] All images loaded from $SOURCE_DIR"
