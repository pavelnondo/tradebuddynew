const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'tradebuddy_user',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'tradebuddy',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5440,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Hash password
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
function generateToken(userId, username, role) {
  return jwt.sign(
    { userId, username, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Create user
async function createUser(username, email, password, telegramId = null, telegramUsername = null) {
  try {
    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, telegram_id, telegram_username) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, telegram_id, telegram_username, role',
      [username, email, passwordHash, telegramId, telegramUsername]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

// Find user by credentials
async function findUserByCredentials(email, password) {
  try {
    const result = await pool.query(
      'SELECT id, username, email, password_hash, telegram_id, telegram_username, role FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return null;
    }
    
    delete user.password_hash;
    return user;
  } catch (error) {
    throw error;
  }
}

// Find user by Telegram ID
async function findUserByTelegramId(telegramId) {
  try {
    const result = await pool.query(
      'SELECT id, username, email, telegram_id, telegram_username, role FROM users WHERE telegram_id = $1 AND is_active = true',
      [telegramId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw error;
  }
}

// Create or link Telegram user
async function createOrLinkTelegramUser(telegramId, telegramUsername) {
  try {
    // Check if user already exists
    let user = await findUserByTelegramId(telegramId);
    
    if (user) {
      return user;
    }
    
    // Create new user with Telegram credentials
    const username = telegramUsername || `telegram_${telegramId}`;
    const email = `telegram_${telegramId}@tradebuddy.local`;
    const password = Math.random().toString(36).slice(-12); // Generate random password
    
    return await createUser(username, email, password, telegramId, telegramUsername);
  } catch (error) {
    throw error;
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  
  req.user = decoded;
  next();
}

// Optional authentication middleware (for endpoints that work with or without auth)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  createUser,
  findUserByCredentials,
  findUserByTelegramId,
  createOrLinkTelegramUser,
  authenticateToken,
  optionalAuth
}; 