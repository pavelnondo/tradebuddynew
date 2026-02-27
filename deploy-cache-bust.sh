#!/bin/bash

# Ultra-Aggressive Cache-Busting Deployment Script
echo "🚀 Starting ultra-aggressive cache-busting deployment..."

# Build with fresh timestamps
echo "📦 Building with fresh timestamps..."
ssh root@217.151.231.249 "cd /root/tradebuddynew && rm -rf dist/ && npm run build"

# Deploy to web root
echo "📤 Deploying to web root..."
ssh root@217.151.231.249 "cp -r /root/tradebuddynew/dist/* /var/www/mytradebuddy.ru/ && chown -R www-data:www-data /var/www/mytradebuddy.ru/"

# Update service worker with new timestamp
echo "⚙️ Updating service worker..."
TIMESTAMP=$(date +%s)
sed -i "s/CACHE_NAME = 'tradebuddy-.*';/CACHE_NAME = 'tradebuddy-ultra-v$TIMESTAMP';/" public/sw.js
scp public/sw.js root@217.151.231.249:/var/www/mytradebuddy.ru/sw.js

# Update aggressive service worker
echo "💥 Updating aggressive service worker..."
sed -i "s/CACHE_NAME = 'tradebuddy-ultra-aggressive-v' + Date.now();/CACHE_NAME = 'tradebuddy-ultra-aggressive-v$TIMESTAMP';/" public/sw-aggressive.js
scp public/sw-aggressive.js root@217.151.231.249:/var/www/mytradebuddy.ru/sw-aggressive.js

# Restart backend to ensure it's running
echo "🔄 Restarting backend..."
ssh root@217.151.231.249 "pm2 restart tradebuddy-backend"

# Reload Nginx
echo "🌐 Reloading Nginx..."
ssh root@217.151.231.249 "systemctl reload nginx"

# Test API
echo "🧪 Testing API..."
ssh root@217.151.231.249 "curl -s http://localhost:4004/api/accounts | head -c 50"

echo "✅ Deployment complete!"
echo "🌐 Visit: https://www.mytradebuddy.ru/cache-nuclear.html"
echo "💥 Or: https://www.mytradebuddy.ru/force-cache-clear.html"





