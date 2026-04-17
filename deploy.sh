#!/bin/bash

# Deploy script for Terraria-Companion production
# This script pulls the latest changes, installs dependencies, and builds the project

set -e  # Exit on any error

echo "Starting deployment..."

# Pull latest changes from main branch
echo "Pulling latest changes..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

echo "Deployment complete! The dist/ folder contains the built application."
echo "Copy the contents of dist/ to your web server directory if needed."