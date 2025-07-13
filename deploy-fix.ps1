# PowerShell deployment script for Windows

Write-Host "🚀 Starting deployment fix..." -ForegroundColor Green

# 1. Build the frontend locally
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
npm run build

# 2. Upload the fixed Nginx config to server
Write-Host "🔧 Uploading fixed Nginx config..." -ForegroundColor Yellow
scp nginx-config-fixed.txt root@mytradebuddy.ru:/etc/nginx/sites-available/mytradebuddy.ru

# 3. Upload the built frontend
Write-Host "📤 Uploading frontend files..." -ForegroundColor Yellow
scp -r dist/* root@mytradebuddy.ru:/root/tradebuddynew/public/

# 4. SSH into server and restart Nginx
Write-Host "🔄 Restarting Nginx..." -ForegroundColor Yellow
ssh root@mytradebuddy.ru @"
    # Test Nginx config
    nginx -t
    
    if [ \$? -eq 0 ]; then
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
"@

Write-Host "✅ Deployment fix completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Test your application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://mytradebuddy.ru" -ForegroundColor White
Write-Host "   API: http://mytradebuddy.ru/api/trades" -ForegroundColor White 