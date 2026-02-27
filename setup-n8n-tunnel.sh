#!/bin/bash

# n8n Tunnel Setup Script for X.com OAuth
# This script helps set up a public tunnel for n8n OAuth callbacks

echo "🔧 Setting up n8n tunnel for X.com OAuth..."

# Check if ngrok is available
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok found"
    NGROK_CMD="ngrok"
elif [ -f "/tmp/ngrok" ]; then
    echo "✅ Using downloaded ngrok"
    NGROK_CMD="/tmp/ngrok"
else
    echo "❌ ngrok not found. Installing..."
    curl -o /tmp/ngrok.zip https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.zip
    unzip -o /tmp/ngrok.zip -d /tmp/
    chmod +x /tmp/ngrok
    NGROK_CMD="/tmp/ngrok"
fi

# Check if ngrok is authenticated
echo ""
echo "📋 ngrok v3 requires authentication."
echo "   If you haven't set it up yet:"
echo "   1. Sign up at https://dashboard.ngrok.com/signup"
echo "   2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken"
echo "   3. Run: $NGROK_CMD config add-authtoken YOUR_TOKEN"
echo ""

# Start ngrok tunnel
echo "🚀 Starting ngrok tunnel on port 5678..."
echo "   This will create a public URL for your n8n instance"
echo ""

# Start ngrok in background and capture URL
$NGROK_CMD http 5678 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

echo "⏳ Waiting for tunnel to establish..."
sleep 5

# Try to get the public URL from ngrok API
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PUBLIC_URL" ]; then
    echo ""
    echo "⚠️  Could not automatically get ngrok URL."
    echo "   Please check:"
    echo "   1. Open http://localhost:4040 in your browser"
    echo "   2. Copy the 'Forwarding' HTTPS URL"
    echo "   3. Use that URL in X.com Developer Portal"
    echo ""
    echo "   Or check the ngrok web interface at: http://localhost:4040"
else
    echo ""
    echo "✅ Tunnel established!"
    echo "   Public URL: $PUBLIC_URL"
    echo ""
    echo "📝 Next steps:"
    echo "   1. In X.com Developer Portal, use this callback URL:"
    echo "      $PUBLIC_URL/rest/oauth1-credential/callback"
    echo ""
    echo "   2. Set n8n environment variables:"
    echo "      export N8N_EDITOR_BASE_URL=$PUBLIC_URL"
    echo "      export WEBHOOK_URL=$PUBLIC_URL/"
    echo ""
    echo "   3. Restart n8n with these variables"
    echo ""
    echo "   To stop the tunnel, run: kill $NGROK_PID"
fi

echo ""
echo "📊 ngrok web interface: http://localhost:4040"
echo "   Logs: /tmp/ngrok.log"
echo ""


