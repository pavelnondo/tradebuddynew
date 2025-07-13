# TradeBuddy Deployment Script for Windows
# This script deploys the latest version from GitHub to the VPS

$VPS_HOST = "217.151.231.249"
$VPS_USER = "root"
$PROJECT_DIR = "/root/tradebuddynew"

Write-Host "🚀 Starting TradeBuddy deployment..." -ForegroundColor Green

# SSH into VPS and perform deployment
$deployCommands = @"
echo "📁 Checking if project directory exists..."

if [ ! -d "$PROJECT_DIR" ]; then
    echo "📥 Project directory not found. Cloning from GitHub..."
    git clone https://github.com/pavelnondo/tradebuddynew.git $PROJECT_DIR
    cd $PROJECT_DIR
else
    echo "📂 Project directory found. Updating from GitHub..."
    cd $PROJECT_DIR
    git fetch origin
    git reset --hard origin/main
fi

echo "📦 Installing/updating dependencies..."

# Install backend dependencies
if [ -f "backend/package.json" ]; then
    echo "🔧 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Install frontend dependencies
if [ -f "package.json" ]; then
    echo "🎨 Installing frontend dependencies..."
    npm install
fi

echo "🏗️ Building frontend..."
npm run build

echo "🔄 Restarting services..."

# Restart backend service (assuming it's running with PM2)
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting backend with PM2..."
    pm2 restart tradebuddy-backend || pm2 start backend/index.js --name tradebuddy-backend
else
    echo "⚠️ PM2 not found. Please restart backend manually."
fi

# Restart frontend service (if using nginx or similar)
if command -v nginx &> /dev/null; then
    echo "🔄 Reloading nginx..."
    nginx -s reload
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Your TradeBuddy application should now be running with the latest updates."
"@

# Execute the deployment commands via SSH
ssh $VPS_USER@$VPS_HOST $deployCommands

Write-Host "🎉 Deployment script completed!" -ForegroundColor Green 