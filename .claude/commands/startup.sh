#!/bin/bash

# Tweeter Development Startup Script
# This script initializes the development environment for the Tweeter project

set -e

echo "🚀 Starting Tweeter Development Environment..."

# Check if pnpm is installed
if ! command -v pnpm >/dev/null 2>&1; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment variables
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your actual values"
fi

# Generate database types
echo "🗄️  Generating database types..."
pnpm run db:generate

# Run database migrations
echo "🔄 Running database migrations..."
pnpm run db:migrate

# Start development server
echo "🌐 Starting development server..."
pnpm run dev

echo "✅ Development environment is ready!"
echo "   - App: http://localhost:3000"
echo "   - Database Studio: pnpm run db:studio"