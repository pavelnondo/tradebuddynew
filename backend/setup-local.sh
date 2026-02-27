#!/bin/bash

# TradeBuddy Local Development Setup Script
# This script sets up the local PostgreSQL database for development

echo "🚀 Setting up TradeBuddy for local development..."

# Add PostgreSQL to PATH
export PATH="/Library/PostgreSQL/18/bin:$PATH"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS with Homebrew: brew services start postgresql"
    echo "   On Ubuntu/Debian: sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create database if it doesn't exist
echo "📊 Creating database 'tradebuddy' if it doesn't exist..."
PGPASSWORD='your_db_password_here' createdb -h localhost -U postgres tradebuddy 2>/dev/null || echo "Database 'tradebuddy' already exists or creation failed"

# Run the schema setup
echo "🔧 Setting up database schema..."
PGPASSWORD='your_db_password_here' psql -h localhost -U postgres -d tradebuddy -f setup-local-db.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
    echo ""
    echo "🎉 Setup complete! You can now:"
    echo "   1. Start the backend: cd backend && npm run dev"
    echo "   2. Start the frontend: npm run dev"
    echo "   3. Access the app at: http://localhost:5173"
    echo ""
    echo "📝 Database connection details:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: tradebuddy"
    echo "   User: postgres"
    echo "   Password: your_db_password_here"
else
    echo "❌ Database setup failed. Please check the error messages above."
    exit 1
fi
