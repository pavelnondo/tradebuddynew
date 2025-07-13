#!/bin/bash

echo "🚀 Starting deployment fix..."

# 1. Build the frontend locally
echo "📦 Building frontend..."
npm run build

# 2. Upload the fixed Nginx config to server
echo "🔧 Uploading fixed Nginx config..."
scp nginx-config-fixed.txt root@mytradebuddy.ru:/etc/nginx/sites-available/mytradebuddy.ru

# 3. Upload the built frontend
echo "📤 Uploading frontend files..."
scp -r dist/* root@mytradebuddy.ru:/root/tradebuddynew/public/

# 4. SSH into server and restart Nginx
echo "🔄 Restarting Nginx..."
ssh root@mytradebuddy.ru << 'EOF'
    # Test Nginx config
    nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx config is valid"
        systemctl reload nginx
        echo "✅ Nginx reloaded successfully"
    else
        echo "❌ Nginx config has errors"
        exit 1
    fi
    
    # Test the API endpoint
    echo "🧪 Testing API endpoint..."
    curl -s http://localhost/api/trades | head -c 100
    echo ""
EOF

echo "✅ Deployment fix completed!"
echo ""
echo "🔍 Test your application:"
echo "   Frontend: http://mytradebuddy.ru"
echo "   API: http://mytradebuddy.ru/api/trades" 