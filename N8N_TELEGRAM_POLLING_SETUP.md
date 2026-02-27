# n8n Telegram Polling Workflow Setup

## Overview

This workflow polls Telegram for new messages, sends them to your backend for processing, and sends the response back to Telegram.

## Workflow Flow

1. **Schedule Trigger** - Runs every 5 seconds
2. **Get Telegram Updates** - Polls Telegram API for new messages
3. **Process Updates** - Extracts messages from updates
4. **Has Message?** - Checks if there's a message to process
5. **Send to Backend** - Forwards message to your backend API
6. **Prepare Response** - Formats the backend response
7. **Send Reply to Telegram** - Sends response back to user

## Setup Steps

### 1. Add Telegram Credentials in n8n

1. Go to **Settings** → **Credentials**
2. Click **Add Credential**
3. Search for **"Telegram"**
4. Select **"Telegram API"**
5. Enter your **Bot Token** (get it from @BotFather on Telegram)
6. Save the credential

### 2. Create the Workflow

#### Option A: Import the JSON (Easiest)

1. In n8n, click **Workflows** → **Import from File**
2. Select `n8n-telegram-polling-workflow.json`
3. Update the credential IDs in the workflow nodes

#### Option B: Build Manually

Follow these steps:

**Step 1: Schedule Trigger**
- Add **Schedule Trigger** node
- Set to run every **5 seconds** (or your preferred interval)

**Step 2: Get Telegram Updates**
- Add **Telegram** node
- Operation: **Get Updates**
- Select your Telegram credential
- Timeout: **5** seconds
- Limit: **10** messages

**Step 3: Process Updates (Code Node)**
- Add **Code** node
- Use this code:
```javascript
// Process each update from Telegram
const updates = $input.all();
const messages = [];

for (const update of updates) {
  if (update.json.result && Array.isArray(update.json.result)) {
    for (const item of update.json.result) {
      if (item.message) {
        messages.push({
          json: {
            update_id: item.update_id,
            message: item.message,
            chat_id: item.message.chat.id,
            text: item.message.text || '',
            from: item.message.from,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }
}

return messages;
```

**Step 4: Check Has Message**
- Add **IF** node
- Condition: `text` is not empty

**Step 5: Send to Backend**
- Add **HTTP Request** node
- Method: **POST**
- URL: `http://localhost:4001/telegram-webhook`
- Headers: `Content-Type: application/json`
- Body: 
  ```json
  {
    "message": "={{ $json.message }}"
  }
  ```

**Step 6: Prepare Response (Code Node)**
- Add **Code** node
- Use this code:
```javascript
// Extract response from backend or create default response
const backendResponse = $input.first().json;
const message = $('Process Updates').first().json.message;

let replyText = '✅ Message received!';

// Check if backend returned a response
if (backendResponse && backendResponse.message) {
  replyText = backendResponse.message;
} else if (backendResponse && backendResponse.reply) {
  replyText = backendResponse.reply;
} else if (backendResponse && backendResponse.text) {
  replyText = backendResponse.text;
}

return {
  json: {
    chat_id: message.chat.id,
    text: replyText,
    original_message: message.text
  }
};
```

**Step 7: Send Reply to Telegram**
- Add **Telegram** node
- Operation: **Send Message**
- Chat ID: `={{ $json.chat_id }}`
- Text: `={{ $json.text }}`
- Select your Telegram credential

**Step 8: Acknowledge Update (Optional)**
- Add **Telegram** node (for the "no message" path)
- Operation: **Get Updates**
- Offset: `={{ $json.update_id + 1 }}`
- This marks the update as processed

### 3. Connect the Nodes

Connect them in this order:
1. Schedule Trigger → Get Telegram Updates
2. Get Telegram Updates → Process Updates
3. Process Updates → Has Message?
4. Has Message? (YES) → Send to Backend
5. Send to Backend → Prepare Response
6. Prepare Response → Send Reply to Telegram
7. Has Message? (NO) → Acknowledge Update

### 4. Activate the Workflow

1. Click **Save** in the workflow
2. Toggle **Active** switch (top right)
3. The workflow will start polling Telegram

## How It Works

1. **Every 5 seconds**, n8n polls Telegram for new messages
2. **New messages** are extracted and sent to your backend at `http://localhost:4001/telegram-webhook`
3. **Backend processes** the message (can do AI processing, database operations, etc.)
4. **Response** is sent back to Telegram user

## Backend Response Format

Your backend should return one of these formats:

```json
{
  "message": "Your reply text here"
}
```

OR

```json
{
  "reply": "Your reply text here"
}
```

OR

```json
{
  "text": "Your reply text here"
}
```

## Testing

1. **Send a message** to your Telegram bot
2. **Check n8n execution** - you should see the workflow run
3. **Check backend logs** - message should be received
4. **Check Telegram** - you should receive a reply

## Troubleshooting

### No messages received?
- Check if your backend is running on port 4001
- Check Telegram bot token is correct
- Verify workflow is **Active**

### Messages not being processed?
- Check the "Process Updates" code node output
- Verify backend endpoint is accessible
- Check backend logs for errors

### No reply sent?
- Check "Prepare Response" code node output
- Verify Telegram Send Message node has correct chat_id
- Check Telegram credential is valid

## Advanced: Process Messages Directly in n8n

If you want to process messages directly in n8n without the backend:

1. Replace "Send to Backend" node with your processing logic
2. Add nodes for:
   - AI processing
   - Database queries
   - Business logic
3. Connect to "Prepare Response" node

## Polling Interval

- **5 seconds**: Good for testing, responsive
- **10 seconds**: Balanced, less API calls
- **30 seconds**: Lower API usage, slower response

Adjust in the Schedule Trigger node.


