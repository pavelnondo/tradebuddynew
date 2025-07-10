#!/bin/bash

echo "🚀 Setting up Trade Buddy Telegram Integration..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Create required directories
echo "📁 Creating required directories..."
mkdir -p exports
mkdir -p uploads
mkdir -p logs

# Set up database schema
echo "🗄️ Setting up database schema..."
echo "Please run the following command manually:"
echo "psql -d your_database_name -f database-schema.sql"
echo ""

# Set up Telegram webhook
echo "🤖 Setting up Telegram webhook..."
echo "Your bot token: [REDACTED]"
echo ""

# Instructions for setting webhook
echo "📋 Next steps:"
echo "1. Start the Telegram webhook server:"
echo "   cd backend && npm run telegram"
echo ""
echo "2. Set your Telegram bot webhook URL:"
echo "   https://api.telegram.org/bot[REDACTED]/setWebhook?url=http://your-domain:4002/telegram-webhook"
echo ""
echo "3. Test the integration by sending a message to your bot"
echo ""
echo "✅ Setup complete!" 