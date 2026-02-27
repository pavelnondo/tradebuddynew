# Telegram Bot Polling Setup

## Your Bot Token
```
7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE
```

## Step-by-Step Setup

### Step 1: Add Telegram Credential in n8n

1. Open n8n: http://localhost:5678
2. Go to **Settings** (gear icon) → **Credentials**
3. Click **Add Credential**
4. Search for **"Telegram"**
5. Select **"Telegram API"**
6. Fill in:
   - **Credential Name**: `Telegram Bot 7960179486` (or any name you prefer)
   - **Access Token**: `7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE`
7. Click **Test** to verify it works
8. Click **Save**

### Step 2: Import or Create Workflow

#### Option A: Import Workflow (Easiest)

1. In n8n, go to **Workflows**
2. Click **Import from File**
3. Select `n8n-telegram-polling-workflow.json`
4. After importing, you'll need to:
   - Click on each **Telegram** node (Get Telegram Updates, Send Reply, Acknowledge Update)
   - Select your credential from the dropdown
   - Save the workflow

#### Option B: Create Manually

Follow the guide in `N8N_TELEGRAM_POLLING_SETUP.md`

### Step 3: Configure Telegram Nodes

After importing, update these nodes to use your credential:

1. **Get Telegram Updates** node:
   - Click on it
   - In "Credential" dropdown, select your Telegram credential
   - Save

2. **Send Reply to Telegram** node:
   - Click on it
   - In "Credential" dropdown, select your Telegram credential
   - Save

3. **Acknowledge Update** node:
   - Click on it
   - In "Credential" dropdown, select your Telegram credential
   - Save

### Step 4: Activate Workflow

1. Click **Save** button (top right)
2. Toggle the **Active** switch (top right) to ON
3. The workflow will start polling every 5 seconds

### Step 5: Test

1. Send a message to your Telegram bot
2. Check n8n executions - you should see the workflow running
3. Check if message is sent to backend at `http://localhost:4001/telegram-webhook`
4. You should receive a reply in Telegram

## Workflow Flow

```
Every 5 seconds
    ↓
Get Telegram Updates (using your bot token)
    ↓
Process Messages
    ↓
Send to Backend (http://localhost:4001/telegram-webhook)
    ↓
Prepare Response
    ↓
Send Reply to Telegram (using your bot token)
```

## Backend Configuration

Make sure your backend is running and accessible at:
- **URL**: `http://localhost:4001/telegram-webhook`
- **Method**: POST
- **Expected Body**: 
  ```json
  {
    "message": {
      "message_id": 123,
      "chat": { "id": 123456789 },
      "text": "Hello",
      "from": { ... }
    }
  }
  ```
- **Response Format**:
  ```json
  {
    "message": "Your reply here"
  }
  ```

## Troubleshooting

### Bot not responding?
- Check if workflow is **Active** (toggle switch ON)
- Verify credential is correctly set in all Telegram nodes
- Check n8n execution logs for errors

### Messages not reaching backend?
- Verify backend is running: `curl http://localhost:4001/telegram-webhook`
- Check backend logs
- Verify HTTP Request node URL is correct

### No reply sent?
- Check "Prepare Response" node output
- Verify Telegram Send Message node has correct chat_id
- Check Telegram credential is valid

## Quick Test

Test your bot token directly:
```bash
curl "https://api.telegram.org/bot7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE/getMe"
```

Should return bot information if token is valid.


