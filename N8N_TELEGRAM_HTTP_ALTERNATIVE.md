# Telegram Polling Using HTTP Request (No Telegram Node Needed)

Since you don't have the Telegram "Get Updates" node, we'll use **HTTP Request** nodes to call Telegram API directly.

## Your Bot Token
```
7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE
```

## Step-by-Step Setup

### Step 1: Add Telegram Credential (Optional - for sending messages)

You can skip this if you only want to receive messages. For sending replies, you'll use HTTP Request with the token directly.

### Step 2: Create Workflow

#### Node 1: Schedule Trigger
- Add **Schedule Trigger**
- Set to run every **5 seconds**

#### Node 2: HTTP Request - Get Updates
- Add **HTTP Request** node
- **Method**: `GET`
- **URL**: 
  ```
  https://api.telegram.org/bot7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE/getUpdates?timeout=5&limit=10
  ```
- **Send Headers**: OFF (not needed)
- Click **Save**

#### Node 3: Code - Process Updates
- Add **Code** node
- **Mode**: Run Once for All Items
- **Code**:
```javascript
const response = $input.first().json;
const messages = [];

if (response.ok && response.result && Array.isArray(response.result)) {
  for (const update of response.result) {
    if (update.message) {
      messages.push({
        json: {
          update_id: update.update_id,
          message: update.message,
          chat_id: update.message.chat.id,
          text: update.message.text || '',
          from: update.message.from
        }
      });
    }
  }
}

return messages;
```

#### Node 4: IF - Has Message
- Add **IF** node
- **Condition**: `text` is not empty
- **Value 1**: `={{ $json.text }}`
- **Operation**: Is Not Empty

#### Node 5: HTTP Request - Send to Backend
- Add **HTTP Request** node
- **Method**: `POST`
- **URL**: `http://localhost:4001/telegram-webhook`
- **Send Headers**: ON
- **Header**: `Content-Type: application/json`
- **Send Body**: ON
- **Body Content Type**: JSON
- **Body**:
```json
{
  "message": "={{ $json.message }}"
}
```

#### Node 6: Code - Prepare Response
- Add **Code** node
- **Mode**: Run Once for Each Item
- **Code**:
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

#### Node 7: HTTP Request - Send Reply
- Add **HTTP Request** node
- **Method**: `POST`
- **URL**: 
  ```
  https://api.telegram.org/bot7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE/sendMessage
  ```
- **Send Headers**: ON
- **Header**: `Content-Type: application/json`
- **Send Body**: ON
- **Body Content Type**: JSON
- **Body**:
```json
{
  "chat_id": "={{ $json.chat_id }}",
  "text": "={{ $json.text }}"
}
```

### Step 3: Connect Nodes

```
Schedule Trigger
    ↓
Get Updates (HTTP Request)
    ↓
Process Updates (Code)
    ↓
Has Message? (IF)
    ↓ (YES)
Send to Backend (HTTP Request)
    ↓
Prepare Response (Code)
    ↓
Send Reply (HTTP Request)
```

### Step 4: Handle Update Offset (Important!)

To avoid processing the same messages repeatedly, add this after "Process Updates":

#### Node 3.5: Code - Get Last Update ID
- Add **Code** node (between Process Updates and IF)
- **Code**:
```javascript
const response = $('Get Updates').first().json;
let lastUpdateId = 0;

if (response.ok && response.result && response.result.length > 0) {
  lastUpdateId = response.result[response.result.length - 1].update_id;
}

return {
  json: {
    offset: lastUpdateId + 1
  }
};
```

Then update Node 2 (Get Updates) URL to:
```
https://api.telegram.org/bot7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE/getUpdates?timeout=5&limit=10&offset={{ $('Get Last Update ID').first().json.offset }}
```

Actually, simpler approach - use a Set node to track offset in workflow static data.

## Simpler Version (Without Offset Tracking)

For testing, you can skip offset tracking. Telegram will send you the same messages, but that's okay for testing.

## Complete Workflow Structure

```
1. Schedule Trigger (every 5s)
   ↓
2. HTTP Request: GET https://api.telegram.org/bot7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE/getUpdates?timeout=5&limit=10
   ↓
3. Code: Process Updates (extract messages)
   ↓
4. IF: Has message text?
   ↓ (YES)
5. HTTP Request: POST http://localhost:4001/telegram-webhook
   ↓
6. Code: Prepare Response
   ↓
7. HTTP Request: POST https://api.telegram.org/bot7960179486:AAH4Ny9ELbMew9YcSp6wAsNAtOouR7keLHE/sendMessage
```

## Test It

1. Save workflow
2. Activate it
3. Send message to @Upcominggamebot
4. Check executions in n8n
5. You should receive a reply!

## Why This Works

- Telegram API is just HTTP requests
- No special node needed
- Works with localhost
- Simple and reliable

Good luck! 🚀


