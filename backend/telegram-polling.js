require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8161307137:AAEY21iCaHb1RdLYym4A9gT5FPg6v_3VQdU';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://4807387-or91258.twc1.net/webhook/b43064f8-12fc-4ae0-9ab4-bdceed7542ba';

// Database connection
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'tradebuddy_user',
  password: process.env.PGPASSWORD || 'pavel123',
  database: process.env.PGDATABASE || 'tradebuddy',
  port: process.env.PGPORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let lastUpdateId = 0;

// User session management
const userSessions = new Map(); // chat_id -> { userId, username, isAuthenticated, pendingAction }

// Initialize database tables for Telegram user linking
async function initializeDatabase() {
  try {
    // Create telegram_users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS telegram_users (
        id SERIAL PRIMARY KEY,
        chat_id BIGINT UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        telegram_username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Check if user is authenticated
async function isUserAuthenticated(chatId) {
  try {
    const result = await pool.query(
      'SELECT user_id, telegram_username FROM telegram_users WHERE chat_id = $1 AND is_active = true',
      [chatId]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      userSessions.set(chatId, {
        userId: user.user_id,
        username: user.telegram_username,
        isAuthenticated: true,
        pendingAction: null
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Get user info from database
async function getUserInfo(userId) {
  try {
    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

// Handle login process
async function handleLogin(chatId, message) {
  const session = userSessions.get(chatId) || { pendingAction: null };
  
  if (!session.pendingAction) {
    // Start login process
    session.pendingAction = 'waiting_for_username';
    userSessions.set(chatId, session);
    
    await sendTelegramMessage(chatId, 
      '🔐 **Welcome to Trade Buddy!**\n\n' +
      'I\'m your personal AI trading assistant. To access your trading data and provide personalized insights, I need to link your account.\n\n' +
      '📧 **Enter your website email or username:**'
    );
    return;
  }

  if (session.pendingAction === 'waiting_for_username') {
    // Store username and ask for password
    session.tempUsername = message.text;
    session.pendingAction = 'waiting_for_password';
    userSessions.set(chatId, session);
    
    await sendTelegramMessage(chatId, '🔑 **Enter your password:**');
    return;
  }

  if (session.pendingAction === 'waiting_for_password') {
    // Validate credentials
    const username = session.tempUsername;
    const password = message.text;
    
    try {
      // Find user by email or username
      const userResult = await pool.query(
        'SELECT id, username, email, password_hash FROM users WHERE email = $1 OR username = $1',
        [username]
      );

      if (userResult.rows.length === 0) {
        await sendTelegramMessage(chatId, '❌ **User not found.** Please check your email/username and try again.\n\n📧 **Enter your email/username:**');
        session.pendingAction = 'waiting_for_username';
        session.tempUsername = null;
        userSessions.set(chatId, session);
        return;
      }

      const user = userResult.rows[0];
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        await sendTelegramMessage(chatId, '❌ **Invalid password.** Please try again.\n\n🔑 **Enter your password:**');
        return;
      }

      // Login successful - save to database
      await pool.query(`
        INSERT INTO telegram_users (chat_id, user_id, telegram_username, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (chat_id) 
        DO UPDATE SET 
          user_id = $2,
          telegram_username = $3,
          first_name = $4,
          last_name = $5,
          is_active = true,
          updated_at = CURRENT_TIMESTAMP
      `, [
        chatId,
        user.id,
        message.from.username || null,
        message.from.first_name || null,
        message.from.last_name || null
      ]);

      // Update session
      userSessions.set(chatId, {
        userId: user.id,
        username: user.username,
        isAuthenticated: true,
        pendingAction: null
      });

      await sendTelegramMessage(chatId, 
        '✅ **Welcome back, ' + user.username + '!**\n\n' +
        '🎯 I\'m your AI trading assistant. I can help you with:\n\n' +
        '📊 **Your Trading Data:**\n' +
        '• "Show me my last 5 trades"\n' +
        '• "How am I doing with AAPL?"\n' +
        '• "What\'s my win rate this month?"\n' +
        '• "Show me my best trades"\n\n' +
        '📈 **Market Insights:**\n' +
        '• "What\'s the latest news on Tesla?"\n' +
        '• "How is the crypto market doing?"\n' +
        '• "Give me trading suggestions"\n\n' +
        '💡 **AI Analysis:**\n' +
        '• "Analyze my recent performance"\n' +
        '• "What patterns do you see in my trading?"\n' +
        '• "How can I improve my strategy?"\n\n' +
        'Just ask me anything in natural language! 🚀'
      );

    } catch (error) {
      console.error('Login error:', error);
      await sendTelegramMessage(chatId, '❌ **Login failed.** Please try again later.');
      session.pendingAction = 'waiting_for_username';
      session.tempUsername = null;
      userSessions.set(chatId, session);
    }
  }
}

// Handle logout command (only command we keep)
async function handleLogoutCommand(chatId) {
  try {
    // Deactivate user in database
    await pool.query(
      'UPDATE telegram_users SET is_active = false WHERE chat_id = $1',
      [chatId]
    );

    // Clear session
    userSessions.delete(chatId);

    await sendTelegramMessage(chatId, 
      '👋 **Logged out successfully!**\n\n' +
      'Send any message to login again with your website credentials.'
    );
  } catch (error) {
    console.error('Logout error:', error);
    await sendTelegramMessage(chatId, '❌ **Logout failed.** Please try again.');
  }
}

// Forward message to N8N
async function forwardToN8N(messageData) {
  try {
    console.log('Forwarding to N8N:', JSON.stringify(messageData, null, 2));
    
    const response = await axios.post(N8N_WEBHOOK_URL, {
      telegram_message: messageData,
      timestamp: new Date().toISOString(),
      source: 'telegram_polling'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000,
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });

    console.log('N8N response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error forwarding to N8N:', error.message);
    throw error;
  }
}

// Send message back to Telegram user
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
    return response.data;
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
    throw error;
  }
}

// Process incoming message
async function processMessage(message) {
  try {
    const chatId = message.chat.id;
    const text = message.text || '';

    console.log(`Received message from ${message.from.username || message.from.first_name} (${chatId}): ${text}`);

    // Handle logout command (only command we keep)
    if (text.toLowerCase() === '/logout') {
      await handleLogoutCommand(chatId);
      return;
    }

    // Check if user is authenticated FIRST
    const isAuthenticated = await isUserAuthenticated(chatId);
    const session = userSessions.get(chatId);

    console.log(`User ${chatId} authenticated: ${isAuthenticated}, session:`, session);

    // If not authenticated, start login process
    if (!isAuthenticated) {
      console.log(`User ${chatId} not authenticated, starting login process`);
      await handleLogin(chatId, message);
      return;
    }

    // Check if user is in login process
    if (session && session.pendingAction) {
      console.log(`User ${chatId} in login process, continuing login`);
      await handleLogin(chatId, message);
      return;
    }

    // User is authenticated, forward to N8N for AI processing
    console.log(`User ${chatId} authenticated, forwarding to N8N`);
    const n8nResponse = await forwardToN8N({
      message_id: message.message_id,
      chat_id: chatId,
      user_id: session.userId,  // ← Website user ID for database queries
      username: session.username,  // ← Website username
      telegram_username: message.from.username,  // ← Telegram username
      text: text,
      message_type: 'text',
      date: message.date,
      from: message.from,
      chat: message.chat,
      // Additional context for N8N
      user_context: {
        website_user_id: session.userId,
        website_username: session.username,
        telegram_chat_id: chatId,
        telegram_username: message.from.username,
        is_authenticated: true
      }
    });

    // Send response back to user
    let replyText = '🤔 Processing your request...';
    
    // If N8N returned a specific response, use it
    if (n8nResponse) {
      if (Array.isArray(n8nResponse) && n8nResponse.length > 0 && n8nResponse[0].reply) {
        replyText = n8nResponse[0].reply;
      } else if (n8nResponse.reply) {
        replyText = n8nResponse.reply;
      }
    }

    await sendTelegramMessage(chatId, replyText);

  } catch (error) {
    console.error('Error processing message:', error);
    
    // Send error message to user
    try {
      await sendTelegramMessage(message.chat.id, '❌ Sorry, there was an error processing your message. Please try again.');
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
}

// Get updates from Telegram
async function getUpdates() {
  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`,
      {
        params: {
          offset: lastUpdateId + 1,
          timeout: 30, // Long polling timeout
          allowed_updates: ['message']
        },
        timeout: 35000 // Slightly longer than Telegram's timeout
      }
    );

    if (response.data.ok && response.data.result.length > 0) {
      console.log(`Received ${response.data.result.length} updates`);
      
      for (const update of response.data.result) {
        if (update.message) {
          await processMessage(update.message);
        }
        lastUpdateId = update.update_id;
      }
    }

    return response.data;
  } catch (error) {
    console.error('Error getting updates:', error.message);
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Main polling loop
async function startPolling() {
  console.log('Starting Telegram polling bot with authentication...');
  console.log(`Bot token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
  console.log(`N8N webhook: ${N8N_WEBHOOK_URL}`);
  
  // Initialize database tables
  await initializeDatabase();
  
  // Get initial update_id to avoid processing old messages
  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`
    );
    
    if (response.data.ok && response.data.result.length > 0) {
      lastUpdateId = response.data.result[response.data.result.length - 1].update_id;
      console.log(`Starting from update_id: ${lastUpdateId}`);
    }
  } catch (error) {
    console.error('Error getting initial updates:', error.message);
  }

  // Start continuous polling
  while (true) {
    try {
      await getUpdates();
    } catch (error) {
      console.error('Polling error:', error.message);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Telegram polling bot...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Telegram polling bot...');
  await pool.end();
  process.exit(0);
});

// Start the bot
if (require.main === module) {
  startPolling().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  startPolling,
  processMessage,
  forwardToN8N,
  sendTelegramMessage,
  isUserAuthenticated,
  getUserInfo
}; 