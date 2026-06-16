#!/bin/bash

# Deploy script for Terraria-Companion production
# This script pulls the latest changes, installs dependencies, builds the project,
# and performs security checks.

set -e  # Exit on any error
set -o pipefail  # Exit if any command in a pipeline fails

echo "Starting deployment..."

# Security: Verify GPG signatures on git commits
echo "Pulling latest changes (verifying signatures)..."
git pull --verify-signatures origin main || {
  echo "ERROR: Git pull signature verification failed. Aborting deployment."
  exit 1
}

# Security: Use npm ci (clean install) instead of npm install to ensure reproducible builds
# This uses package-lock.json and prevents dependency version drift
echo "Installing dependencies (clean install)..."
npm ci --prefer-offline --no-audit || {
  echo "ERROR: Dependency installation failed. Aborting deployment."
  exit 1
}

# Security: Check for known vulnerabilities in production dependencies
echo "Checking for security vulnerabilities..."
npm audit --production --audit-level=moderate || {
  echo "WARNING: Security vulnerabilities detected in dependencies."
  echo "Review: npm audit --production"
}

# Build the project
echo "Building the project..."
npm run build || {
  echo "ERROR: Build failed. Aborting deployment."
  exit 1
}

echo "✅ Deployment successful!"

echo "Deployment complete! The dist/ folder contains the built application."
echo "Copy the contents of dist/ to your web server directory if needed."