const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Apple-inspired configuration
const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  dbUrl: process.env.DATABASE_URL || 'postgresql://localhost/tradebuddy',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
};

// Database connection with Apple-level efficiency
const db = new Pool({
  connectionString: config.dbUrl,
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Express app with Apple-level security and performance
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Compression for better performance
app.use(compression());

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const result = await db.query('SELECT id, email, first_name, last_name FROM users WHERE id = $1 AND is_active = true', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Utility functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv 
  });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name',
      [email, hashedPassword, firstName, lastName]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    // Create default trading account
    await db.query(
      'INSERT INTO trading_accounts (user_id, name, account_type, initial_balance, current_balance) VALUES ($1, $2, $3, $4, $5)',
      [user.id, 'Main Account', 'paper', 10000, 10000]
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await db.query(
      'SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, first_name, last_name, avatar_url, preferences, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trading accounts
app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM trading_accounts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const { name, accountType, broker, initialBalance, currency } = req.body;

    const result = await db.query(
      'INSERT INTO trading_accounts (user_id, name, account_type, broker, initial_balance, current_balance, currency) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, name, accountType, broker, initialBalance, initialBalance, currency || 'USD']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trades API
app.get('/api/trades', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      symbol, 
      tradeType, 
      emotion, 
      startDate, 
      endDate,
      accountId 
    } = req.query;

    let query = `
      SELECT t.*, ta.name as account_name 
      FROM trades t 
      LEFT JOIN trading_accounts ta ON t.account_id = ta.id 
      WHERE t.user_id = $1
    `;
    let params = [req.user.id];
    let paramCount = 1;

    // Add filters
    if (symbol) {
      paramCount++;
      query += ` AND t.symbol ILIKE $${paramCount}`;
      params.push(`%${symbol}%`);
    }

    if (tradeType) {
      paramCount++;
      query += ` AND t.trade_type = $${paramCount}`;
      params.push(tradeType);
    }

    if (emotion) {
      paramCount++;
      query += ` AND t.emotion = $${paramCount}`;
      params.push(emotion);
    }

    if (accountId) {
      paramCount++;
      query += ` AND t.account_id = $${paramCount}`;
      params.push(accountId);
    }

    if (startDate) {
      paramCount++;
      query += ` AND t.entry_time >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND t.entry_time <= $${paramCount}`;
      params.push(endDate);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    paramCount++;
    query += ` ORDER BY t.entry_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM trades t 
      WHERE t.user_id = $1
      ${symbol ? 'AND t.symbol ILIKE $2' : ''}
      ${tradeType ? `AND t.trade_type = $${symbol ? 3 : 2}` : ''}
      ${emotion ? `AND t.emotion = $${symbol && tradeType ? 4 : symbol || tradeType ? 3 : 2}` : ''}
    `;
    const countParams = [req.user.id];
    if (symbol) countParams.push(`%${symbol}%`);
    if (tradeType) countParams.push(tradeType);
    if (emotion) countParams.push(emotion);

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      trades: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Trades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/trades', authenticateToken, async (req, res) => {
  try {
    const {
      symbol,
      tradeType,
      direction,
      entryPrice,
      exitPrice,
      quantity,
      positionSize,
      entryTime,
      exitTime,
      emotion,
      confidenceLevel,
      executionQuality,
      setupType,
      marketCondition,
      notes,
      tags,
      accountId
    } = req.body;

    const result = await db.query(
      `INSERT INTO trades (
        user_id, account_id, symbol, trade_type, direction, entry_price, exit_price, 
        quantity, position_size, entry_time, exit_time, emotion, confidence_level, 
        execution_quality, setup_type, market_condition, notes, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
      RETURNING *`,
      [
        req.user.id, accountId, symbol, tradeType, direction, entryPrice, exitPrice,
        quantity, positionSize, entryTime, exitTime, emotion, confidenceLevel,
        executionQuality, setupType, marketCondition, notes, tags
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/trades/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.user_id;
    delete updateData.created_at;

    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(updateData);
    const query = `UPDATE trades SET ${setClause}, updated_at = NOW() WHERE id = $1 AND user_id = $${values.length + 2} RETURNING *`;

    const result = await db.query(query, [id, ...values, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/trades/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM trades WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Delete trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics API
app.get('/api/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const { accountId, timeframe = 'all' } = req.query;

    let dateFilter = '';
    let params = [req.user.id];
    let paramCount = 1;

    if (accountId) {
      paramCount++;
      dateFilter += ` AND t.account_id = $${paramCount}`;
      params.push(accountId);
    }

    if (timeframe !== 'all') {
      paramCount++;
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 365;
      dateFilter += ` AND t.entry_time >= NOW() - INTERVAL '${days} days'`;
    }

    const query = `
      SELECT 
        COUNT(*) as total_trades,
        COUNT(CASE WHEN pnl > 0 THEN 1 END) as winning_trades,
        COUNT(CASE WHEN pnl < 0 THEN 1 END) as losing_trades,
        COALESCE(SUM(pnl), 0) as total_pnl,
        COALESCE(SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END), 0) as total_profit,
        COALESCE(SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END), 0) as total_loss,
        COALESCE(AVG(CASE WHEN pnl > 0 THEN pnl END), 0) as avg_win,
        COALESCE(AVG(CASE WHEN pnl < 0 THEN pnl END), 0) as avg_loss
      FROM trades t 
      WHERE t.user_id = $1 ${dateFilter}
    `;

    const result = await db.query(query, params);
    const metrics = result.rows[0];

    // Calculate derived metrics
    const winRate = metrics.total_trades > 0 ? (metrics.winning_trades / metrics.total_trades) * 100 : 0;
    const profitFactor = metrics.avg_loss !== 0 ? Math.abs(metrics.avg_win / metrics.avg_loss) : 0;

    res.json({
      ...metrics,
      win_rate: winRate,
      profit_factor: profitFactor,
      avg_win: Math.abs(metrics.avg_win),
      avg_loss: Math.abs(metrics.avg_loss)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// File upload
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  db.end();
  process.exit(0);
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 TradeBuddy API running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔒 Security: ${config.nodeEnv === 'production' ? 'Enabled' : 'Development mode'}`);
});

module.exports = app;
