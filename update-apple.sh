#!/bin/bash

echo "Updating existing TradeBuddy to Apple-inspired design..."

# Navigate to existing project
cd /var/www/mytradebuddy.com

# Pull latest changes
git pull origin main

# Update backend
cd backend
npm install
cp ../tradebuddynew/backend/app.js .
cp ../tradebuddynew/backend/database-schema-apple.sql .

# Update frontend
cd ..
npm install
npm run build

# Restart services
pm2 restart all

echo "Update completed! Your TradeBuddy now has Apple-inspired design!"
