const express = require('express');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const pg = require('pg');
const { Pool } = pg;
// Prevent node-pg from converting DATE to JS Date (causes 1-day shift in non-UTC timezones)
pg.types.setTypeParser(1082, (val) => (val ? String(val).slice(0, 10) : null));
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Apple-inspired configuration
const config = {
  port: process.env.PORT || 3000, // Changed default to 3000 to match Nginx
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  dbUrl: process.env.DATABASE_URL || 'postgresql://localhost/tradebuddy',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174'
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

// Trust proxy for rate limiting and real IP detection (required for Nginx)
app.set('trust proxy', ['127.0.0.1', '::1']);

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

// Rate limiting for API protection with proper proxy support
const rateLimitMax = config.nodeEnv === 'production' ? 500 : 1000; // stricter in prod
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
  max: rateLimitMax,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
  });
  app.use('/api/', limiter);

// Stricter limit for AI/insights endpoints to prevent abuse
const insightsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: config.nodeEnv === 'production' ? 10 : 30,
  message: 'Rate limit exceeded for insights. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
});
app.use('/api/analytics/insights', insightsLimiter);

// Compression for better performance
app.use(compression());

// CORS configuration
const allowedOrigins = new Set([
  'http://localhost:5173',
  'https://mytradebuddy.ru',
  'https://www.mytradebuddy.ru',
]);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    // Allow same-origin and health checks without strict block
    return callback(null, true);
  },
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

// Use absolute path for uploads (works regardless of cwd)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  // No fileFilter - accept images (screenshots) and audio (voice notes); rely on 5MB limit for safety
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

