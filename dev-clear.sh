#!/bin/bash

# TradeBuddy Development Cache Clearing Script
echo "🧹 TradeBuddy Cache Clearing Script"
echo "=================================="

# Kill any existing processes on ports 3000 and 5173
echo "🔄 Killing existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true

# Clear node_modules cache
echo "🗑️  Clearing node_modules cache..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true

# Run cache clearing script
echo "⚡ Running cache busting script..."
node clear-cache.js

# Clear browser cache instructions
echo ""
echo "🌐 Browser Cache Clearing Instructions:"
echo "======================================"
echo "1. Open Chrome DevTools (F12)"
echo "2. Right-click the refresh button"
echo "3. Select 'Empty Cache and Hard Reload'"
echo "4. Or use Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)"
echo ""
echo "🔧 Alternative: Disable cache in DevTools:"
echo "1. Open DevTools (F12)"
echo "2. Go to Network tab"
echo "3. Check 'Disable cache' checkbox"
echo "4. Keep DevTools open while developing"
echo ""

echo "✅ Cache clearing complete!"
echo "🚀 You can now run: npm run dev"
