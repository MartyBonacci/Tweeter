#!/bin/bash

# Comprehensive Testing Script

set -e

echo "🧪 Running Comprehensive Test Suite..."

# Type checking
echo "🔍 Type checking..."
pnpm run typecheck

# Linting
echo "📋 Linting code..."
pnpm run lint

# Unit tests
echo "🧪 Running unit tests..."
pnpm run test

# Build test
echo "🏗️  Testing build process..."
pnpm run build

echo "✅ All tests passed!"