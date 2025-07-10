const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool();

// N8N webhook URL - configure this in your .env file
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/telegram';

// Function to forward message to N8N and get processed response
async function forwardToN8N(telegramData) {
  try {
    console.log('Forwarding to N8N webhook:', N8N_WEBHOOK_URL);
    
    const response = await axios.post(N8N_WEBHOOK_URL, {
      source: 'telegram',
      timestamp: new Date().toISOString(),
      data: telegramData
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Trade-Buddy-Backend/1.0'
      },
      timeout: 30000, // 30 second timeout for AI processing
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false // Allow self-signed certificates
      })
    });
    
    console.log('Successfully received response from N8N:', response.status);
    
    // Check if N8N returned processed data
    if (response.data && response.data.success) {
      console.log('N8N processed data:', response.data);
      return { 
        success: true, 
        status: response.status,
        processedData: response.data 
      };
    } else {
      console.log('N8N returned basic response, no processed data');
      return { success: true, status: response.status };
    }
  } catch (error) {
    console.error('Error forwarding to N8N:', error.message);
    return { success: false, error: error.message };
  }
}

// Telegram Bot Webhook Handler
app.post('/telegram-webhook', async (req, res) => {
  try {
    const { message, voice, document } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'No message received' });
    }

    const chatId = message.chat.id;
    const text = message.text || '';
    const userId = message.from.id;
    const username = message.from.username;

    console.log(`Received message from ${username}: ${text}`);

    // Forward the complete Telegram data to N8N
    const n8nResult = await forwardToN8N(req.body);
    
    if (!n8nResult.success) {
      console.warn('Failed to forward to N8N, but continuing with local processing');
    } else if (n8nResult.processedData) {
      // Handle processed data from N8N
      await handleN8NProcessedData(n8nResult.processedData, message.chat.id);
    }

    // Handle different types of messages
    if (voice) {
      await handleVoiceMessage(message, voice);
    } else if (document) {
      await handleDocumentUpload(message, document);
    } else if (text.startsWith('/')) {
      await handleCommand(message, text);
    } else {
      await handleTextMessage(message, text);
    }

    res.json({ 
      success: true, 
      n8nForwarded: n8nResult.success,
      n8nStatus: n8nResult.status 
    });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint specifically for forwarding to N8N (can be called independently)