// Internal API: server-to-server only (n8n Telegram ICT workflow). Auth via X-Internal-Secret or Bearer.
const internalSecret = process.env.INTERNAL_API_SECRET || 'your-internal-secret-change-in-production';
function requireInternalSecret(req, res, next) {
  const secret = req.headers['x-internal-secret'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (secret !== internalSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/internal/trades/:userId', requireInternalSecret, (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  db.query(
    'SELECT * FROM trades WHERE user_id = $1 ORDER BY created_at DESC NULLS LAST LIMIT 200',
    [userId]
  )
    .then((r) => res.json(r.rows))
    .catch((err) => {
      console.error('Internal trades error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// Internal API: full user context for n8n (profile, journals, trades, goals, analytics)
app.get('/api/internal/context/:userId', requireInternalSecret, async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const [profileRes, journalsRes, tradesRes, goalsRes, analyticsRes] = await Promise.all([
      db.query(
        'SELECT id, email, first_name, last_name, preferences, created_at, last_login FROM users WHERE id = $1 AND is_active = true',
        [userId]
      ),
      db.query(
        `SELECT j.id, j.name, j.account_type, j.broker, j.initial_balance, j.current_balance, j.currency, j.is_active, j.is_blown, j.is_passed,
         COUNT(t.id)::int as total_trades, COALESCE(SUM(t.pnl), 0)::numeric as total_pnl,
         (COUNT(CASE WHEN t.pnl > 0 THEN 1 END)::float / NULLIF(COUNT(t.id), 0) * 100) as win_rate
         FROM journals j LEFT JOIN trades t ON j.id = t.journal_id AND t.user_id = j.user_id
         WHERE j.user_id = $1 GROUP BY j.id ORDER BY j.created_at DESC`,
        [userId]
      ),
      db.query(
        'SELECT id, symbol, trade_type, direction, entry_price, exit_price, quantity, pnl, pnl_percentage, emotion, confidence_level, execution_quality, setup_type, market_condition, notes, entry_time, exit_time, created_at FROM trades WHERE user_id = $1 ORDER BY created_at DESC NULLS LAST LIMIT 200',
        [userId]
      ),
      db.query(
        'SELECT id, title, description, goal_type, target_value, current_value, unit, period, status, start_date, end_date, journal_id, created_at FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      ),
      db.query(
        `SELECT COUNT(*)::int as total_trades,
         COUNT(CASE WHEN pnl > 0 THEN 1 END)::int as winning_trades,
         COUNT(CASE WHEN pnl < 0 THEN 1 END)::int as losing_trades,
         COALESCE(SUM(pnl), 0)::numeric as total_pnl,
         COALESCE(SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END), 0)::numeric as total_profit,
         COALESCE(SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END), 0)::numeric as total_loss,
         COALESCE(AVG(CASE WHEN pnl > 0 THEN pnl END), 0)::numeric as avg_win,
         COALESCE(AVG(CASE WHEN pnl < 0 THEN pnl END), 0)::numeric as avg_loss
         FROM trades WHERE user_id = $1`,
        [userId]
      )
    ]);

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = profileRes.rows[0];
    const journals = journalsRes.rows.map((j) => ({
      id: j.id,
      name: j.name,
      accountType: j.account_type,
      broker: j.broker,
      initialBalance: parseFloat(j.initial_balance) || 0,
      currentBalance: parseFloat(j.current_balance) || 0,
      currency: j.currency,
      isActive: j.is_active,
      isBlown: j.is_blown,
      isPassed: j.is_passed,
      totalTrades: parseInt(j.total_trades) || 0,
      totalPnL: parseFloat(j.total_pnl) || 0,
      winRate: j.win_rate != null ? parseFloat(j.win_rate) : null
    }));
    const trades = tradesRes.rows;
    const goals = goalsRes.rows.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      goalType: g.goal_type,
      targetValue: parseFloat(g.target_value) || 0,
      currentValue: parseFloat(g.current_value) || 0,
      unit: g.unit,
      period: g.period,
      status: g.status,
      startDate: g.start_date,
      endDate: g.end_date,
      journalId: g.journal_id
    }));
    const metrics = analyticsRes.rows[0];
    const totalTrades = parseInt(metrics.total_trades) || 0;
    const winRate = totalTrades > 0 ? (metrics.winning_trades / totalTrades) * 100 : 0;
    const avgLoss = Math.abs(parseFloat(metrics.avg_loss) || 0);
    const avgWin = parseFloat(metrics.avg_win) || 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
    const analytics = {
      totalTrades,
      winningTrades: parseInt(metrics.winning_trades) || 0,
      losingTrades: parseInt(metrics.losing_trades) || 0,
      totalPnL: parseFloat(metrics.total_pnl) || 0,
      totalProfit: parseFloat(metrics.total_profit) || 0,
      totalLoss: parseFloat(metrics.total_loss) || 0,
      winRate: Math.round(winRate * 10) / 10,
      profitFactor: Math.round(profitFactor * 100) / 100,
      avgWin: Math.abs(avgWin),
      avgLoss
    };

    res.json({
      profile: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        preferences: profile.preferences,
        createdAt: profile.created_at,
        lastLogin: profile.last_login
      },
      journals,
      trades,
      goals,
      analytics
    });
  } catch (err) {
    console.error('Internal context error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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

    // Create default trading journal
    await db.query(
      'INSERT INTO journals (user_id, name, account_type, initial_balance, current_balance) VALUES ($1, $2, $3, $4, $5)',
      [user.id, 'Journal 1', 'paper', 10000, 10000]
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

// Change password
app.put('/api/user/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isValid = await comparePassword(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const hashedPassword = await hashPassword(newPassword);
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trading journals
app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    // Optimized single query with JOINs instead of N+1 queries
    const result = await db.query(`
      SELECT 
        j.*,
        COUNT(t.id) as total_trades,
        COALESCE(SUM(t.pnl), 0) as total_pnl,
        CASE 
          WHEN COUNT(t.id) > 0 THEN 
            (COUNT(CASE WHEN t.pnl > 0 THEN 1 END)::float / COUNT(t.id)) * 100
          ELSE 0 
        END as win_rate
      FROM journals j
      LEFT JOIN trades t ON j.id = t.journal_id AND t.user_id = j.user_id
      WHERE j.user_id = $1
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `, [req.user.id]);

    // Transform data to match frontend expectations
    const accounts = result.rows.map(journal => ({
      id: journal.id,
      name: journal.name,
      initialBalance: parseFloat(journal.initial_balance) || 0,
      currentBalance: parseFloat(journal.current_balance) || 0,
      isActive: journal.is_active || false,
      isBlown: journal.is_blown || false,
      isPassed: journal.is_passed || false,
      createdAt: journal.created_at,
      blownAt: journal.blown_at,
      passedAt: journal.passed_at,
      accountType: journal.account_type || 'paper',
      broker: journal.broker || 'Unknown',
      currency: journal.currency || 'USD',
      totalTrades: parseInt(journal.total_trades) || 0,
      totalPnL: parseFloat(journal.total_pnl) || 0,
      winRate: parseFloat(journal.win_rate) || 0
    }));

    // Return in expected format
    res.json({ accounts });
  } catch (error) {
    console.error('Journals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const { name, accountType, broker, initialBalance, currency } = req.body;
    

    const result = await db.query(
      'INSERT INTO journals (user_id, name, account_type, broker, initial_balance, current_balance, currency) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, name, accountType || 'paper', broker || 'Unknown', initialBalance, initialBalance, currency || 'USD']
    );

    const journal = result.rows[0];
    
    // Transform data to match frontend expectations
    const account = {
      id: journal.id,
      name: journal.name,
      initialBalance: parseFloat(journal.initial_balance) || 0,
      currentBalance: parseFloat(journal.current_balance) || 0,
      isActive: journal.is_active || false,
      isBlown: journal.is_blown || false,
      isPassed: journal.is_passed || false,
      createdAt: journal.created_at,
      blownAt: journal.blown_at,
      passedAt: journal.passed_at,
      accountType: journal.account_type || 'paper',
      broker: journal.broker || 'Unknown',
      currency: journal.currency || 'USD',
      totalTrades: 0,
      totalPnL: 0,
      winRate: 0
    };

    res.status(201).json(account);
  } catch (error) {
    console.error('Create journal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trades API
app.get('/api/trades/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM trades WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    const trade = result.rows[0];
    // Normalize checklist_items to array (pre, during, post)
    const normalizeItems = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try { return JSON.parse(val); } catch (_) { return []; }
    };
    // Normalize voice_note_urls to array
    const normalizeVoiceNotes = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { 
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch (_) { return []; }
      }
      // Handle PostgreSQL JSONB object (sometimes returned as object instead of array)
      if (typeof val === 'object' && val !== null) {
        // If it's already an array, return it
        if (Array.isArray(val)) return val;
        // If it has a length property, try to convert to array
        if (val.length !== undefined && typeof val.length === 'number') {
          try {
            return Array.from(val);
          } catch (_) {
            // If Array.from fails, try Object.values
            return Object.values(val);
          }
        }
        // If it's a single object with url property, wrap in array
        if (val.url) {
          return [val];
        }
        // Try to get values if it's an object with numeric keys or array-like
        const values = Object.values(val);
        if (values.length > 0) {
          // Check if first value looks like a voice note object
          if (values[0] && typeof values[0] === 'object' && (values[0].url || typeof values[0] === 'string')) {
            return values;
          }
        }
      }
      return [];
    };
    trade.checklist_items = normalizeItems(trade.checklist_items);
    trade.during_checklist_items = normalizeItems(trade.during_checklist_items);
    trade.post_checklist_items = normalizeItems(trade.post_checklist_items);
    
    // Get raw voice_note_urls before normalization
    const rawVoiceNotes = trade.voice_note_urls;
    const normalizedVoiceNotes = normalizeVoiceNotes(trade.voice_note_urls);
    trade.voice_note_urls = normalizedVoiceNotes;

    // Debug logging - always log
    console.log('[GET /trades/:id] Trade', id, 'voice notes:', {
      raw: rawVoiceNotes,
      rawType: typeof rawVoiceNotes,
      rawIsArray: Array.isArray(rawVoiceNotes),
      rawConstructor: rawVoiceNotes?.constructor?.name,
      normalized: normalizedVoiceNotes,
      normalizedType: typeof normalizedVoiceNotes,
      normalizedIsArray: Array.isArray(normalizedVoiceNotes),
      count: Array.isArray(normalizedVoiceNotes) ? normalizedVoiceNotes.length : 0,
      firstItem: Array.isArray(normalizedVoiceNotes) && normalizedVoiceNotes.length > 0 ? normalizedVoiceNotes[0] : null,
      allItems: Array.isArray(normalizedVoiceNotes) ? normalizedVoiceNotes : [],
    });

    return res.json(trade);
  } catch (error) {
    console.error('Get trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
      accountId,
      setupType,
      session,
      rMin,
      rMax,
      riskPercentMin,
      riskPercentMax,
      checklistPercentMin,
      checklistPercentMax,
      confidenceMin,
      confidenceMax,
      executionMin,
      executionMax,
      winLoss,
      durationMin,
      durationMax,
      tradeNumberMin,
      tradeNumberMax
    } = req.query;


    let query = `
      SELECT t.*, j.name as journal_name 
      FROM trades t 
      LEFT JOIN journals j ON t.journal_id = j.id 
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
    if (setupType) {
      paramCount++;
      query += ` AND t.setup_type = $${paramCount}`;
      params.push(setupType);
    }
    if (session) {
      paramCount++;
      query += ` AND t.session = $${paramCount}`;
      params.push(session);
    }

    if (accountId) {
      paramCount++;
      query += ` AND t.journal_id = $${paramCount}`;
      params.push(accountId);
    }

    if (startDate) {
      paramCount++;
      // Convert VARCHAR date string to comparison: "2025-09-02T16:37" >= "2025-09-02"
      query += ` AND t.entry_time >= $${paramCount}`;
      params.push(startDate + 'T00:00'); // Ensure we get start of day
    }

    if (endDate) {
      paramCount++;
      // Convert VARCHAR date string to comparison: "2025-09-02T16:37" <= "2025-09-02T23:59"
      query += ` AND t.entry_time <= $${paramCount}`;
      params.push(endDate + 'T23:59'); // Ensure we get end of day
    }

    if (rMin !== undefined) {
      paramCount++;
      query += ` AND t.r_multiple >= $${paramCount}`;
      params.push(Number(rMin));
    }
    if (rMax !== undefined) {
      paramCount++;
      query += ` AND t.r_multiple <= $${paramCount}`;
      params.push(Number(rMax));
    }
    if (riskPercentMin !== undefined) {
      paramCount++;
      query += ` AND t.planned_risk_percent >= $${paramCount}`;
      params.push(Number(riskPercentMin));
    }
    if (riskPercentMax !== undefined) {
      paramCount++;
      query += ` AND t.planned_risk_percent <= $${paramCount}`;
      params.push(Number(riskPercentMax));
    }
    if (checklistPercentMin !== undefined) {
      paramCount++;
      query += ` AND t.checklist_completion_percent >= $${paramCount}`;
      params.push(Number(checklistPercentMin));
    }
    if (checklistPercentMax !== undefined) {
      paramCount++;
      query += ` AND t.checklist_completion_percent <= $${paramCount}`;
      params.push(Number(checklistPercentMax));
    }
    if (confidenceMin !== undefined) {
      paramCount++;
      query += ` AND t.confidence_level >= $${paramCount}`;
      params.push(Number(confidenceMin));
    }
    if (confidenceMax !== undefined) {
      paramCount++;
      query += ` AND t.confidence_level <= $${paramCount}`;
      params.push(Number(confidenceMax));
    }
    if (executionMin !== undefined) {
      paramCount++;
      query += ` AND t.execution_quality >= $${paramCount}`;
      params.push(Number(executionMin));
    }
    if (executionMax !== undefined) {
      paramCount++;
      query += ` AND t.execution_quality <= $${paramCount}`;
      params.push(Number(executionMax));
    }
    if (durationMin !== undefined) {
      paramCount++;
      query += ` AND t.duration >= $${paramCount}`;
      params.push(Number(durationMin));
    }
    if (durationMax !== undefined) {
      paramCount++;
      query += ` AND t.duration <= $${paramCount}`;
      params.push(Number(durationMax));
    }
    if (tradeNumberMin !== undefined) {
      paramCount++;
      query += ` AND t.trade_number_of_day >= $${paramCount}`;
      params.push(Number(tradeNumberMin));
    }
    if (tradeNumberMax !== undefined) {
      paramCount++;
      query += ` AND t.trade_number_of_day <= $${paramCount}`;
      params.push(Number(tradeNumberMax));
    }
    if (winLoss === 'win') query += ` AND t.pnl > 0`;
    if (winLoss === 'loss') query += ` AND t.pnl < 0`;
    if (winLoss === 'breakeven') query += ` AND t.pnl = 0`;

    // Preserve filtered base query for count before pagination
    const countQuery = query.replace(
      'SELECT t.*, j.name as journal_name',
      'SELECT COUNT(*)::int AS count'
    );
    const countParams = [...params];

    // Add pagination
    const offset = (page - 1) * limit;
    paramCount++;
    query += ` ORDER BY t.entry_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count for pagination (with full filters)
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    const normalizeItems = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try { return JSON.parse(val); } catch (_) { return []; }
    };
    const normalizeVoiceNotes = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (_) { return []; }
      }
      return [];
    };
    const trades = result.rows.map(row => ({
      ...row,
      checklist_items: normalizeItems(row.checklist_items),
      during_checklist_items: normalizeItems(row.during_checklist_items),
      post_checklist_items: normalizeItems(row.post_checklist_items),
      voice_note_urls: normalizeVoiceNotes(row.voice_note_urls),
    }));

    if (config.nodeEnv === 'development' && trades.length > 0) {
      const first = trades[0];
      console.log('[GET /trades] First trade checklists:', {
        pre: (first.checklist_items || []).length,
        during: (first.during_checklist_items || []).length,
        post: (first.post_checklist_items || []).length,
        voiceNotes: (first.voice_note_urls || []).length,
        voiceNotesRaw: first.voice_note_urls,
      });
      // Log trades with voice notes
      const tradesWithVoiceNotes = trades.filter(t => t.voice_note_urls && Array.isArray(t.voice_note_urls) && t.voice_note_urls.length > 0);
      if (tradesWithVoiceNotes.length > 0) {
        console.log('[GET /trades] Found', tradesWithVoiceNotes.length, 'trades with voice notes');
        tradesWithVoiceNotes.slice(0, 3).forEach(t => {
          console.log('[GET /trades] Trade', t.id, 'has', t.voice_note_urls.length, 'voice notes:', t.voice_note_urls);
        });
      }
    }

    res.json({
      trades,
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

const toFiniteNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeSession = (session) => {
  if (!session) return null;
  const map = {
    asia: 'Asia',
    london: 'London',
    newyork: 'NewYork',
    new_york: 'NewYork',
    ny: 'NewYork',
    other: 'Other',
  };
  return map[String(session).trim().toLowerCase()] || null;
};

const deriveSessionFromEntryTime = (entryTime) => {
  if (!entryTime) return null;
  const d = new Date(entryTime);
  if (isNaN(d.getTime())) return null;
  const h = d.getHours();
  if (h >= 0 && h < 8) return 'Asia';
  if (h >= 8 && h < 13) return 'London';
  if (h >= 13 && h < 22) return 'NewYork';
  return 'Other';
};

const calcChecklistCompletionPercent = (...checklistGroups) => {
  const all = checklistGroups.flatMap((g) => (Array.isArray(g) ? g : []));
  if (!all.length) return null;
  const completed = all.filter((i) => Boolean(i && i.completed)).length;
  return Number(((completed / all.length) * 100).toFixed(2));
};

const calcPlannedRiskAmount = ({ plannedRiskAmount, entryPrice, stopLossPrice, quantity, positionSize }) => {
  const explicit = toFiniteNumberOrNull(plannedRiskAmount);
  if (explicit !== null && explicit > 0) return explicit;
  const ep = toFiniteNumberOrNull(entryPrice);
  const sl = toFiniteNumberOrNull(stopLossPrice);
  const qty = toFiniteNumberOrNull(quantity);
  if (ep !== null && sl !== null && qty !== null && qty > 0) {
    return Number((Math.abs(ep - sl) * qty).toFixed(6));
  }
  const ps = toFiniteNumberOrNull(positionSize);
  if (ep !== null && sl !== null && ps !== null && ps > 0 && ep > 0) {
    const derivedQty = ps / ep;
    return Number((Math.abs(ep - sl) * derivedQty).toFixed(6));
  }
  return null;
};

const calcPlannedRR = ({ plannedRR, entryPrice, stopLossPrice, takeProfitPrice }) => {
  const explicit = toFiniteNumberOrNull(plannedRR);
  if (explicit !== null) return explicit;
  const ep = toFiniteNumberOrNull(entryPrice);
  const sl = toFiniteNumberOrNull(stopLossPrice);
  const tp = toFiniteNumberOrNull(takeProfitPrice);
  if (ep === null || sl === null || tp === null) return null;
  const risk = Math.abs(ep - sl);
  if (risk <= 0) return null;
  return Number((Math.abs(tp - ep) / risk).toFixed(6));
};

const calcRMultiple = ({ rMultiple, pnl, plannedRiskAmount }) => {
  const explicit = toFiniteNumberOrNull(rMultiple);
  if (explicit !== null) return explicit;
  const p = toFiniteNumberOrNull(pnl);
  const risk = toFiniteNumberOrNull(plannedRiskAmount);
  if (p === null || risk === null || risk <= 0) return null;
  return Number((p / risk).toFixed(6));
};

app.post('/api/trades', authenticateToken, async (req, res) => {
  try {
    const {
      symbol,
      tradeType,
      type,
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
      accountId,
      pnl,
      duration,
      checklistId,
      checklistItems,
      duringChecklistId,
      duringChecklistItems,
      postChecklistId,
      postChecklistItems,
      screenshot,
      tradeGrade,
      lessonsLearned,
      ruleId,
      ruleItems,
      plannedRiskAmount,
      plannedRiskPercent,
      stopLossPrice,
      takeProfitPrice,
      plannedRR,
      actualRR,
      rMultiple,
      tradeNumberOfDay,
      session,
      riskConsistencyFlag,
      checklistCompletionPercent,
      aiRecommendations
    } = req.body;

    // Get default journal if not provided
    let finalJournalId = accountId;
    if (!finalJournalId) {
      try {
      const defaultJournal = await db.query(
        'SELECT id FROM journals WHERE user_id = $1 ORDER BY created_at LIMIT 1',
        [req.user.id]
      );
      finalJournalId = defaultJournal.rows.length > 0 ? defaultJournal.rows[0].id : null;
      } catch (journalErr) {
        console.warn('Journals lookup skipped:', journalErr.message);
        finalJournalId = null;
      }
    }

    // Use the P&L provided by the user EXACTLY as provided
    const calculatedPnL = pnl !== undefined && pnl !== null ? pnl : 0;
    
    // Store times as PLAIN STRINGS - NO conversion whatsoever
    // Store EXACTLY as received - as VARCHAR strings, no timezone conversion
    const entryTimeString = entryTime || null;
    const exitTimeString = exitTime || null;

    const voiceNoteUrlsRaw = req.body.voiceNoteUrls;
    const voiceNoteUrls = Array.isArray(voiceNoteUrlsRaw) && voiceNoteUrlsRaw.length > 0
      ? JSON.stringify(voiceNoteUrlsRaw)
      : '[]';

    const preItems = Array.isArray(checklistItems) ? checklistItems : [];
    const durItems = Array.isArray(duringChecklistItems) ? duringChecklistItems : [];
    const postItems = Array.isArray(postChecklistItems) ? postChecklistItems : [];
    const ruleItemsArr = Array.isArray(ruleItems) ? ruleItems : [];
    const checklistPct =
      toFiniteNumberOrNull(checklistCompletionPercent) ??
      calcChecklistCompletionPercent(preItems, durItems, postItems, ruleItemsArr);

    const riskAmt = calcPlannedRiskAmount({
      plannedRiskAmount,
      entryPrice,
      stopLossPrice,
      quantity,
      positionSize,
    });
    const plannedRrVal = calcPlannedRR({
      plannedRR,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
    });
    const rMultipleVal = calcRMultiple({
      rMultiple,
      pnl: calculatedPnL,
      plannedRiskAmount: riskAmt,
    });
    const actualRrVal = toFiniteNumberOrNull(actualRR) ?? rMultipleVal;
    const normalizedSession = normalizeSession(session) || deriveSessionFromEntryTime(entryTimeString);
    const riskConsistency = typeof riskConsistencyFlag === 'boolean' ? riskConsistencyFlag : null;

    let tradeNumber = Number.isInteger(Number(tradeNumberOfDay)) ? Number(tradeNumberOfDay) : null;
    if (tradeNumber === null && entryTimeString) {
      const d = new Date(entryTimeString);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dayStart = `${yyyy}-${mm}-${dd}T00:00`;
        const dayEnd = `${yyyy}-${mm}-${dd}T23:59`;
        const countSameDay = await db.query(
          `SELECT COUNT(*)::int AS c FROM trades
           WHERE user_id = $1
             AND (journal_id IS NOT DISTINCT FROM $2)
             AND entry_time >= $3
             AND entry_time <= $4`,
          [req.user.id, finalJournalId, dayStart, dayEnd]
        );
        tradeNumber = (countSameDay.rows[0]?.c || 0) + 1;
      }
    }

    const validGrade = ['A', 'B', 'C'].includes(String(tradeGrade || '').toUpperCase()) ? String(tradeGrade).toUpperCase() : null;

    const aiRecsJson = Array.isArray(aiRecommendations) ? JSON.stringify(aiRecommendations) : '[]';

    const result = await db.query(
      `INSERT INTO trades (
        user_id, journal_id, symbol, type, trade_type, direction, entry_price, exit_price, 
        quantity, position_size, entry_time, exit_time, emotion, confidence_level, 
        execution_quality, setup_type, market_condition, notes, tags, pnl, duration, 
        checklist_id, checklist_items, during_checklist_id, during_checklist_items, post_checklist_id, post_checklist_items, rule_id, rule_items, screenshot_url, voice_note_urls, trade_grade, lessons_learned,
        planned_risk_amount, planned_risk_percent, stop_loss_price, take_profit_price, planned_rr, actual_rr, r_multiple, trade_number_of_day, session, risk_consistency_flag, checklist_completion_percent, ai_recommendations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45) 
      RETURNING *`,
      [
        req.user.id, finalJournalId, symbol, type, tradeType, direction, entryPrice, exitPrice,
        quantity, positionSize, entryTimeString, exitTimeString, emotion, confidenceLevel,
        executionQuality, setupType, marketCondition, notes, tags, calculatedPnL, duration,
        checklistId || null, JSON.stringify(preItems),
        duringChecklistId || null, JSON.stringify(durItems),
        postChecklistId || null, JSON.stringify(postItems),
        ruleId || null, JSON.stringify(ruleItemsArr),
        screenshot || null,
        voiceNoteUrls,
        validGrade,
        (lessonsLearned && String(lessonsLearned).trim()) || null,
        riskAmt,
        toFiniteNumberOrNull(plannedRiskPercent),
        toFiniteNumberOrNull(stopLossPrice),
        toFiniteNumberOrNull(takeProfitPrice),
        plannedRrVal,
        actualRrVal,
        rMultipleVal,
        tradeNumber,
        normalizedSession,
        riskConsistency,
        checklistPct,
        aiRecsJson
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create trade error:', error);
    const msg = config.nodeEnv === 'development' ? (error.message || String(error)) : 'Internal server error';
    res.status(500).json({ error: msg });
  }
});

app.patch('/api/trades/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.ai_recommendations !== undefined) {
      updateFields.push(`ai_recommendations = $${paramIndex}`);
      values.push(JSON.stringify(Array.isArray(updates.ai_recommendations) ? updates.ai_recommendations : []));
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id, req.user.id);
    const result = await db.query(
      `UPDATE trades 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[PATCH /trades/:id] Error:', error);
    res.status(500).json({ error: 'Failed to update trade' });
  }
});

app.put('/api/trades/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      symbol,
      tradeType,
      type,
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
      pnl,
      duration,
      checklistId,
      checklistItems,
      duringChecklistId,
      duringChecklistItems,
      postChecklistId,
      postChecklistItems,
      screenshot,
      voiceNoteUrls,
      tradeGrade,
      lessonsLearned,
      ruleId,
      ruleItems,
      plannedRiskAmount,
      plannedRiskPercent,
      stopLossPrice,
      takeProfitPrice,
      plannedRR,
      actualRR,
      rMultiple,
      tradeNumberOfDay,
      session,
      riskConsistencyFlag,
      checklistCompletionPercent,
      aiRecommendations
    } = req.body;

    const validGrade = ['A', 'B', 'C'].includes(String(tradeGrade || '').toUpperCase()) ? String(tradeGrade).toUpperCase() : null;

    // Store times as PLAIN STRINGS - NO conversion whatsoever
    // Store EXACTLY as received - as VARCHAR strings, no timezone conversion
    const entryTimeString = entryTime || null;
    const exitTimeString = exitTime || null;

    // Map frontend fields to database fields - ALWAYS include all 3 checklists (pre, during, post)
    const preItems = Array.isArray(checklistItems) ? checklistItems : [];
    const durItems = Array.isArray(duringChecklistItems) ? duringChecklistItems : [];
    const postItems = Array.isArray(postChecklistItems) ? postChecklistItems : [];
    if (config.nodeEnv === 'development') {
      console.log('[PUT /trades] Checklist payload:', {
        during: { id: !!duringChecklistId, items: durItems.length },
        post: { id: !!postChecklistId, items: postItems.length },
      });
    }
    // Only update fields explicitly provided - never overwrite with undefined (preserves DB data)
    const updateData = {};
    if (symbol !== undefined) updateData.symbol = symbol;
    if (type !== undefined) updateData.type = type;
    if (tradeType !== undefined) updateData.trade_type = tradeType;
    if (direction !== undefined) updateData.direction = direction;
    if (entryPrice !== undefined) updateData.entry_price = entryPrice;
    if (exitPrice !== undefined) updateData.exit_price = exitPrice;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (positionSize !== undefined) updateData.position_size = positionSize;
    if (entryTime !== undefined) updateData.entry_time = entryTimeString;
    if (exitTime !== undefined) updateData.exit_time = exitTimeString;
    if (emotion !== undefined) updateData.emotion = emotion;
    if (confidenceLevel !== undefined) updateData.confidence_level = confidenceLevel;
    if (executionQuality !== undefined) updateData.execution_quality = executionQuality;
    if (setupType !== undefined) updateData.setup_type = setupType || null;
    if (marketCondition !== undefined) updateData.market_condition = marketCondition || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (tags !== undefined) updateData.tags = tags;
    if (pnl !== undefined) updateData.pnl = pnl;
    if (duration !== undefined) updateData.duration = duration;
    if (checklistId !== undefined) updateData.checklist_id = checklistId || null;
    if (checklistItems !== undefined) updateData.checklist_items = JSON.stringify(preItems);
    if (duringChecklistId !== undefined) updateData.during_checklist_id = duringChecklistId || null;
    if (duringChecklistItems !== undefined) updateData.during_checklist_items = JSON.stringify(durItems);
    if (postChecklistId !== undefined) updateData.post_checklist_id = postChecklistId || null;
    if (postChecklistItems !== undefined) updateData.post_checklist_items = JSON.stringify(postItems);
    if (tradeGrade !== undefined) updateData.trade_grade = validGrade;
    if (screenshot !== undefined) updateData.screenshot_url = screenshot || null;
    if (voiceNoteUrls !== undefined) updateData.voice_note_urls = Array.isArray(voiceNoteUrls) ? JSON.stringify(voiceNoteUrls) : '[]';
    if (lessonsLearned !== undefined) updateData.lessons_learned = (lessonsLearned && String(lessonsLearned).trim()) || null;
    if (ruleId !== undefined) updateData.rule_id = ruleId || null;
    if (ruleItems !== undefined) updateData.rule_items = JSON.stringify(Array.isArray(ruleItems) ? ruleItems : []);
    if (plannedRiskPercent !== undefined) updateData.planned_risk_percent = toFiniteNumberOrNull(plannedRiskPercent);
    if (stopLossPrice !== undefined) updateData.stop_loss_price = toFiniteNumberOrNull(stopLossPrice);
    if (takeProfitPrice !== undefined) updateData.take_profit_price = toFiniteNumberOrNull(takeProfitPrice);
    if (tradeNumberOfDay !== undefined) updateData.trade_number_of_day = Number.isInteger(Number(tradeNumberOfDay)) ? Number(tradeNumberOfDay) : null;
    if (session !== undefined) updateData.session = normalizeSession(session);
    if (riskConsistencyFlag !== undefined) updateData.risk_consistency_flag = typeof riskConsistencyFlag === 'boolean' ? riskConsistencyFlag : null;
    if (checklistCompletionPercent !== undefined) {
      updateData.checklist_completion_percent = toFiniteNumberOrNull(checklistCompletionPercent);
    }
    if (aiRecommendations !== undefined) {
      updateData.ai_recommendations = JSON.stringify(Array.isArray(aiRecommendations) ? aiRecommendations : []);
    }

    // Recompute derived risk/checklist metrics when inputs change
    const shouldRecomputeChecklist = (
      checklistItems !== undefined ||
      duringChecklistItems !== undefined ||
      postChecklistItems !== undefined ||
      ruleItems !== undefined
    );
    if (shouldRecomputeChecklist && checklistCompletionPercent === undefined) {
      updateData.checklist_completion_percent = calcChecklistCompletionPercent(preItems, durItems, postItems, Array.isArray(ruleItems) ? ruleItems : []);
    }

    const shouldRecomputeRisk =
      plannedRiskAmount !== undefined ||
      plannedRiskPercent !== undefined ||
      stopLossPrice !== undefined ||
      takeProfitPrice !== undefined ||
      plannedRR !== undefined ||
      actualRR !== undefined ||
      rMultiple !== undefined ||
      pnl !== undefined ||
      entryPrice !== undefined ||
      quantity !== undefined ||
      positionSize !== undefined;
    if (shouldRecomputeRisk) {
      const riskAmt = calcPlannedRiskAmount({
        plannedRiskAmount,
        entryPrice,
        stopLossPrice,
        quantity,
        positionSize,
      });
      const plannedRrVal = calcPlannedRR({
        plannedRR,
        entryPrice,
        stopLossPrice,
        takeProfitPrice,
      });
      const rMultipleVal = calcRMultiple({
        rMultiple,
        pnl,
        plannedRiskAmount: riskAmt,
      });
      const actualRrVal = toFiniteNumberOrNull(actualRR) ?? rMultipleVal;
      updateData.planned_risk_amount = riskAmt;
      if (plannedRR !== undefined || takeProfitPrice !== undefined || stopLossPrice !== undefined || entryPrice !== undefined) {
        updateData.planned_rr = plannedRrVal;
      }
      if (rMultiple !== undefined || pnl !== undefined || plannedRiskAmount !== undefined || stopLossPrice !== undefined || entryPrice !== undefined) {
        updateData.r_multiple = rMultipleVal;
      }
      if (actualRR !== undefined || rMultiple !== undefined || pnl !== undefined || plannedRiskAmount !== undefined) {
        updateData.actual_rr = actualRrVal;
      }
    } else if (plannedRiskAmount !== undefined) {
      updateData.planned_risk_amount = toFiniteNumberOrNull(plannedRiskAmount);
    }

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

// Bulk import trades
app.post('/api/trades/import', authenticateToken, async (req, res) => {
  try {
    const { trades: tradesToImport } = req.body;
    if (!Array.isArray(tradesToImport) || tradesToImport.length === 0) {
      return res.status(400).json({ error: 'Trades array is required' });
    }
    const defaultJournal = await db.query(
      'SELECT id FROM journals WHERE user_id = $1 ORDER BY created_at LIMIT 1',
      [req.user.id]
    );
    const journalId = defaultJournal.rows[0]?.id || null;
    const imported = [];
    for (const t of tradesToImport) {
      const symbol = t.symbol || 'UNKNOWN';
      const tradeType = t.tradeType || t.trade_type || 'long';
      const entryPrice = parseFloat(t.entryPrice ?? t.entry_price ?? 0) || 0;
      const exitPrice = parseFloat(t.exitPrice ?? t.exit_price ?? 0) || 0;
      const quantity = parseFloat(t.quantity ?? 1) || 1;
      const pnl = t.pnl != null ? parseFloat(t.pnl) : (exitPrice - entryPrice) * quantity;
      const entryTime = t.entryTime || t.entry_time || new Date().toISOString();
      const exitTime = t.exitTime || t.exit_time || entryTime;
      const result = await db.query(
        `INSERT INTO trades (user_id, journal_id, symbol, type, trade_type, direction, entry_price, exit_price, quantity, position_size, entry_time, exit_time, emotion, notes, tags, pnl)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
        [req.user.id, journalId, symbol, 'buy', tradeType, 'buy', entryPrice, exitPrice, quantity, quantity * entryPrice, entryTime, exitTime, t.emotion || null, t.notes || null, t.tags ? JSON.stringify(t.tags) : null, pnl]
      );
      imported.push(result.rows[0].id);
    }
    res.status(201).json({ imported: imported.length, ids: imported });
  } catch (error) {
    console.error('Import trades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Recommendation Completions endpoints
app.post('/api/ai-recommendation-completions', authenticateToken, async (req, res) => {
  try {
    const { trade_id, recommendation_text, completed, journal_id } = req.body;
    const userId = req.user.id;

    if (!trade_id || !recommendation_text) {
      return res.status(400).json({ error: 'trade_id and recommendation_text are required' });
    }

    // Upsert completion record
    const result = await db.query(
      `INSERT INTO ai_recommendation_completions 
       (user_id, journal_id, trade_id, recommendation_text, completed, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (trade_id, recommendation_text) 
       DO UPDATE SET completed = $5, updated_at = NOW()
       RETURNING *`,
      [userId, journal_id || null, trade_id, recommendation_text, completed || false]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[POST /ai-recommendation-completions] Error:', error);
    res.status(500).json({ error: 'Failed to save recommendation completion' });
  }
});

app.get('/api/ai-recommendation-completions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { trade_id, journal_id } = req.query;

    let query = 'SELECT * FROM ai_recommendation_completions WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (trade_id) {
      query += ` AND trade_id = $${paramIndex}`;
      params.push(trade_id);
      paramIndex++;
    }

    if (journal_id) {
      query += ` AND journal_id = $${paramIndex}`;
      params.push(journal_id);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('[GET /ai-recommendation-completions] Error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendation completions' });
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
      dateFilter += ` AND t.journal_id = $${paramCount}`;
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

// Trading insights via n8n data analyzer (trades + notes + AI analysis)
app.get('/api/analytics/insights', authenticateToken, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 100, 200);

    const [tradesResult, notesResult] = await Promise.all([
      db.query(
        `SELECT t.*, j.name as journal_name FROM trades t
         LEFT JOIN journals j ON t.journal_id = j.id
         WHERE t.user_id = $1
         ORDER BY t.entry_time DESC
         LIMIT $2`,
        [req.user.id, limitNum]
      ),
      db.query(
        `SELECT id, title, content, category, tags, trade_id, created_at
         FROM education_notes
         WHERE user_id = $1
         ORDER BY updated_at DESC
         LIMIT 100`,
        [req.user.id]
      ),
    ]);

    const trades = tradesResult.rows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      trade_type: r.trade_type,
      entry_price: parseFloat(r.entry_price) || 0,
      exit_price: r.exit_price ? parseFloat(r.exit_price) : null,
      quantity: parseFloat(r.quantity) || 0,
      pnl: parseFloat(r.pnl) || 0,
      pnl_percent: parseFloat(r.pnl_percent) || 0,
      emotion: r.emotion,
      emotions: r.emotions,
      setup_type: r.setup_type,
      session: r.session,
      entry_time: r.entry_time,
      exit_time: r.exit_time,
      duration: parseInt(r.duration, 10) || 0,
      r_multiple: r.r_multiple ? parseFloat(r.r_multiple) : null,
      confidence_level: r.confidence_level ? parseInt(r.confidence_level, 10) : null,
      execution_quality: r.execution_quality ? parseInt(r.execution_quality, 10) : null,
      checklist_completion_percent: r.checklist_completion_percent ? parseFloat(r.checklist_completion_percent) : null,
      trade_grade: r.trade_grade,
      planned_risk_percent: r.planned_risk_percent ? parseFloat(r.planned_risk_percent) : null,
      notes: r.notes || null,
      lessons_learned: r.lessons_learned || null,
    }));

    const normalizeTags = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (_) { return val.split ? val.split(',').map((s) => s.trim()).filter(Boolean) : []; }
      }
      return [];
    };

    const notes = notesResult.rows.map((r) => ({
      id: r.id,
      title: r.title || '',
      content: r.content || '',
      category: r.category,
      tags: normalizeTags(r.tags),
      trade_id: r.trade_id,
      created_at: r.created_at,
    })).filter((n) => n.content || n.title);

    // Pre-compute analysis from trades (mirrors Analysis page analytics)
    const analysis = computeAnalysisFromTrades(trades);

    const baseUrl = (process.env.N8N_BASE_URL || 'http://localhost:5678').replace(/\/$/, '');
    const webhookPath = process.env.N8N_INSIGHTS_WEBHOOK_PATH || 'webhook/tradebuddy-insights';
    const webhookUrl = `${baseUrl}/${webhookPath}`;
    const apiKey = process.env.N8N_API_KEY;

    const payload = { trades, notes, analysis };

    const fetchOpts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
    };
    if (apiKey) fetchOpts.headers['X-N8N-API-KEY'] = apiKey;

    const n8nRes = await fetch(webhookUrl, fetchOpts);
    const contentType = n8nRes.headers.get('content-type') || '';
    let insights;
    if (contentType.includes('application/json')) {
      insights = await n8nRes.json();
    } else {
      const text = await n8nRes.text();
      try { insights = JSON.parse(text); } catch (_) { insights = { raw: text }; }
    }

    // Log n8n response for debugging (summary and aiAnalysis fields)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Insights] n8n response status:', n8nRes.status);
      console.log('[Insights] summary present:', !!insights.summary);
      console.log('[Insights] aiAnalysis present:', !!insights.aiAnalysis);
      if (insights.summary) console.log('[Insights] summary preview:', insights.summary.substring(0, 100));
      if (insights.aiAnalysis) console.log('[Insights] aiAnalysis preview:', insights.aiAnalysis.substring(0, 100));
    }

    if (!n8nRes.ok) {
      return res.status(502).json({
        error: 'Insights service unavailable',
        fallback: computeLocalInsights(trades),
        n8nStatus: n8nRes.status,
      });
    }

    res.json({ ...insights, tradeCount: trades.length });
  } catch (error) {
    console.error('Insights error:', error);
    const fallback = await getFallbackInsights(req.user.id, db);
    res.status(200).json(fallback);
  }
});

