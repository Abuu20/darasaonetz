#!/bin/bash

# Clean build
echo "🧹 Cleaning..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf .vercel

# Reinstall dependencies
echo "📦 Installing dependencies..."
npm install

# Check for missing dependencies
echo "🔍 Checking dependencies..."
npm ls --depth=0

# Build
echo "🏗️ Building..."
npm run build

echo "✅ Build complete!"
