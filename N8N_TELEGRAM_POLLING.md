# Using Telegram Polling in n8n (No HTTPS Required)

## Problem
Telegram webhooks require HTTPS URLs, but you're running n8n locally on `localhost`.

## Solution: Use Telegram Polling

Instead of using a **Telegram Trigger** (webhook), use **Telegram Polling**.

### Steps:

1. **In your n8n workflow:**
   - Remove or disable the "Telegram Trigger" node
   - Add a **"Schedule Trigger"** node instead
   - Set it to run every few seconds (e.g., every 5-10 seconds)

2. **Add a Telegram node:**
   - Add a **"Telegram"** node (not "Telegram Trigger")
   - Operation: **"Get Updates"** or **"Get Updates (Long Polling)"**
   - This will poll Telegram for new messages instead of using webhooks

3. **Configure the Telegram node:**
   - Select your Telegram bot credentials
   - Set polling interval (how often to check for messages)
   - Connect it to process incoming messages

### Alternative: Use a Simple Tunnel

If you specifically need webhooks, you can set up a minimal tunnel just for the webhook URL:

```bash
# Start a tunnel just for webhooks
npx -y localtunnel --port 5678
```

Then use the HTTPS URL it provides in your Telegram Trigger configuration.

## Recommendation

For local development, **polling is simpler** - no tunnel needed, no public URL required!


