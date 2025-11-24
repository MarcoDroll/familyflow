#!/bin/bash
set -e

echo "Starting FamilyFlow Add-on..."

# Debug: Show node location
echo "Looking for node..."
which node || echo "node not in PATH"
ls -la /usr/bin/node* 2>/dev/null || echo "No node in /usr/bin"
ls -la /usr/local/bin/node* 2>/dev/null || echo "No node in /usr/local/bin"

# Set environment variables
export PORT=3000
export NODE_ENV=production
export DB_PATH=/config/famplan.db

# SUPERVISOR_TOKEN is automatically set by Home Assistant when hassio_api: true
# This enables MQTT auto-discovery via the Supervisor API
if [ -n "$SUPERVISOR_TOKEN" ]; then
    echo "Supervisor token available - MQTT integration enabled"
else
    echo "No supervisor token - MQTT integration disabled"
fi

# Ensure config directory exists (mapped by Home Assistant)
mkdir -p /config

# Start nginx in background
echo "Starting nginx..."
nginx

# Start backend (foreground)
echo "Starting backend..."
cd /app/backend

# Try to find and run node
if command -v node &> /dev/null; then
    exec node dist/index.js
elif [ -f /usr/bin/node ]; then
    exec /usr/bin/node dist/index.js
elif [ -f /usr/local/bin/node ]; then
    exec /usr/local/bin/node dist/index.js
else
    echo "ERROR: Node.js not found!"
    exit 1
fi
