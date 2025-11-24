#!/usr/bin/with-contenv bashio
# ==============================================================================
# FamilyFlow Add-on Startup Script
# ==============================================================================

bashio::log.info "Starting FamilyFlow Add-on..."

# Set environment variables
export PORT=3000
export NODE_ENV=production
export DATA_DIR=/data

# Start nginx in background
bashio::log.info "Starting nginx..."
nginx

# Start backend (foreground)
bashio::log.info "Starting backend..."
cd /app/backend
exec /usr/bin/node dist/index.js
