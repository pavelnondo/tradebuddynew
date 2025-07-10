# N8N Integration Setup Guide

This guide explains how to set up the backend to receive Telegram messages and forward them to your N8N workflow.

## Overview

The backend now includes functionality to:
1. Receive Telegram webhook messages
2. Forward all Telegram data to your N8N webhook
3. Continue with local processing (database operations, etc.)

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```bash
# N8N Webhook Configuration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/telegram

# Server Configuration
PORT=4001

# Optional: N8N Authentication (if your webhook requires it)
# N8N_API_KEY=your_n8n_api_key
```

### 2. N8N Webhook Setup

In your N8N instance:

1. **Create a Webhook Node:**
   - Add a "Webhook" node to your workflow
   - Set the webhook path to `/telegram` (or your preferred path)
   - Note the full URL (e.g., `http://localhost:5678/webhook/telegram`)

2. **Configure the Webhook:**
   - Method: POST
   - Response Mode: Respond to Webhook
   - Authentication: None (or configure as needed)

3. **Test the Webhook:**
   - Copy the webhook URL
   - Update your `.env` file with the correct URL

### 3. Backend Endpoints

The backend provides two main endpoints:

#### `/telegram-webhook` (POST)
- Receives Telegram webhook data
- Forwards data to N8N
- Processes commands locally
- Returns status including N8N forwarding result

#### `/forward-to-n8n` (POST)
- Standalone endpoint for forwarding any data to N8N
- Useful for testing or manual forwarding

### 4. Data Format

The backend forwards data to N8N in this format:

```json
{
  "source": "telegram",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    // Complete Telegram webhook data
    "update_id": 123456789,
    "message": {
      "message_id": 123,
      "from": { ... },
      "chat": { ... },
      "text": "Hello from Telegram"
    }
  }
}
```

### 5. Running the Backend

```bash
# Install dependencies
npm install

# Start the Telegram bot server
npm run telegram

# Or for development with auto-restart
npm run telegram-dev
```

### 6. Testing the Integration

Use the provided test script:

```bash
# Test N8N forwarding
node test-n8n-forwarding.js
```

Or test manually with curl:

```bash
# Test the forward-to-n8n endpoint
curl -X POST http://localhost:4001/forward-to-n8n \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"Test message"}}'

# Test the telegram webhook
curl -X POST http://localhost:4001/telegram-webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"/help","chat":{"id":123},"from":{"id":456}}}'
```

## Telegram Bot Setup

### 1. Create a Telegram Bot
1. Message @BotFather on Telegram
2. Use `/newbot` command
3. Follow instructions to create your bot
4. Save the bot token

### 2. Set Webhook URL
Set your backend webhook URL in Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://your-domain.com:4001/telegram-webhook"}'
```

### 3. Test Bot Commands
Available commands:
- `/addtrade SYMBOL TYPE ENTRY EXIT QUANTITY` - Add a trade
- `/export` - Export trades
- `/rating TRADE_ID RATING` - Rate a trade
- `/help` - Show help

## Troubleshooting

### Common Issues

1. **N8N webhook not receiving data:**
   - Check the webhook URL in your `.env` file
   - Verify N8N is running and accessible
   - Check firewall/network settings

2. **Telegram webhook not working:**
   - Verify the webhook URL is publicly accessible
   - Check if your bot token is correct
   - Ensure HTTPS is used for production

3. **Database connection errors:**
   - Check your database configuration
   - Ensure PostgreSQL is running
   - Verify connection credentials

### Logs

The backend provides detailed logging:
- N8N forwarding attempts and results
- Telegram message processing
- Database operations
- Error details

### Testing

1. **Test N8N webhook directly:**
   ```bash
   curl -X POST http://localhost:5678/webhook/telegram \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

2. **Test backend endpoints:**
   ```bash
   node test-n8n-forwarding.js
   ```

3. **Check logs:**
   - Monitor console output for detailed information
   - Look for success/error messages

## Security Considerations

1. **Webhook Security:**
   - Use HTTPS in production
   - Consider adding authentication to your N8N webhook
   - Validate incoming data

2. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use strong, unique tokens
   - Rotate tokens regularly

3. **Network Security:**
   - Restrict access to your backend endpoints
   - Use firewalls to limit incoming connections
   - Monitor for suspicious activity

## Next Steps

Once the basic integration is working:

1. **Enhance N8N Workflows:**
   - Add data processing nodes
   - Implement business logic
   - Create automated responses

2. **Add Authentication:**
   - Implement webhook authentication
   - Add rate limiting
   - Secure sensitive endpoints

3. **Monitor and Scale:**
   - Add logging and monitoring
   - Implement error handling
   - Scale for production use 