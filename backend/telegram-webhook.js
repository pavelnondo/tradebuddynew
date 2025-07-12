require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

// Use raw body parsing for webhook endpoint
app.use('/telegram-webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'tradebuddy_user',
  password: process.env.PGPASSWORD || 'your_db_password_here',
  database: process.env.PGDATABASE || 'tradebuddy',
  port: process.env.PGPORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Configuration
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '[REDACTED]';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '[REDACTED]';

// Telegram Webhook Handler
app.post('/telegram-webhook', async (req, res) => {
  try {
    console.log('Webhook received - Raw body length:', req.body.length);
    console.log('Webhook received - Raw body:', req.body.toString());
    console.log('Webhook received - Request headers:', req.headers);
    
    // Just forward the raw body to n8n without parsing
    const rawBody = req.body.toString();
    
    // Send raw data to n8n for AI processing
    console.log('Sending raw data to n8n:', rawBody);
    
    const n8nResponse = await axios.post(N8N_WEBHOOK_URL, {
      raw_webhook_data: rawBody,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000, // 30 second timeout
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false // Allow self-signed certificates
      })
    });

    console.log('n8n response:', n8nResponse.data);

    // Send simple response back to Telegram
    res.json({ success: true, message: 'Data forwarded to n8n' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Determine message type
function determineMessageType(message) {
  if (message.voice) return 'voice_message';
  if (message.document) return 'document_upload';
  if (message.text) {
    if (message.text.startsWith('/')) return 'command';
    return 'text_message';
  }
  return 'unknown';
}

// Save processed data to database
async function saveToDatabase(processedData) {
  try {
    console.log('saveToDatabase called with:', JSON.stringify(processedData, null, 2));
    const { trade_data, ai_analysis, processing_id } = processedData;

    if (trade_data) {
      console.log('Inserting trade_data:', JSON.stringify(trade_data, null, 2));
      // Insert trade
      const tradeResult = await pool.query(`
        INSERT INTO trades (
          symbol, type, entry_price, exit_price, quantity, 
          entry_time, exit_time, pnl, notes, emotion, 
          setup, execution_quality, duration, checklist_id, 
          checklist_completed, screenshot, processing_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id
      `, [
        trade_data.symbol,
        trade_data.type,
        trade_data.entry_price,
        trade_data.exit_price,
        trade_data.quantity,
        trade_data.entry_time || new Date(),
        trade_data.exit_time || new Date(),
        trade_data.pnl,
        trade_data.notes || '',
        trade_data.emotion || '',
        trade_data.setup || '',
        trade_data.execution_quality || '',
        trade_data.duration || '',
        trade_data.checklist_id || null,
        trade_data.checklist_completed || null,
        trade_data.screenshot || '',
        processing_id
      ]);

      const tradeId = tradeResult.rows[0].id;
      console.log(`Trade saved with ID: ${tradeId}`);
      // Save AI analysis
      if (ai_analysis) {
        await pool.query(`
          INSERT INTO ai_analysis (
            trade_id, processing_id, sentiment, confidence, 
            suggested_rating, recommendations, voice_transcript,
            analysis_timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          tradeId,
          processing_id,
          ai_analysis.sentiment,
          ai_analysis.confidence,
          ai_analysis.suggested_rating,
          JSON.stringify(ai_analysis.recommendations || []),
          ai_analysis.voice_transcript || '',
          new Date()
        ]);
      }

      console.log(`Trade and AI analysis saved for processing_id: ${processing_id}`);
    } else {
      console.log('No trade_data found in processedData:', JSON.stringify(processedData, null, 2));
    }
  } catch (error) {
    console.error('Database save error:', error);
    throw error;
  }
}

// Send message back to Telegram
async function sendTelegramMessage(chatId, text) {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Telegram response sent:', response.data);
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Telegram Webhook Server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/telegram-webhook`);
  console.log(`n8n Webhook: ${N8N_WEBHOOK_URL}`);
}); 