# n8n Integration Guide

## Overview
This document explains how to integrate your n8n workflow with the Trade Buddy Telegram bot backend.

## Webhook Configuration

### Backend Webhook URL
```
[REDACTED]
```

### Bot Token
```
[REDACTED]
```

## Expected Input Format

The backend will send the following JSON structure to your n8n webhook:

```json
{
  "type": "voice_message|text_message|command|document_upload",
  "raw_message": "Original message text",
  "voice": {
    "file_id": "voice_file_id",
    "duration": 15,
    "mime_type": "audio/ogg"
  },
  "document": {
    "file_id": "document_file_id",
    "file_name": "trades.csv",
    "mime_type": "text/csv"
  },
  "chat_id": 123456789,
  "user_id": 987654321,
  "username": "trader_username",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "processing_id": "uuid-here"
}
```

## Message Types

### 1. Voice Message
```json
{
  "type": "voice_message",
  "voice": {
    "file_id": "AwACAgIAAxkBAAIB...",
    "duration": 12,
    "mime_type": "audio/ogg"
  },
  "chat_id": 123456789,
  "processing_id": "uuid-here"
}
```

### 2. Text Message
```json
{
  "type": "text_message",
  "raw_message": "Bought 100 shares of AAPL at 150.50, feeling confident",
  "chat_id": 123456789,
  "processing_id": "uuid-here"
}
```

### 3. Command
```json
{
  "type": "command",
  "raw_message": "/addtrade AAPL LONG 150.50 155.00 100",
  "chat_id": 123456789,
  "processing_id": "uuid-here"
}
```

### 4. Document Upload
```json
{
  "type": "document_upload",
  "document": {
    "file_id": "BQACAgIAAxkBAAIB...",
    "file_name": "trades.csv",
    "mime_type": "text/csv"
  },
  "chat_id": 123456789,
  "processing_id": "uuid-here"
}
```

## Expected Output Format

Your n8n workflow should return the following JSON structure:

```json
{
  "success": true,
  "processing_id": "uuid-here",
  "message": "✅ Trade uploaded! A+ setup",
  "trade_data": {
    "symbol": "AAPL",
    "type": "LONG",
    "entry_price": 150.50,
    "exit_price": 155.00,
    "quantity": 100,
    "entry_time": "2024-01-15T09:30:00Z",
    "exit_time": "2024-01-15T15:30:00Z",
    "pnl": 450.00,
    "notes": "Breakout trade on earnings",
    "emotion": "Confident",
    "setup": "Breakout",
    "execution_quality": "A",
    "duration": "6h"
  },
  "ai_analysis": {
    "sentiment": "positive",
    "confidence": "high",
    "suggested_rating": "A",
    "recommendations": [
      "Good entry point",
      "Consider setting stop loss at $148",
      "Strong technical setup"
    ],
    "voice_transcript": "Bought 100 shares of AAPL at 150.50, feeling confident about this trade"
  }
}
```

## Error Response Format

If processing fails, return:

```json
{
  "success": false,
  "processing_id": "uuid-here",
  "message": "❌ Could not process your message. Please try again.",
  "error": "Description of the error"
}
```

## Processing Guidelines

### Voice Messages
1. **Download voice file** using Telegram API
2. **Convert to text** using speech-to-text service
3. **Extract trade data** from transcript
4. **Analyze sentiment** and confidence
5. **Generate recommendations**

### Text Messages
1. **Parse trade information** from text
2. **Validate data** completeness
3. **Analyze sentiment** and emotion
4. **Suggest rating** based on content

### Commands
1. **Parse command** structure
2. **Extract parameters** (symbol, type, prices, quantity)
3. **Validate data** format
4. **Calculate P&L** if not provided

### Document Uploads
1. **Download CSV file** using Telegram API
2. **Parse CSV content**
3. **Validate data** format
4. **Process multiple trades** if present
5. **Generate summary** of imported trades

## AI Analysis Fields

### Sentiment
- `positive` - Optimistic about the trade
- `negative` - Pessimistic or worried
- `neutral` - Balanced or uncertain

### Confidence
- `high` - Very confident in the trade
- `medium` - Moderately confident
- `low` - Uncertain or hesitant

### Suggested Rating
- `A` - Excellent setup and execution
- `B` - Good setup with minor issues
- `C` - Fair setup with some concerns
- `D` - Poor setup or execution

### Recommendations
Array of actionable suggestions:
- Risk management advice
- Entry/exit timing suggestions
- Technical analysis insights
- Psychology tips

## Example n8n Workflow Steps

1. **Webhook Trigger** - Receive data from backend
2. **Switch** - Route based on message type
3. **HTTP Request** - Download files from Telegram
4. **AI Processing** - Speech-to-text, sentiment analysis
5. **Data Extraction** - Parse trade information
6. **Validation** - Check data completeness
7. **Response** - Return structured data

## Testing

### Test Voice Message
Send a voice message saying: "Bought 50 shares of TSLA at 250, feeling confident about this trade"

Expected response:
```json
{
  "success": true,
  "message": "✅ Trade uploaded! A+ setup",
  "trade_data": {
    "symbol": "TSLA",
    "type": "LONG",
    "entry_price": 250.00,
    "quantity": 50,
    "emotion": "Confident"
  },
  "ai_analysis": {
    "sentiment": "positive",
    "confidence": "high",
    "suggested_rating": "A"
  }
}
```

### Test Text Message
Send: "Sold 100 AAPL at 155, made good profit"

Expected response:
```json
{
  "success": true,
  "message": "✅ Trade uploaded! Great profit!",
  "trade_data": {
    "symbol": "AAPL",
    "type": "SHORT",
    "exit_price": 155.00,
    "quantity": 100
  }
}
```

## Error Handling

### Common Errors
1. **Invalid file format** - Return error for unsupported file types
2. **Incomplete data** - Ask for missing information
3. **Processing timeout** - Handle long processing times
4. **API limits** - Handle rate limiting gracefully

### Error Response Examples
```json
{
  "success": false,
  "message": "❌ Could not understand your voice message. Please try again.",
  "error": "speech_recognition_failed"
}
```

```json
{
  "success": false,
  "message": "❌ Missing trade information. Please provide symbol, type, and price.",
  "error": "incomplete_trade_data"
}
```

## Performance Considerations

1. **Response Time** - Keep under 30 seconds
2. **File Size** - Handle large voice files efficiently
3. **Rate Limiting** - Respect API limits
4. **Caching** - Cache common responses
5. **Error Recovery** - Implement retry logic

## Security

1. **Validate Input** - Sanitize all incoming data
2. **Rate Limiting** - Prevent abuse
3. **Authentication** - Verify message sources
4. **Data Privacy** - Handle sensitive information securely 