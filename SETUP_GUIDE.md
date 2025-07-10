# Trade Buddy Mobile Setup Guide

## Overview
This guide will help you set up the Telegram bot integration for mobile trading features using n8n and your existing Trade Buddy application.

## Prerequisites
- Node.js and npm installed
- PostgreSQL database running
- n8n instance (local or cloud)
- Telegram account

## Step 1: Install Dependencies

### Backend Dependencies
```bash
cd backend
npm install csv-parser csv-writer multer
```

### Create Required Directories
```bash
mkdir -p backend/exports
mkdir -p backend/uploads
```

## Step 2: Telegram Bot Setup

### 1. Create Telegram Bot
1. Open Telegram and search for "@BotFather"
2. Send `/newbot` command
3. Follow the prompts to create your bot
4. Save the bot token (you'll need this for n8n)

### 2. Get Your Chat ID
1. Start a conversation with your bot
2. Send any message to the bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find your `chat_id` in the response

## Step 3: n8n Setup

### 1. Install n8n (if not already installed)
```bash
npm install -g n8n
```

### 2. Start n8n
```bash
n8n start
```

### 3. Import Workflow
1. Open n8n in your browser (usually http://localhost:5678)
2. Go to Workflows → Import from File
3. Import the `n8n-workflow.json` file

### 4. Configure Environment Variables
In n8n, set these environment variables:
- `TELEGRAM_BOT_TOKEN`: Your bot token from Step 2

### 5. Set Webhook URL
1. In your Telegram bot workflow, copy the webhook URL
2. Set it as your bot's webhook:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_N8N_WEBHOOK_URL>
   ```

## Step 4: Backend Setup

### 1. Start the Telegram Bot Server
```bash
cd backend
node telegram-bot.js
```

### 2. Start the Main Backend
```bash
cd backend
node index.js
```

### 3. Start the Frontend
```bash
npm run dev
```

## Step 5: Testing the Integration

### Test Commands
Send these messages to your Telegram bot:

1. **Help Command**
   ```
   /help
   ```

2. **Add Trade**
   ```
   /addtrade AAPL LONG 150.50 155.00 100
   ```

3. **Export Trades**
   ```
   /export
   ```

4. **Rate Trade**
   ```
   /rating 1 A
   ```

5. **Voice Message**
   - Send a voice message saying: "Bought 100 shares of AAPL at 150.50, sold at 155.00"

6. **CSV Upload**
   - Send a CSV file with trade data

## Step 6: Advanced Features

### Voice-to-Text Integration
To enable voice-to-text processing:

1. **Option A: OpenAI Whisper**
   ```bash
   npm install openai
   ```
   
   Add to your environment variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

2. **Option B: Google Speech-to-Text**
   ```bash
   npm install @google-cloud/speech
   ```

### AI Analysis Enhancement
To improve AI analysis:

1. **OpenAI Integration**
   ```bash
   npm install openai
   ```

2. **Configure AI Service**
   Update `ai-analysis.js` with your API keys

## Step 7: Security Considerations

### 1. Environment Variables
Create a `.env` file in the backend directory:
```env
# Database
DATABASE_URL=your_database_url

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# AI Services (optional)
OPENAI_API_KEY=your_openai_key
GOOGLE_APPLICATION_CREDENTIALS=path_to_credentials.json

# Security
JWT_SECRET=your_jwt_secret
```

### 2. Rate Limiting
Consider implementing rate limiting for the webhook endpoint.

### 3. Authentication
Add user authentication to restrict bot access to authorized users only.

## Step 8: Monitoring and Logs

### 1. Enable Logging
The backend servers log all activities. Monitor:
- `backend/index.js` logs
- `backend/telegram-bot.js` logs
- n8n execution logs

### 2. Error Handling
Check for common errors:
- Database connection issues
- Invalid trade data
- File upload problems
- API rate limits

## Step 9: Production Deployment

### 1. Environment Setup
- Use production database
- Set up proper SSL certificates
- Configure firewall rules

### 2. n8n Production
- Use n8n cloud or self-hosted with proper SSL
- Set up webhook authentication
- Configure backup strategies

### 3. Backend Production
- Use PM2 or similar process manager
- Set up monitoring and alerts
- Configure automatic restarts

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Messages**
   - Check n8n webhook URL is accessible
   - Verify bot token is correct
   - Check firewall settings

2. **Database Connection Errors**
   - Verify database credentials
   - Check database is running
   - Ensure proper permissions

3. **CSV Import/Export Issues**
   - Check file permissions
   - Verify CSV format
   - Ensure required columns exist

4. **Voice Processing Not Working**
   - Check API keys are set
   - Verify audio format support
   - Check API quotas

### Debug Commands

```bash
# Check bot status
curl https://api.telegram.org/bot<TOKEN>/getMe

# Check webhook status
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Test database connection
psql -h localhost -U username -d database_name -c "SELECT 1;"
```

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify all environment variables are set
3. Test each component individually
4. Review the n8n workflow execution

## Next Steps

Once basic functionality is working:

1. **Customize Commands**: Add more trading-specific commands
2. **Enhance AI**: Improve voice analysis and suggestions
3. **Add Notifications**: Set up price alerts and trade reminders
4. **Integrate More Services**: Add chart analysis, news feeds, etc.
5. **Mobile App**: Consider building a native mobile app

## File Structure

```
trade-connect-1/
├── backend/
│   ├── index.js                 # Main API server
│   ├── telegram-bot.js          # Telegram webhook handler
│   ├── ai-analysis.js           # AI analysis service
│   ├── csv-handler.js           # CSV import/export
│   └── exports/                 # CSV export directory
├── n8n-workflow.json            # n8n workflow configuration
├── SETUP_GUIDE.md              # This guide
└── src/                        # Frontend code
```

## Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `/help` | Show available commands | `/help` |
| `/addtrade` | Add a new trade | `/addtrade AAPL LONG 150.50 155.00 100` |
| `/export` | Export trades to CSV | `/export` |
| `/rating` | Rate a trade (A-D) | `/rating 1 A` |
| Voice Message | Voice-to-text trade entry | Send voice message |
| CSV File | Import trades from CSV | Send CSV file |

## Environment Variables Summary

```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/db
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Optional (for AI features)
OPENAI_API_KEY=sk-...
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# Security
JWT_SECRET=your-secret-key
NODE_ENV=production
``` 