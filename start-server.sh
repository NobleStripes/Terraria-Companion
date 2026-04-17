#!/bin/bash

# Terraria Companion - Local Server Launcher (macOS/Linux)
# This script starts the local server for offline use

echo ""
echo "============================================"
echo "   Terraria Companion Local Server"
echo "============================================"
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "ERROR: dist folder not found!"
    echo "Please run: npm run build"
    echo ""
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Download from: https://nodejs.org/"
    echo ""
    exit 1
fi

# Start the server
echo "Starting server on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

node server.js