function computeAnalysisFromTrades(trades) {
  if (!trades || trades.length === 0) {
    return { totalTrades: 0, winRate: 0, totalPnL: 0, profitFactor: 0, emotionPerformance: [], sessionPerformance: [], setupPerformance: [], summaryStats: {} };
  }
  const wins = trades.filter((t) => (t.pnl || 0) > 0);
  const losses = trades.filter((t) => (t.pnl || 0) < 0);
  const winRate = (wins.length / trades.length) * 100;
  const totalPnL = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const grossProfit = wins.reduce((s, t) => s + (t.pnl || 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  const rValues = trades.map((t) => t.r_multiple).filter((r) => r != null && !isNaN(r));
  const avgR = rValues.length ? rValues.reduce((a, b) => a + b, 0) / rValues.length : null;

  const byEmotion = {};
  trades.forEach((t) => {
    const e = t.emotion || 'unknown';
    if (!byEmotion[e]) byEmotion[e] = { count: 0, wins: 0, totalPnL: 0 };
    byEmotion[e].count++;
    if ((t.pnl || 0) > 0) byEmotion[e].wins++;
    byEmotion[e].totalPnL += t.pnl || 0;
  });
  const emotionPerformance = Object.entries(byEmotion).map(([emotion, d]) => ({
    emotion,
    count: d.count,
    wins: d.wins,
    winRate: d.count ? (d.wins / d.count) * 100 : 0,
    totalPnL: d.totalPnL,
    avgPnL: d.count ? d.totalPnL / d.count : 0,
  }));

  const bySession = {};
  trades.forEach((t) => {
    const s = t.session || 'Other';
    if (!bySession[s]) bySession[s] = { count: 0, wins: 0, totalPnL: 0 };
    bySession[s].count++;
    if ((t.pnl || 0) > 0) bySession[s].wins++;
    bySession[s].totalPnL += t.pnl || 0;
  });
  const sessionPerformance = Object.entries(bySession).map(([session, d]) => ({
    session,
    count: d.count,
    wins: d.wins,
    winRate: d.count ? (d.wins / d.count) * 100 : 0,
    totalPnL: d.totalPnL,
  }));

  const bySetup = {};
  trades.forEach((t) => {
    const s = t.setup_type || 'Unspecified';
    if (!bySetup[s]) bySetup[s] = { count: 0, wins: 0 };
    bySetup[s].count++;
    if ((t.pnl || 0) > 0) bySetup[s].wins++;
  });
  const setupPerformance = Object.entries(bySetup).map(([setup, d]) => ({
    setup,
    count: d.count,
    wins: d.wins,
    winRate: d.count ? (d.wins / d.count) * 100 : 0,
  }));

  const bySymbol = {};
  trades.forEach((t) => {
    const s = t.symbol || 'Unknown';
    if (!bySymbol[s]) bySymbol[s] = { count: 0, totalPnL: 0 };
    bySymbol[s].count++;
    bySymbol[s].totalPnL += t.pnl || 0;
  });
  const symbolPerformance = Object.entries(bySymbol).map(([symbol, d]) => ({
    symbol,
    count: d.count,
    totalPnL: d.totalPnL,
  })).sort((a, b) => b.count - a.count).slice(0, 15);

  const byGrade = {};
  trades.forEach((t) => {
    const g = t.trade_grade || 'Unspecified';
    if (!byGrade[g]) byGrade[g] = { count: 0, wins: 0 };
    byGrade[g].count++;
    if ((t.pnl || 0) > 0) byGrade[g].wins++;
  });
  const gradePerformance = Object.entries(byGrade).map(([grade, d]) => ({
    grade,
    count: d.count,
    wins: d.wins,
    winRate: d.count ? (d.wins / d.count) * 100 : 0,
  }));

  const checklistTrades = trades.filter((t) => t.checklist_completion_percent != null);
  const highChecklist = checklistTrades.filter((t) => t.checklist_completion_percent >= 80);
  const highChecklistWins = highChecklist.filter((t) => (t.pnl || 0) > 0).length;
  const checklistWinRate = highChecklist.length ? (highChecklistWins / highChecklist.length) * 100 : null;

  // Streaks and notable trades (sorted by entry_time DESC = most recent first)
  const sortedByTime = [...trades].sort((a, b) => {
    const ta = a.entry_time ? new Date(a.entry_time).getTime() : 0;
    const tb = b.entry_time ? new Date(b.entry_time).getTime() : 0;
    return tb - ta;
  });
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWin = 0;
  let tempLoss = 0;
  for (const t of sortedByTime) {
    const pnl = t.pnl || 0;
    if (pnl > 0) {
      tempWin++;
      tempLoss = 0;
      longestWinStreak = Math.max(longestWinStreak, tempWin);
      if (currentWinStreak === 0 && currentLossStreak === 0) currentWinStreak = tempWin;
      else if (currentLossStreak > 0) break;
    } else if (pnl < 0) {
      tempLoss++;
      tempWin = 0;
      longestLossStreak = Math.max(longestLossStreak, tempLoss);
      if (currentLossStreak === 0 && currentWinStreak === 0) currentLossStreak = tempLoss;
      else if (currentWinStreak > 0) break;
    }
  }
  if (currentWinStreak === 0 && tempWin > 0) currentWinStreak = tempWin;
  if (currentLossStreak === 0 && tempLoss > 0) currentLossStreak = tempLoss;

  const bestTrade = trades.length ? trades.reduce((best, t) => ((t.pnl || 0) > (best.pnl || 0) ? t : best), trades[0]) : null;
  const worstTrade = trades.length ? trades.reduce((worst, t) => ((t.pnl || 0) < (worst.pnl || 0) ? t : worst), trades[0]) : null;
  const recentTrades = sortedByTime.slice(0, 10);
  const recentWins = recentTrades.filter((t) => (t.pnl || 0) > 0).length;
  const recentPnl = recentTrades.reduce((s, t) => s + (t.pnl || 0), 0);

  const summaryStats = {
    currentWinStreak,
    currentLossStreak,
    longestWinStreak,
    longestLossStreak,
    bestTrade: bestTrade ? { symbol: bestTrade.symbol, pnl: bestTrade.pnl, emotion: bestTrade.emotion } : null,
    worstTrade: worstTrade ? { symbol: worstTrade.symbol, pnl: worstTrade.pnl, emotion: worstTrade.emotion } : null,
    recentTradesCount: recentTrades.length,
    recentWinRate: recentTrades.length ? (recentWins / recentTrades.length) * 100 : null,
    recentPnL: recentPnl,
  };

  return {
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate: Math.round(winRate * 10) / 10,
    totalPnL: Math.round(totalPnL * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgR: avgR != null ? Math.round(avgR * 100) / 100 : null,
    emotionPerformance,
    sessionPerformance,
    setupPerformance,
    symbolPerformance,
    gradePerformance,
    checklistWinRate: checklistWinRate != null ? Math.round(checklistWinRate * 10) / 10 : null,
    summaryStats,
  };
}

function computeLocalInsights(trades) {
  if (!trades || trades.length === 0) {
    return { summary: 'No trades to analyze yet.', habits: [], recommendations: [] };
  }
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const winRate = ((wins.length / trades.length) * 100).toFixed(1);
  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const bySymbol = {};
  const byEmotion = {};
  const bySession = {};
  trades.forEach((t) => {
    bySymbol[t.symbol || 'Unknown'] = (bySymbol[t.symbol || 'Unknown'] || 0) + 1;
    byEmotion[t.emotion || 'unknown'] = (byEmotion[t.emotion || 'unknown'] || 0) + 1;
    bySession[t.session || 'Other'] = (bySession[t.session || 'Other'] || 0) + 1;
  });
  const topSymbol = Object.entries(bySymbol).sort((a, b) => b[1] - a[1])[0];
  const topEmotion = Object.entries(byEmotion).sort((a, b) => b[1] - a[1])[0];
  const habits = [
    `Win rate: ${winRate}% (${wins.length} wins, ${losses.length} losses)`,
    `Most traded symbol: ${topSymbol?.[0] || 'N/A'} (${topSymbol?.[1] || 0} trades)`,
    `Most common emotion: ${topEmotion?.[0] || 'N/A'}`,
  ];
  const recommendations = [];
  if (parseFloat(winRate) < 50 && losses.length > 0) {
    recommendations.push('Consider tightening entry criteria or improving risk management.');
  }
  if (Object.keys(bySession).length > 0) {
    recommendations.push('Review performance by session to find your best trading hours.');
  }
  return {
    summary: `Analyzed ${trades.length} trades. Total P&L: ${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}.`,
    habits,
    recommendations,
  };
}

async function getFallbackInsights(userId, db) {
  const r = await db.query(
    'SELECT * FROM trades WHERE user_id = $1 ORDER BY entry_time DESC LIMIT 200',
    [userId]
  );
  const normalize = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch (_) { return []; }
  };
  const trades = r.rows.map((row) => ({
    ...row,
    pnl: parseFloat(row.pnl) || 0,
    pnl_percent: parseFloat(row.pnl_percent) || 0,
    r_multiple: row.r_multiple ? parseFloat(row.r_multiple) : null,
  }));
  return { ...computeLocalInsights(trades), tradeCount: trades.length };
}

// File upload - use any() to accept any field name (file, screenshot, voice) and any file type
app.post('/api/upload', authenticateToken, (req, res, next) => {
  res.setHeader('X-Backend', 'tradebuddy-app');
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    next();
  });
}, (req, res) => {
  try {
    const file = req.files?.[0] || req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${file.filename}`;
    res.json({ url: fileUrl, filename: file.filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve uploaded files (use same absolute path as multer)
app.use('/uploads', express.static(uploadsDir));
// Legacy: serve lovable-uploads (older screenshots from index.js / public folder)
const lovableUploadsDir = path.join(__dirname, '../public/lovable-uploads');
if (fs.existsSync(lovableUploadsDir)) {
  app.use('/lovable-uploads', express.static(lovableUploadsDir));
}

// Screenshot proxy: try both upload dirs when direct path might be wrong
app.get('/api/serve-screenshot', (req, res) => {
  const rawPath = req.query.path;
  if (!rawPath || typeof rawPath !== 'string') {
    return res.status(400).json({ error: 'path query required' });
  }
  const clean = rawPath.replace(/^\/+/, '').replace(/\.\./g, '');
  const filename = path.basename(clean);
  const allowedDirs = [path.resolve(uploadsDir)];
  if (fs.existsSync(lovableUploadsDir)) allowedDirs.push(path.resolve(lovableUploadsDir));
  const candidates = [
    path.join(uploadsDir, filename),
    ...(fs.existsSync(lovableUploadsDir) ? [path.join(lovableUploadsDir, filename)] : []),
  ];
  for (const filePath of candidates) {
    const resolved = path.resolve(filePath);
    const inAllowed = allowedDirs.some((d) => resolved === d || resolved.startsWith(d + path.sep));
    if (fs.existsSync(filePath) && inAllowed) {
      return res.sendFile(resolved);
    }
  }
  res.status(404).json({ error: 'Screenshot not found' });
});

// Setup Types API
app.get('/api/setup-types', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM setup_types WHERE user_id = $1 ORDER BY name ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Setup types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/setup-types', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await db.query(
      'INSERT INTO setup_types (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, String(name).trim(), (description && String(description).trim()) || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create setup type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/setup-types/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await db.query(
      'UPDATE setup_types SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING *',
      [String(name).trim(), (description && String(description).trim()) || null, id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Setup type not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update setup type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/setup-types/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM setup_types WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Setup type not found' });
    res.json({ message: 'Setup type deleted' });
  } catch (error) {
    console.error('Delete setup type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Checklists API
app.get('/api/checklists', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM checklists WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Checklists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/checklists/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM checklists WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/checklists/:id/items', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get checklist with items (JSONB column)
    const result = await db.query(
      'SELECT items FROM checklists WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    
    // Return the items array from JSONB column
    const items = result.rows[0].items || [];
    res.json(items);
  } catch (error) {
    console.error('Checklist items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/checklists', authenticateToken, async (req, res) => {
  try {
    const { name, description, items, type } = req.body;
    const checklistType = ['pre', 'during', 'post', 'rule'].includes(type) ? type : 'pre';
    
    // Prepare the items array for JSONB storage
    let itemsToStore = null;
    if (items && Array.isArray(items)) {
      itemsToStore = items.map((item, index) => ({
        id: item.id || Date.now() + index,
        text: item.text || '',
        completed: item.completed || false
      }));
    }
    
    const result = await db.query(
      'INSERT INTO checklists (name, description, items, user_id, type) VALUES ($1, $2, $3, $4, COALESCE($5::varchar, \'pre\')) RETURNING *',
      [name, description, itemsToStore ? JSON.stringify(itemsToStore) : JSON.stringify([]), req.user.id, checklistType]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/checklists/:id/items', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, checked = false } = req.body;
    
    // Get current checklist with items
    const checklistResult = await db.query(
      'SELECT items FROM checklists WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (checklistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    
    // Get current items and add new one
    const currentItems = checklistResult.rows[0].items || [];
    const newItem = {
      id: Date.now(), // Simple ID generation
      text: content,
      completed: checked
    };
    currentItems.push(newItem);
    
    // Update checklist with new items
    await db.query(
      'UPDATE checklists SET items = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
      [JSON.stringify(currentItems), id, req.user.id]
    );
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Create checklist item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/checklists/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, items, type } = req.body;
    const checklistType = ['pre', 'during', 'post', 'rule'].includes(type) ? type : 'pre';
    
    let itemsToStore = null;
    if (items && Array.isArray(items)) {
      itemsToStore = items.map((item, index) => ({
        id: item.id || Date.now() + index,
        text: item.text || '',
        completed: item.completed || false
      }));
    }
    
    const result = await db.query(
      'UPDATE checklists SET name = $1, description = $2, items = $3, type = COALESCE($4::varchar, \'pre\'), updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING *',
      [name, description, itemsToStore ? JSON.stringify(itemsToStore) : JSON.stringify([]), checklistType, id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Individual item updates are handled via the main checklist update endpoint

app.delete('/api/checklists/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete checklist (items are stored as JSONB, so no separate deletion needed)
    const result = await db.query(
      'DELETE FROM checklists WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    
    res.json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    console.error('Delete checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Individual item deletion is handled via the main checklist update endpoint

// ===== EDUCATION FOLDERS ENDPOINTS =====

app.get('/api/education-folders', authenticateToken, async (req, res) => {
  try {
    const { source } = req.query;
    let query = 'SELECT * FROM education_folders WHERE user_id = $1';
    const params = [req.user.id];
    if (source === 'from-trade' || source === 'direct') {
      params.push(source);
      query += ` AND source = $2`;
    }
    query += ' ORDER BY sort_order ASC, name ASC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Education folders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/education-folders', authenticateToken, async (req, res) => {
  try {
    const { name, source } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    const folderSource = source === 'from-trade' ? 'from-trade' : 'direct';
    const result = await db.query(
      `INSERT INTO education_folders (user_id, name, source, sort_order)
       VALUES ($1, $2, $3, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM education_folders WHERE user_id = $1 AND source = $3))
       RETURNING *`,
      [req.user.id, String(name).trim(), folderSource]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/education-folders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    const result = await db.query(
      'UPDATE education_folders SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [String(name).trim(), id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/education-folders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE education_notes SET folder_id = NULL WHERE folder_id = $1 AND user_id = $2', [id, req.user.id]);
    const result = await db.query(
      'DELETE FROM education_folders WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    res.json({ message: 'Folder deleted' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== EDUCATION NOTES ENDPOINTS =====

app.get('/api/education-notes', authenticateToken, async (req, res) => {
  try {
    const { category, search, trade_id, source, folder_id } = req.query;
    let query = 'SELECT * FROM education_notes WHERE user_id = $1';
    const params = [req.user.id];
    let paramCount = 1;

    if (folder_id) {
      paramCount++;
      if (folder_id === '__none__') {
        query += ' AND folder_id IS NULL';
      } else {
        query += ` AND folder_id = $${paramCount}`;
        params.push(folder_id);
        const folderRow = await db.query(
          'SELECT source FROM education_folders WHERE id = $1 AND user_id = $2',
          [folder_id, req.user.id]
        );
        if (folderRow.rows.length > 0) {
          if (folderRow.rows[0].source === 'from-trade') {
            query += ' AND trade_id IS NOT NULL';
          } else {
            query += ' AND trade_id IS NULL';
          }
        }
      }
    }

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (trade_id) {
      paramCount++;
      query += ` AND trade_id = $${paramCount}`;
      params.push(trade_id);
    }

    if (source === 'from-trade') {
      query += ' AND trade_id IS NOT NULL';
    } else if (source === 'direct') {
      query += ' AND trade_id IS NULL';
    }

    query += ' ORDER BY updated_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Education notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/education-notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM education_notes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Education note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/education-notes', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags, screenshot_url, trade_id, folder_id, voice_note_urls } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    let finalFolderId = folder_id || null;
    if (finalFolderId) {
      const folderCheck = await db.query(
        'SELECT source FROM education_folders WHERE id = $1 AND user_id = $2',
        [finalFolderId, req.user.id]
      );
      if (folderCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Folder not found' });
      }
      const expectedSource = trade_id ? 'from-trade' : 'direct';
      if (folderCheck.rows[0].source !== expectedSource) {
        return res.status(400).json({ error: `This folder is for ${folderCheck.rows[0].source === 'from-trade' ? 'lessons from trades' : 'direct notes'} only` });
      }
    }
    const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);
    const voiceNoteUrlsJson = Array.isArray(voice_note_urls) && voice_note_urls.length > 0
      ? JSON.stringify(voice_note_urls)
      : '[]';
    const result = await db.query(
      `INSERT INTO education_notes (user_id, title, content, category, tags, screenshot_url, trade_id, folder_id, voice_note_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, title.trim(), content.trim(), category || null, tagsArray, screenshot_url || null, trade_id || null, finalFolderId, voiceNoteUrlsJson]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create education note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/education-notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags, screenshot_url, folder_id, voice_note_urls } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    let finalFolderId = folder_id !== undefined ? (folder_id || null) : undefined;
    if (finalFolderId !== undefined && finalFolderId) {
      const [folderCheck, noteRow] = await Promise.all([
        db.query('SELECT source FROM education_folders WHERE id = $1 AND user_id = $2', [finalFolderId, req.user.id]),
        db.query('SELECT trade_id FROM education_notes WHERE id = $1 AND user_id = $2', [id, req.user.id]),
      ]);
      if (folderCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Folder not found' });
      }
      if (noteRow.rows.length === 0) {
        return res.status(404).json({ error: 'Note not found' });
      }
      const expectedSource = noteRow.rows[0].trade_id ? 'from-trade' : 'direct';
      if (folderCheck.rows[0].source !== expectedSource) {
        return res.status(400).json({ error: `This folder is for ${folderCheck.rows[0].source === 'from-trade' ? 'lessons from trades' : 'direct notes'} only` });
      }
    }
    const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);
    const updates = { title: title.trim(), content: content.trim(), category: category || null, tags: tagsArray };
    if (screenshot_url !== undefined) updates.screenshot_url = screenshot_url ?? null;
    if (finalFolderId !== undefined) updates.folder_id = finalFolderId;
    if (voice_note_urls !== undefined) {
      updates.voice_note_urls = Array.isArray(voice_note_urls) && voice_note_urls.length > 0
        ? JSON.stringify(voice_note_urls)
        : '[]';
    }
    const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = Object.values(updates);
    const result = await db.query(
      `UPDATE education_notes SET ${setClause}, updated_at = NOW() WHERE id = $${values.length + 1} AND user_id = $${values.length + 2} RETURNING *`,
      [...values, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update education note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/education-notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM education_notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete education note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== USER SETTINGS ENDPOINTS =====

// Ensure user_settings has preferences column
const ensureUserSettingsColumns = async () => {
  try {
    await db.query('ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT \'{}\'');
    console.log('✅ User settings columns ready');
  } catch (err) {
    console.warn('⚠️ Could not ensure user_settings columns:', err.message);
  }
};

// Get user settings
app.get('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT initial_balance, currency, date_format, preferences FROM user_settings WHERE user_id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      // Create default settings if they don't exist
      await db.query(
        'INSERT INTO user_settings (user_id, initial_balance, currency, date_format) VALUES ($1, $2, $3, $4)',
        [req.user.id, 10000.00, 'USD', 'MM/DD/YYYY']
      );
      return res.json({ initial_balance: 10000.00, currency: 'USD', date_format: 'MM/DD/YYYY', preferences: {} });
    }
    
    const row = result.rows[0];
    res.json({
      ...row,
      preferences: row.preferences || {},
    });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
app.put('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    const { initial_balance, currency, date_format, preferences } = req.body;
    const prefs = preferences && typeof preferences === 'object' ? JSON.stringify(preferences) : null;
    
    const result = await db.query(
      `UPDATE user_settings 
       SET initial_balance = COALESCE($1, initial_balance), 
           currency = COALESCE($2, currency), 
           date_format = COALESCE($3, date_format),
           preferences = COALESCE($4::jsonb, preferences),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5 
       RETURNING initial_balance, currency, date_format, preferences`,
      [initial_balance, currency, date_format, prefs, req.user.id]
    );
    
    if (result.rows.length === 0) {
      // Create settings if they don't exist
      const createResult = await db.query(
        'INSERT INTO user_settings (user_id, initial_balance, currency, date_format, preferences) VALUES ($1, $2, $3, $4, COALESCE($5::jsonb, \'{}\')) RETURNING initial_balance, currency, date_format, preferences',
        [req.user.id, initial_balance ?? 10000, currency ?? 'USD', date_format ?? 'MM/DD/YYYY', prefs]
      );
      return res.json(createResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Filter Sets API endpoints
const ensureFilterSetsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS filter_sets (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        filters JSONB DEFAULT '{}',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_filter_sets_user_id ON filter_sets(user_id)');
    console.log('✅ Filter sets table ready');
  } catch (err) {
    console.warn('⚠️ Could not ensure filter_sets table:', err.message);
  }
};

app.get('/api/filter-sets', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM filter_sets WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    const filterSets = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      filters: row.filters || {},
      isDefault: row.is_default || false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
    res.json({ filterSets });
  } catch (error) {
    console.error('Get filter sets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/filter-sets', authenticateToken, async (req, res) => {
  try {
    const { name, description, filters, isDefault } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await db.query(
      `INSERT INTO filter_sets (user_id, name, description, filters, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, name.trim(), description || '', JSON.stringify(filters || {}), !!isDefault]
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      name: row.name,
      description: row.description || '',
      filters: row.filters || {},
      isDefault: row.is_default || false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (error) {
    console.error('Create filter set error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/filter-sets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, filters, isDefault } = req.body;
    const result = await db.query(
      `UPDATE filter_sets SET
        name = COALESCE(NULLIF(TRIM($1), ''), name),
        description = $2,
        filters = COALESCE($3::jsonb, filters),
        is_default = COALESCE($4, is_default),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [
        name ?? null,
        description ?? null,
        filters != null ? JSON.stringify(filters) : null,
        isDefault ?? null,
        id,
        req.user.id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Filter set not found' });
    }
    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      description: row.description || '',
      filters: row.filters || {},
      isDefault: row.is_default || false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (error) {
    console.error('Update filter set error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/filter-sets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM filter_sets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Filter set not found' });
    }
    res.json({ message: 'Filter set deleted successfully' });
  } catch (error) {
    console.error('Delete filter set error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trade Templates API endpoints
app.get('/api/trade-templates', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM trade_templates WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Get trade templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/trade-templates', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      symbol,
      tradeType,
      setupType,
      marketCondition,
      confidenceLevel,
      notes,
      tags,
      isActive
    } = req.body;

    const result = await db.query(
      `INSERT INTO trade_templates (
        user_id, name, description, symbol, trade_type, setup_type, 
        market_condition, confidence_level, notes, tags, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        req.user.id, name, description, symbol, tradeType, setupType,
        marketCondition, confidenceLevel, notes, 
        tags ? JSON.stringify(tags) : null, isActive
      ]
    );

    res.status(201).json({ template: result.rows[0] });
  } catch (error) {
    console.error('Create trade template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/trade-templates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      symbol,
      tradeType,
      setupType,
      marketCondition,
      confidenceLevel,
      notes,
      tags,
      isActive
    } = req.body;

    const result = await db.query(
      `UPDATE trade_templates SET 
        name = $1, description = $2, symbol = $3, trade_type = $4, 
        setup_type = $5, market_condition = $6, confidence_level = $7, 
        notes = $8, tags = $9, is_active = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND user_id = $12 
      RETURNING *`,
      [
        name, description, symbol, tradeType, setupType,
        marketCondition, confidenceLevel, notes,
        tags ? JSON.stringify(tags) : null, isActive, id, req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Update trade template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/trade-templates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `DELETE FROM trade_templates WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete trade template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});



// Activate account (switch to it)
app.post('/api/accounts/:id/activate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, deactivate all journals for this user
    await db.query('UPDATE journals SET is_active = false WHERE user_id = $1', [req.user.id]);
    
    // Then activate the selected journal
    const result = await db.query(`
      UPDATE journals 
      SET is_active = true 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found or already blown/passed' });
    }

    res.json({ message: 'Account activated successfully' });
  } catch (error) {
    console.error('Activate account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark account as blown
app.post('/api/accounts/:id/blow', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      UPDATE journals 
      SET is_active = false, is_blown = true, blown_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account marked as blown successfully' });
  } catch (error) {
    console.error('Mark account as blown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark account as passed
app.post('/api/accounts/:id/pass', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      UPDATE journals 
      SET is_active = false, is_passed = true, passed_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account marked as passed successfully' });
  } catch (error) {
    console.error('Mark account as passed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single account
app.get('/api/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        j.*,
        COUNT(t.id) as total_trades,
        COALESCE(SUM(t.pnl), 0) as total_pnl,
        CASE 
          WHEN COUNT(t.id) > 0 THEN 
            (COUNT(CASE WHEN t.pnl > 0 THEN 1 END)::float / COUNT(t.id)) * 100
          ELSE 0 
        END as win_rate
      FROM journals j
      LEFT JOIN trades t ON j.id = t.journal_id AND t.user_id = j.user_id
      WHERE j.id = $1 AND j.user_id = $2
      GROUP BY j.id
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const journal = result.rows[0];
    const account = {
      id: journal.id,
      name: journal.name,
      initialBalance: parseFloat(journal.initial_balance) || 0,
      currentBalance: parseFloat(journal.current_balance) || 0,
      isActive: journal.is_active || false,
      isBlown: journal.is_blown || false,
      isPassed: journal.is_passed || false,
      createdAt: journal.created_at,
      blownAt: journal.blown_at,
      passedAt: journal.passed_at,
      accountType: journal.account_type || 'paper',
      broker: journal.broker || 'Unknown',
      currency: journal.currency || 'USD',
      totalTrades: parseInt(journal.total_trades) || 0,
      totalPnL: parseFloat(journal.total_pnl) || 0,
      winRate: parseFloat(journal.win_rate) || 0
    };

    res.json({ account });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update account
app.put('/api/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, accountType, broker, initialBalance, currentBalance, currency } = req.body;
    
    const result = await db.query(`
      UPDATE journals 
      SET 
        name = COALESCE($3, name),
        account_type = COALESCE($4, account_type),
        broker = COALESCE($5, broker),
        initial_balance = COALESCE($6, initial_balance),
        current_balance = COALESCE($7, current_balance),
        currency = COALESCE($8, currency),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, req.user.id, name, accountType, broker, initialBalance, currentBalance, currency]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const journal = result.rows[0];
    const account = {
      id: journal.id,
      name: journal.name,
      initialBalance: parseFloat(journal.initial_balance) || 0,
      currentBalance: parseFloat(journal.current_balance) || 0,
      isActive: journal.is_active || false,
      isBlown: journal.is_blown || false,
      isPassed: journal.is_passed || false,
      createdAt: journal.created_at,
      blownAt: journal.blown_at,
      passedAt: journal.passed_at,
      accountType: journal.account_type || 'paper',
      broker: journal.broker || 'Unknown',
      currency: journal.currency || 'USD'
    };

    res.json({ account });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete account
app.delete('/api/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if account exists and belongs to user
    const checkResult = await db.query(
      'SELECT id FROM journals WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Delete account (CASCADE will handle trades)
    await db.query('DELETE FROM journals WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Goals API endpoints
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { journal_id } = req.query;
    let query = 'SELECT * FROM goals WHERE user_id = $1';
    let params = [req.user.id];
    
    if (journal_id) {
      query += ' AND journal_id = $2';
      params.push(journal_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    
    const goals = result.rows.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      goalType: goal.goal_type,
      targetValue: parseFloat(goal.target_value) || 0,
      currentValue: parseFloat(goal.current_value) || 0,
      unit: goal.unit,
      period: goal.period,
      status: goal.status,
      startDate: goal.start_date,
      endDate: goal.end_date,
      journalId: goal.journal_id,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at
    }));
    
    res.json({ goals });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { title, description, goalType, targetValue, unit, period, journalId, startDate, endDate } = req.body;
    
    const result = await db.query(
      'INSERT INTO goals (user_id, journal_id, title, description, goal_type, target_value, unit, period, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [req.user.id, journalId || null, title, description, goalType, targetValue, unit, period, startDate, endDate]
    );
    
    const goal = result.rows[0];
    const responseGoal = {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      goalType: goal.goal_type,
      targetValue: parseFloat(goal.target_value) || 0,
      currentValue: parseFloat(goal.current_value) || 0,
      unit: goal.unit,
      period: goal.period,
      status: goal.status,
      startDate: goal.start_date,
      endDate: goal.end_date,
      journalId: goal.journal_id,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at
    };
    
    res.status(201).json(responseGoal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, goalType, targetValue, currentValue, unit, period, status, startDate, endDate } = req.body;
    
    const result = await db.query(
      'UPDATE goals SET title = $1, description = $2, goal_type = $3, target_value = $4, current_value = $5, unit = $6, period = $7, status = $8, start_date = $9, end_date = $10 WHERE id = $11 AND user_id = $12 RETURNING *',
      [title, description, goalType, targetValue, currentValue, unit, period, status, startDate, endDate, id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const goal = result.rows[0];
    const responseGoal = {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      goalType: goal.goal_type,
      targetValue: parseFloat(goal.target_value) || 0,
      currentValue: parseFloat(goal.current_value) || 0,
      unit: goal.unit,
      period: goal.period,
      status: goal.status,
      startDate: goal.start_date,
      endDate: goal.end_date,
      journalId: goal.journal_id,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at
    };
    
    res.json(responseGoal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// NO TRADE DAYS API - Days with no trades + chart notes
// ==============================================

function normalizeNoTradeDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  // Extract YYYY-MM-DD via regex only - never use Date() to avoid timezone shift
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

app.get('/api/no-trade-days', authenticateToken, async (req, res) => {
  try {
    const { journal_id, start_date, end_date } = req.query;
    const normStart = normalizeNoTradeDate(start_date);
    const normEnd = normalizeNoTradeDate(end_date);
    let query = 'SELECT id, user_id, journal_id, date, notes, screenshot_url, voice_note_urls, created_at, updated_at FROM no_trade_days WHERE user_id = $1';
    const params = [req.user.id];
    let paramCount = 2;

    if (journal_id) {
      query += ` AND journal_id = $${paramCount}`;
      params.push(String(journal_id).trim());
      paramCount++;
    }
    if (normStart) {
      query += ` AND date >= $${paramCount}::date`;
      params.push(normStart);
      paramCount++;
    }
    if (normEnd) {
      query += ` AND date <= $${paramCount}::date`;
      params.push(normEnd);
      paramCount++;
    }

    query += ' ORDER BY date DESC';
    const result = await db.query(query, params);

    const items = result.rows.map(r => {
      const dateStr = r.date ? String(r.date).slice(0, 10) : '';
      return {
        id: r.id,
        userId: r.user_id,
        journalId: r.journal_id,
        date: dateStr,
        notes: r.notes || '',
        screenshotUrl: r.screenshot_url || null,
        voice_note_urls: Array.isArray(r.voice_note_urls) ? r.voice_note_urls : (typeof r.voice_note_urls === 'string' ? (() => { try { return JSON.parse(r.voice_note_urls); } catch { return []; } })() : []),
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    });

    if (config.nodeEnv === 'development') {
      console.log(`[no-trade-days GET] user=${req.user.id} journal=${journal_id} range=${normStart}..${normEnd} => ${items.length} rows`);
    }
    res.json(items);
  } catch (error) {
    console.error('Get no-trade-days error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/no-trade-days', authenticateToken, async (req, res) => {
  try {
    const { date, notes, journalId, screenshotUrl, voice_note_urls } = req.body;
    const normDate = normalizeNoTradeDate(date);
    if (!normDate) {
      return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
    }

    let finalJournalId = journalId ? String(journalId).trim() : null;
    if (!finalJournalId) {
      const def = await db.query('SELECT id FROM journals WHERE user_id = $1 ORDER BY created_at LIMIT 1', [req.user.id]);
      finalJournalId = def.rows[0]?.id || null;
    }

    const existing = await db.query(
      'SELECT id FROM no_trade_days WHERE user_id = $1 AND (journal_id IS NOT DISTINCT FROM $2) AND date = $3::date',
      [req.user.id, finalJournalId, normDate]
    );

    const voiceNoteUrlsJson = Array.isArray(voice_note_urls) && voice_note_urls.length > 0
      ? JSON.stringify(voice_note_urls)
      : '[]';

    let r;
    if (existing.rows.length > 0) {
      const upd = await db.query(
        'UPDATE no_trade_days SET notes = $1, screenshot_url = COALESCE($2, screenshot_url), voice_note_urls = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [notes || '', screenshotUrl || null, voiceNoteUrlsJson, existing.rows[0].id]
      );
      r = upd.rows[0];
    } else {
      const ins = await db.query(
        `INSERT INTO no_trade_days (user_id, journal_id, date, notes, screenshot_url, voice_note_urls)
         VALUES ($1, $2, $3::date, $4, $5, $6)
         RETURNING *`,
        [req.user.id, finalJournalId, normDate, notes || '', screenshotUrl || null, voiceNoteUrlsJson]
      );
      r = ins.rows[0];
    }
    const dateStr = r.date ? String(r.date).slice(0, 10) : normDate;
    if (config.nodeEnv === 'development') {
      console.log(`[no-trade-days POST] user=${req.user.id} journal=${finalJournalId} date=${normDate} => ${existing.rows.length ? 'updated' : 'inserted'} id=${r.id}`);
    }
    res.status(201).json({
      id: r.id,
      userId: r.user_id,
      journalId: r.journal_id,
      date: dateStr,
      notes: r.notes || '',
      screenshotUrl: r.screenshot_url || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    });
  } catch (error) {
    console.error('Post no-trade-days error:', error);
    const msg = error && error.message ? error.message : 'Internal server error';
    res.status(500).json({ error: msg });
  }
});

app.put('/api/no-trade-days/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, notes, screenshotUrl, voice_note_urls } = req.body;

    const updates = [];
    const params = [];
    let i = 1;
    if (date !== undefined) {
      const normDate = normalizeNoTradeDate(date);
      if (!normDate) return res.status(400).json({ error: 'Invalid date format' });
      updates.push(`date = $${i}::date`); params.push(normDate); i++;
    }
    if (notes !== undefined) { updates.push(`notes = $${i}`); params.push(notes); i++; }
    if (screenshotUrl !== undefined) { updates.push(`screenshot_url = $${i}`); params.push(screenshotUrl); i++; }
    if (voice_note_urls !== undefined) {
      const voiceNoteUrlsJson = Array.isArray(voice_note_urls) && voice_note_urls.length > 0
        ? JSON.stringify(voice_note_urls)
        : '[]';
      updates.push(`voice_note_urls = $${i}`); params.push(voiceNoteUrlsJson); i++;
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    params.push(id, req.user.id);
    const result = await db.query(
      `UPDATE no_trade_days SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No trade day entry not found' });
    }

    const r = result.rows[0];
    const dateStr = r.date ? String(r.date).slice(0, 10) : '';
    res.json({
      id: r.id,
      userId: r.user_id,
      journalId: r.journal_id,
      date: dateStr,
      notes: r.notes || '',
      screenshotUrl: r.screenshot_url || null,
      voice_note_urls: Array.isArray(r.voice_note_urls) ? r.voice_note_urls : (typeof r.voice_note_urls === 'string' ? (() => { try { return JSON.parse(r.voice_note_urls); } catch { return []; } })() : []),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    });
  } catch (error) {
    console.error('Put no-trade-days error:', error);
    const msg = error && error.message ? error.message : 'Internal server error';
    res.status(500).json({ error: msg });
  }
});

app.delete('/api/no-trade-days/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM no_trade_days WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No trade day entry not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete no-trade-days error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

// Ensure education_notes and education_folders tables exist on startup
const ensureEducationNotesTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS education_folders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        source VARCHAR(20) DEFAULT 'direct',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_education_folders_user_id ON education_folders(user_id)');
    await db.query(`ALTER TABLE education_folders ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'direct'`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS education_notes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100),
        tags TEXT[],
        screenshot_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_education_notes_user_id ON education_notes(user_id)');
    await db.query(`ALTER TABLE education_notes ADD COLUMN IF NOT EXISTS screenshot_url TEXT`);
    await db.query(`ALTER TABLE education_notes ADD COLUMN IF NOT EXISTS trade_id UUID`);
    await db.query(`ALTER TABLE education_notes ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES education_folders(id) ON DELETE SET NULL`);
    await db.query(`ALTER TABLE education_notes ADD COLUMN IF NOT EXISTS voice_note_urls JSONB DEFAULT '[]'`);
    await db.query(`ALTER TABLE checklists ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'pre'`);
    await db.query(`ALTER TABLE checklists ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'`);
    console.log('✅ Education notes table ready');
  } catch (err) {
    console.warn('⚠️ Could not ensure education_notes table:', err.message);
  }
};

// Ensure trades table has required columns for add-trade
const ensureTradesColumns = async () => {
  const columns = [
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS journal_id UUID',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_type VARCHAR(20)',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS direction VARCHAR(10)',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS position_size DECIMAL(15,2)',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS confidence_level INTEGER',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS execution_quality INTEGER',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS setup_type VARCHAR(100)',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS market_condition VARCHAR(100)',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS tags TEXT',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS screenshot_url TEXT',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS checklist_id UUID',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS checklist_items JSONB',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS during_checklist_id UUID',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS during_checklist_items JSONB',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS post_checklist_id UUID',
    'ALTER TABLE trades ADD COLUMN IF NOT EXISTS post_checklist_items JSONB',
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS voice_note_urls JSONB DEFAULT '[]'",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_grade VARCHAR(5)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS lessons_learned TEXT",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS rule_id UUID",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS rule_items JSONB",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS planned_risk_amount DECIMAL(15,6)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS planned_risk_percent DECIMAL(10,6)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss_price DECIMAL(15,6)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS take_profit_price DECIMAL(15,6)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS planned_rr DECIMAL(15,6)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS actual_rr DECIMAL(15,6)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS r_multiple DECIMAL(15,6)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_number_of_day INTEGER",
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_session_enum') THEN CREATE TYPE trade_session_enum AS ENUM ('Asia','London','NewYork','Other'); END IF; END $$",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS session trade_session_enum",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS risk_consistency_flag BOOLEAN",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS checklist_completion_percent DECIMAL(5,2)",
  ];
  try {
    for (const sql of columns) {
      await db.query(sql);
    }
    console.log('✅ Trades table columns ready');
  } catch (err) {
    console.warn('⚠️ Could not ensure trades columns:', err.message);
  }
};

// Ensure no_trade_days table exists
const ensureNoTradeDaysTable = async () => {
  try {
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await db.query(`
      CREATE TABLE IF NOT EXISTS no_trade_days (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_no_trade_days_user ON no_trade_days(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_no_trade_days_journal ON no_trade_days(journal_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_no_trade_days_date ON no_trade_days(date)');
    await db.query('ALTER TABLE no_trade_days ADD COLUMN IF NOT EXISTS screenshot_url TEXT');
    await db.query(`ALTER TABLE no_trade_days ADD COLUMN IF NOT EXISTS voice_note_urls JSONB DEFAULT '[]'`);
    console.log('✅ No trade days table ready');
  } catch (err) {
    console.warn('⚠️ Could not ensure no_trade_days table:', err.message);
  }
};

// Ensure setup_types table exists
const ensureSetupTypesTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS setup_types (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_setup_types_user_id ON setup_types(user_id)');
    console.log('✅ Setup types table ready');
  } catch (err) {
    console.warn('⚠️ Could not ensure setup_types table:', err.message);
  }
};

// Start server
const startServer = async () => {
  await ensureEducationNotesTable();
  await ensureSetupTypesTable();
  await ensureNoTradeDaysTable();
  await ensureTradesColumns();
  await ensureFilterSetsTable();
  await ensureUserSettingsColumns();
app.listen(config.port, () => {
  console.log(`🚀 TradeBuddy API running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔒 Security: ${config.nodeEnv === 'production' ? 'Enabled' : 'Development mode'}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
