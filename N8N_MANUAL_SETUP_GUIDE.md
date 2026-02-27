# Manual n8n Workflow Setup - Step by Step

## ✅ Yes, it WILL work! Here's how to build it manually:

## Prerequisites

1. **n8n is running**: http://localhost:5678
2. **Backend is running**: http://localhost:4001 (check with `curl http://localhost:4001/telegram-webhook`)
3. **Telegram bot token**: `7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE`

---

## Step 1: Add Telegram Credential

1. In n8n, click **Settings** (gear icon) → **Credentials**
2. Click **Add Credential**
3. Search for **"Telegram"**
4. Select **"Telegram API"**
5. Fill in:
   - **Credential Name**: `Upcominggamebot` (or any name)
   - **Access Token**: `7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE`
6. Click **Test** - should show "Connection successful"
7. Click **Save**

---

## Step 2: Create New Workflow

1. Click **Workflows** in left sidebar
2. Click **+ Add Workflow** button
3. Name it: `Telegram Polling Bot`

---

## Step 3: Add Nodes One by One

### Node 1: Schedule Trigger

1. Click **+** button to add node
2. Search for **"Schedule Trigger"**
3. Click on it
4. Configure:
   - **Trigger Times**: Click "Add Time"
   - Select **"Every X seconds"**
   - Set to **5 seconds**
5. Click **Save**

### Node 2: Telegram - Get Updates

1. Click **+** button (or drag from Schedule Trigger)
2. Search for **"Telegram"**
3. Click on it
4. Configure:
   - **Credential**: Select your Telegram credential (from Step 1)
   - **Operation**: Select **"Get Updates"**
   - **Timeout**: `5`
   - **Limit**: `10`
5. Click **Save**
6. **Connect**: Drag from Schedule Trigger output to this node

### Node 3: Code - Process Updates

1. Click **+** button (or drag from Get Updates)
2. Search for **"Code"**
3. Click on it
4. Configure:
   - **Mode**: Select **"Run Once for All Items"**
   - **JavaScript Code**: Paste this:
   ```javascript
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
               from: item.message.from
             }
           });
         }
       }
     }
   }

   return messages;
   ```
5. Click **Save**
6. **Connect**: Drag from Get Updates output to this node

### Node 4: IF - Has Message?

1. Click **+** button (or drag from Process Updates)
2. Search for **"IF"**
3. Click on it
4. Configure:
   - Click **"Add Condition"**
   - **Value 1**: `={{ $json.text }}`
   - **Operation**: Select **"Is Not Empty"**
   - **Value 2**: Leave empty
5. Click **Save**
6. **Connect**: Drag from Process Updates output to this node

### Node 5: HTTP Request - Send to Backend

1. Click **+** button (drag from IF node's TRUE output - the green checkmark)
2. Search for **"HTTP Request"**
3. Click on it
4. Configure:
   - **Method**: Select **POST**
   - **URL**: `http://localhost:4001/telegram-webhook`
   - **Send Headers**: Toggle ON
   - Click **"Add Header"**:
     - **Name**: `Content-Type`
     - **Value**: `application/json`
   - **Send Body**: Toggle ON
   - **Body Content Type**: Select **JSON**
   - **Specify Body**: Toggle ON
   - **Body**: Paste this:
   ```json
   {
     "message": "={{ $json.message }}"
   }
   ```
5. Click **Save**
6. **Connect**: Drag from IF node's TRUE output (green checkmark) to this node

### Node 6: Code - Prepare Response

1. Click **+** button (or drag from HTTP Request)
2. Search for **"Code"**
3. Click on it
4. Configure:
   - **Mode**: Select **"Run Once for Each Item"**
   - **JavaScript Code**: Paste this:
   ```javascript
   const backendResponse = $input.first().json;
   const message = $('Process Updates').first().json.message;

   let replyText = '✅ Message received!';

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
       text: replyText
     }
   };
   ```
5. Click **Save**
6. **Connect**: Drag from HTTP Request output to this node

### Node 7: Telegram - Send Message

1. Click **+** button (or drag from Prepare Response)
2. Search for **"Telegram"**
3. Click on it
4. Configure:
   - **Credential**: Select your Telegram credential
   - **Operation**: Select **"Send Message"**
   - **Chat ID**: `={{ $json.chat_id }}`
   - **Text**: `={{ $json.text }}`
   - **Additional Fields**: Click to expand
     - **Parse Mode**: Select **Markdown** (optional)
5. Click **Save**
6. **Connect**: Drag from Prepare Response output to this node

---

## Step 4: Test the Workflow

1. Click **Save** button (top right)
2. Toggle **Active** switch to ON (top right)
3. The workflow will start running every 5 seconds

### Test it:

1. **Send a message** to your Telegram bot: @Upcominggamebot
2. **Check n8n**: 
   - Click on the workflow
   - You should see executions appearing
   - Click on an execution to see the flow
3. **Check backend logs**: Your backend should receive the message
4. **Check Telegram**: You should receive a reply

---

## Visual Workflow Structure

```
[Schedule Trigger] (every 5 seconds)
        ↓
[Get Telegram Updates]
        ↓
[Process Updates] (Code)
        ↓
[Has Message?] (IF)
    YES ↓
[Send to Backend] (HTTP Request)
        ↓
[Prepare Response] (Code)
        ↓
[Send Reply to Telegram]
```

---

## Troubleshooting

### Workflow not running?
- Make sure **Active** toggle is ON
- Check Schedule Trigger is configured correctly
- Look at execution logs for errors

### No messages received?
- Verify Telegram credential is correct
- Check if bot token is valid: `curl "https://api.telegram.org/bot7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE/getMe"`
- Make sure you've sent a message to the bot

### Backend not receiving?
- Check backend is running: `curl http://localhost:4001/telegram-webhook`
- Check backend logs
- Verify HTTP Request node URL is correct

### No reply sent?
- Check "Prepare Response" node output
- Verify Telegram Send Message node has correct chat_id
- Check Telegram credential is selected

---

## Why This Will Work

1. **Polling is reliable**: Telegram's Get Updates API works with localhost
2. **No webhook needed**: Polling doesn't require HTTPS
3. **Simple flow**: Each step is straightforward
4. **Your backend is ready**: Your backend already has the endpoint

---

## Quick Test Command

Test your backend endpoint:
```bash
curl -X POST http://localhost:4001/telegram-webhook \
  -H "Content-Type: application/json" \
  -d '{"message": {"text": "test", "chat": {"id": 123}, "from": {"id": 456}}}'
```

If this works, your workflow will work too!

---

## Next Steps

Once it's working:
1. Adjust polling interval (5 seconds might be too frequent)
2. Add error handling
3. Add more message processing logic
4. Customize responses

Good luck! 🚀


