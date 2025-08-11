#!/bin/bash

# Database Deployment Script for Tweeter
# This script sets up the database for a new environment

echo "🚀 Tweeter Database Deployment Script"
echo "======================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it in your .env file or export it:"
    echo "export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

echo "✅ DATABASE_URL is configured"
echo ""

# Run migrations
echo "📦 Running database migrations..."
npm run db:migrate

if [ $? -ne 0 ]; then
    echo "❌ Migration failed!"
    exit 1
fi

echo "✅ Migrations completed successfully"
echo ""

# Ask if user wants to seed the database
read -p "Would you like to seed the database with test data? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run db:seed
    
    if [ $? -ne 0 ]; then
        echo "⚠️ Seeding failed, but database structure is ready"
    else
        echo "✅ Database seeded successfully"
    fi
else
    echo "⏭️ Skipping database seeding"
fi

echo ""
echo "🎉 Database deployment complete!"
echo ""
echo "Your database is ready with the following tables:"
echo "  - users"
echo "  - tweets"
echo "  - follows"
echo "  - likes"