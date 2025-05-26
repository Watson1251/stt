#!/bin/bash

# Detect host IP (first non-loopback IP)
HOST_IP=$(hostname -I | awk '{print $1}')
export API_URL="http://$HOST_IP:3000/api"

echo "[~] API_URL set to $API_URL"
