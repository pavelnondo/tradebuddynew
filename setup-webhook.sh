#!/bin/bash

# Telegram Bot Token
BOT_TOKEN="8161307137:AAEY21iCaHb1RdLYym4A9gT5FPg6v_3VQdU"
WEBHOOK_URL="https://217.151.231.249:8443/telegram-webhook"

echo "Setting up Telegram webhook..."
echo "Webhook URL: $WEBHOOK_URL"

# Set the webhook
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$WEBHOOK_URL\"}"

echo ""
echo "Checking webhook status..."

# Check webhook status
curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"

echo ""
echo "Webhook setup complete!" 