app.post('/forward-to-n8n', async (req, res) => {
  try {
    const data = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    const result = await forwardToN8N(data);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Data forwarded to N8N successfully',
        status: result.status 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to forward to N8N',
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Forward to N8N error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle voice messages
async function handleVoiceMessage(message, voice) {
  const chatId = message.chat.id;
  
  try {
    // TODO: Implement voice-to-text conversion
    // For now, send a placeholder response
    await sendTelegramMessage(chatId, "🎤 Voice message received! Voice-to-text processing coming soon.");
  } catch (error) {
    console.error('Voice processing error:', error);
    await sendTelegramMessage(chatId, "❌ Error processing voice message");
  }
}

// Handle document uploads (CSV)
async function handleDocumentUpload(message, document) {
  const chatId = message.chat.id;
  
  try {
    // TODO: Implement CSV parsing and trade import
    await sendTelegramMessage(chatId, "📄 Document received! CSV import processing coming soon.");
  } catch (error) {
    console.error('Document processing error:', error);
    await sendTelegramMessage(chatId, "❌ Error processing document");
  }
}

// Handle commands
async function handleCommand(message, text) {
  const chatId = message.chat.id;
  const command = text.split(' ')[0].toLowerCase();
  const args = text.split(' ').slice(1);

  switch (command) {
    case '/addtrade':
      await handleAddTrade(message, args);
      break;
    case '/export':
      await handleExport(message);
      break;
    case '/rating':
      await handleRating(message, args);
      break;
    case '/help':
      await handleHelp(message);
      break;
    default:
      await sendTelegramMessage(chatId, "❓ Unknown command. Use /help for available commands.");
  }
}

// Handle add trade command
async function handleAddTrade(message, args) {
  const chatId = message.chat.id;
  
  if (args.length < 5) {
    await sendTelegramMessage(chatId, 
      "📝 Usage: /addtrade SYMBOL TYPE ENTRY EXIT QUANTITY\n" +
      "Example: /addtrade AAPL LONG 150.50 155.00 100"
    );
    return;
  }

  try {
    const [symbol, type, entryPrice, exitPrice, quantity] = args;
    
    // Validate data
    if (!symbol || !type || isNaN(entryPrice) || isNaN(exitPrice) || isNaN(quantity)) {
      await sendTelegramMessage(chatId, "❌ Invalid trade data. Please check your input.");
      return;
    }

    // Calculate P&L
    const pnl = (parseFloat(exitPrice) - parseFloat(entryPrice)) * parseFloat(quantity);
    const tradeType = type.toUpperCase() === 'LONG' ? 'LONG' : 'SHORT';
    
    // Insert trade into database
    const result = await pool.query(
      `INSERT INTO trades (symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7)
       RETURNING *`,
      [symbol, tradeType, entryPrice, exitPrice, quantity, pnl, 'Added via Telegram']
    );

    await sendTelegramMessage(chatId, 
      `✅ Trade added successfully!\n` +
      `Symbol: ${symbol}\n` +
      `Type: ${tradeType}\n` +
      `Entry: $${entryPrice}\n` +
      `Exit: $${exitPrice}\n` +
      `Quantity: ${quantity}\n` +
      `P&L: $${pnl.toFixed(2)}`
    );
  } catch (error) {
    console.error('Add trade error:', error);
    await sendTelegramMessage(chatId, "❌ Error adding trade to database");
  }
}

// Handle export command
async function handleExport(message) {
  const chatId = message.chat.id;
  
  try {
    // Get all trades
    const result = await pool.query('SELECT * FROM trades ORDER BY entry_time DESC');
    
    if (result.rows.length === 0) {
      await sendTelegramMessage(chatId, "📊 No trades found to export.");
      return;
    }

    // TODO: Generate CSV file and send via Telegram
    await sendTelegramMessage(chatId, 
      `📊 Export ready!\n` +
      `Total trades: ${result.rows.length}\n` +
      `CSV export coming soon...`
    );
  } catch (error) {
    console.error('Export error:', error);
    await sendTelegramMessage(chatId, "❌ Error generating export");
  }
}

// Handle rating command
async function handleRating(message, args) {
  const chatId = message.chat.id;
  
  if (args.length < 2) {
    await sendTelegramMessage(chatId, 
      "📊 Usage: /rating TRADE_ID RATING\n" +
      "Rating: A (Excellent), B (Good), C (Fair), D (Poor)\n" +
      "Example: /rating 123 A"
    );
    return;
  }

  try {
    const [tradeId, rating] = args;
    const validRatings = ['A', 'B', 'C', 'D'];
    
    if (!validRatings.includes(rating.toUpperCase())) {
      await sendTelegramMessage(chatId, "❌ Invalid rating. Use A, B, C, or D.");
      return;
    }

    // Update trade with rating
    const result = await pool.query(
      'UPDATE trades SET execution_quality = $1 WHERE id = $2 RETURNING *',
      [rating.toUpperCase(), tradeId]
    );

    if (result.rows.length === 0) {
      await sendTelegramMessage(chatId, "❌ Trade not found.");
      return;
    }

    await sendTelegramMessage(chatId, 
      `✅ Trade #${tradeId} rated as ${rating.toUpperCase()}!`
    );
  } catch (error) {
    console.error('Rating error:', error);
    await sendTelegramMessage(chatId, "❌ Error updating trade rating");
  }
}

// Handle help command
async function handleHelp(message) {
  const chatId = message.chat.id;
  
  const helpText = 
    "🤖 Trade Buddy Bot Commands:\n\n" +
    "📝 /addtrade SYMBOL TYPE ENTRY EXIT QUANTITY\n" +
    "   Add a new trade\n\n" +
    "📊 /export\n" +
    "   Export all trades as CSV\n\n" +
    "⭐ /rating TRADE_ID RATING\n" +
    "   Rate a trade (A/B/C/D)\n\n" +
    "🎤 Send voice message\n" +
    "   Voice-to-text trade entry\n\n" +
    "📄 Send CSV file\n" +
    "   Import trades from file\n\n" +
    "❓ /help\n" +
    "   Show this help message";

  await sendTelegramMessage(chatId, helpText);
}

// Handle regular text messages
async function handleTextMessage(message, text) {
  const chatId = message.chat.id;
  
  // TODO: Implement AI analysis of text messages
  // For now, provide helpful response
  await sendTelegramMessage(chatId, 
    "💬 Text message received! Use /help for available commands or send a voice message for voice-to-text processing."
  );
}

// Handle processed data from N8N
async function handleN8NProcessedData(processedData, chatId) {
  try {
    console.log('Handling N8N processed data:', processedData);
    
    if (processedData.action === 'add_trade' && processedData.data) {
      // Add trade to database
      const tradeData = processedData.data;
      const result = await pool.query(
        `INSERT INTO trades (symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes,
          emotion, setup, execution_quality, duration, checklist_id, checklist_completed, screenshot)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          tradeData.symbol, 
          tradeData.type, 
          tradeData.entry_price, 
          tradeData.exit_price, 
          tradeData.quantity, 
          tradeData.pnl, 
          tradeData.notes,
          tradeData.emotion || null,
          tradeData.setup || null,
          tradeData.execution_quality || null,
          tradeData.duration || null,
          tradeData.checklist_id || null,
          tradeData.checklist_completed ? JSON.stringify(tradeData.checklist_completed) : null,
          tradeData.screenshot || null
        ]
      );
      
      console.log('Trade added to database:', result.rows[0]);
    }
    
    // Send response back to Telegram
    if (processedData.telegram_response) {
      await sendTelegramMessage(chatId, processedData.telegram_response);
    }
    
  } catch (error) {
    console.error('Error handling N8N processed data:', error);
    await sendTelegramMessage(chatId, "❌ Error processing your request. Please try again.");
  }
}

// Send message back to Telegram (via n8n)
async function sendTelegramMessage(chatId, text) {
  try {
    // This will be handled by n8n to send the actual Telegram message
    console.log(`Sending to chat ${chatId}: ${text}`);
    
    // TODO: Implement actual Telegram message sending
    // For now, just log the message
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

const PORT = process.env.PORT || 4001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Telegram Bot Webhook running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/telegram-webhook`);
}); 