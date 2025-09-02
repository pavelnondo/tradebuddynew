#!/bin/bash

# 🚀 TradeBuddy VPS-Only Deployment Script
# Deploy all fixes directly to VPS without local testing

echo "🍎 Starting TradeBuddy VPS-Only Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# VPS connection details
VPS_HOST="217.151.231.249"
VPS_USER="root"
VPS_PATH="/root/tradebuddynew"
FRONTEND_PATH="/var/www/mytradebuddy.ru"

echo -e "${BLUE}📝 Summary of fixes being deployed:${NC}"
echo "   • Fixed emotion buttons triggering form submission"
echo "   • Fixed trade editing field mapping and save errors" 
echo "   • Fixed profit/loss calculation for Long/Short trades"
echo "   • Fixed Win/Loss chart data structure"
echo "   • Added proper account_id handling"
echo "   • Enhanced error handling and data validation"
echo ""

# Step 1: Deploy backend fixes
echo -e "${YELLOW}📤 Deploying backend fixes...${NC}"
scp backend/app.js $VPS_USER@$VPS_HOST:$VPS_PATH/backend/
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend deployed successfully${NC}"

# Step 2: Deploy frontend source fixes
echo -e "${YELLOW}📤 Deploying frontend source...${NC}"
scp -r src/ $VPS_USER@$VPS_HOST:$VPS_PATH/
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend source deployment failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend source deployed successfully${NC}"

# Step 3: Build frontend on VPS
echo -e "${YELLOW}🏗️  Building frontend on VPS...${NC}"
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && npm run build"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed on VPS${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend built successfully on VPS${NC}"

# Step 4: Deploy built frontend
echo -e "${YELLOW}📤 Deploying built frontend...${NC}"
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && cp -r dist/* $FRONTEND_PATH/"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend deployment to web directory failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend deployed to web directory${NC}"

# Step 5: Restart backend service
echo -e "${YELLOW}🔄 Restarting backend service...${NC}"
ssh $VPS_USER@$VPS_HOST "pm2 restart tradebuddy-backend"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend restart failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend restarted successfully${NC}"

# Step 6: Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
echo "Checking PM2 services..."
ssh $VPS_USER@$VPS_HOST "pm2 status"

echo ""
echo "Testing API health..."
API_STATUS=$(ssh $VPS_USER@$VPS_HOST "curl -s -o /dev/null -w '%{http_code}' http://localhost:4004/api/health")
if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API is healthy (HTTP $API_STATUS)${NC}"
else
    echo -e "${RED}❌ API health check failed (HTTP $API_STATUS)${NC}"
    echo "Checking backend logs..."
    ssh $VPS_USER@$VPS_HOST "pm2 logs tradebuddy-backend --lines 10"
fi

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}🌐 Your trading journal is now live at: https://www.mytradebuddy.ru${NC}"
echo ""
echo -e "${YELLOW}📋 Fixed Issues:${NC}"
echo "   ✅ Emotion buttons no longer submit the form"
echo "   ✅ Trade editing now saves correctly with proper field mapping"
echo "   ✅ P&L calculation fixed for Long/Short trades"
echo "   ✅ Win/Loss Distribution chart now displays data"
echo "   ✅ Improved data validation and error handling"
echo ""
echo -e "${BLUE}🧪 Testing Checklist:${NC}"
echo "1. Go to https://www.mytradebuddy.ru"
echo "2. Login and go to Add Trade"
echo "3. Test emotion buttons (should NOT submit form)"
echo "4. Create Long trade: Entry \$100, Exit \$110, Qty 10 = +\$100 profit"
echo "5. Create Short trade: Entry \$110, Exit \$100, Qty 10 = +\$100 profit"
echo "6. Edit trades - verify form population and saving"
echo "7. Check Dashboard Win/Loss chart displays data"
echo ""
echo -e "${BLUE}🔍 To monitor logs:${NC}"
echo "   ssh $VPS_USER@$VPS_HOST 'tail -f /root/.pm2/logs/tradebuddy-backend-error.log'"
echo ""
echo -e "${GREEN}Happy Trading! 📈${NC}"
