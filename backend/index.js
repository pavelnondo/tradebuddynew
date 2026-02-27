require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const { 
  createUser, 
  findUserByCredentials, 
  findUserByTelegramId, 
  createOrLinkTelegramUser,
  generateToken, 
  authenticateToken, 
  optionalAuth 
} = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());
// Serve static files (screenshots and assets) via /public
app.use('/public', express.static(path.join(__dirname, '../public')));

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'tradebuddy_user',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'tradebuddy',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5440,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Set up multer for screenshot uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/lovable-uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Authentication endpoints
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const user = await createUser(username, email, password);
    const token = generateToken(user.id, user.username, user.role);
    
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await findUserByCredentials(email, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = generateToken(user.id, user.username, user.role);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/telegram', async (req, res) => {
  try {
    const { telegramId, telegramUsername } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }
    
    const user = await createOrLinkTelegramUser(telegramId, telegramUsername);
    const token = generateToken(user.id, user.username, user.role);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, telegram_id, telegram_username, role FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected routes - require authentication
app.get('/trades', optionalAuth, async (req, res) => {
  try {
    let query = 'SELECT * FROM trades';
    let params = [];
    
    // If user is authenticated, filter by user_id
    if (req.user) {
      query += ' WHERE user_id = $1';
      params.push(req.user.userId);
    }
    
    query += ' ORDER BY id DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a trade (now supports advanced fields)
app.post('/trades', optionalAuth, async (req, res) => {
  console.log('Received /trades POST:', req.body);
  const {
    symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes,
    emotion, setup, execution_quality, duration, checklist_id, checklist_completed, screenshot
  } = req.body;
  
  // User-friendly error if symbol is missing or empty
  if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
    return res.status(400).json({ error: "The 'symbol' field is required and cannot be empty." });
  }

  try {
    const checklistCompletedJson = checklist_completed ? JSON.stringify(checklist_completed) : null;
    const userId = req.user ? req.user.userId : null;
    
    const result = await pool.query(
      `INSERT INTO trades (symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes,
        emotion, setup, execution_quality, duration, checklist_id, checklist_completed, screenshot, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes,
        emotion, setup, execution_quality, duration, checklist_id, checklistCompletedJson, screenshot, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a trade (now supports advanced fields)
app.put('/trades/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;
  const {
    symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes,
    emotion, setup, execution_quality, duration, checklist_id, checklist_completed, screenshot
  } = req.body;
  try {
    const checklistCompletedJson = checklist_completed ? JSON.stringify(checklist_completed) : null;
    const userId = req.user ? req.user.userId : null;
    
    let query = `UPDATE trades SET symbol=$1, type=$2, entry_price=$3, exit_price=$4, quantity=$5, entry_time=$6, exit_time=$7, pnl=$8, notes=$9,
        emotion=$10, setup=$11, execution_quality=$12, duration=$13, checklist_id=$14, checklist_completed=$15, screenshot=$16`;
    let params = [symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes,
        emotion, setup, execution_quality, duration, checklist_id, checklistCompletedJson, screenshot];
    
    if (userId) {
      query += ` WHERE id=$17 AND user_id=$18 RETURNING *`;
      params.push(id, userId);
    } else {
      query += ` WHERE id=$17 RETURNING *`;
      params.push(id);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found or access denied' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a trade
app.delete('/trades/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const userId = req.user ? req.user.userId : null;
    
    let query = 'DELETE FROM trades WHERE id=$1';
    let params = [id];
    
    if (userId) {
      query += ' AND user_id=$2';
      params.push(userId);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Trade not found or access denied' });
    }
    
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all checklists
app.get('/checklists', optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    
    let query = 'SELECT * FROM checklists';
    let params = [];
    
    if (userId) {
      query += ' WHERE user_id = $1';
      params.push(userId);
    }
    
    query += ' ORDER BY id DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single checklist by ID
app.get('/checklists/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const userId = req.user ? req.user.userId : null;
    
    let query = 'SELECT * FROM checklists WHERE id=$1';
    let params = [id];
    
    if (userId) {
      query += ' AND user_id=$2';
      params.push(userId);
    }
    
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found or access denied' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get checklist items for a checklist
app.get('/checklists/:id/items', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM checklist_items WHERE checklist_id=$1', [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all screenshots
app.get('/screenshots', optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    
    let query = 'SELECT * FROM screenshots';
    let params = [];
    
    if (userId) {
      query += ' WHERE user_id = $1';
      params.push(userId);
    }
    
    query += ' ORDER BY id DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Screenshot upload endpoint
app.post('/upload', optionalAuth, upload.single('screenshot'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const userId = req.user ? req.user.userId : null;
    const url = `/public/lovable-uploads/${req.file.filename}`;
    
    // Save screenshot record to database with user_id
    if (userId) {
      await pool.query(
        'INSERT INTO screenshots (file_path, user_id) VALUES ($1, $2)',
        [url, userId]
      );
    }
    
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CHECKLIST CRUD ---
// Create a checklist
app.post('/checklists', optionalAuth, async (req, res) => {
  const { name, description } = req.body;
  try {
    const userId = req.user ? req.user.userId : null;
    
    const result = await pool.query(
      'INSERT INTO checklists (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a checklist
app.put('/checklists/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const userId = req.user ? req.user.userId : null;
    
    let query = 'UPDATE checklists SET name=$1, description=$2 WHERE id=$3';
    let params = [name, description, id];
    
    if (userId) {
      query += ' AND user_id=$4';
      params.push(userId);
    }
    
    query += ' RETURNING *';
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found or access denied' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a checklist (and its items)
app.delete('/checklists/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const userId = req.user ? req.user.userId : null;
    
    // First check if checklist belongs to user
    let checkQuery = 'SELECT id FROM checklists WHERE id=$1';
    let checkParams = [id];
    
    if (userId) {
      checkQuery += ' AND user_id=$2';
      checkParams.push(userId);
    }
    
    const checkResult = await pool.query(checkQuery, checkParams);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found or access denied' });
    }
    
    // Delete checklist items and checklist
    await pool.query('DELETE FROM checklist_items WHERE checklist_id=$1', [id]);
    await pool.query('DELETE FROM checklists WHERE id=$1', [id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk delete all items for a checklist
app.delete('/checklists/:id/items', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM checklist_items WHERE checklist_id=$1', [id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// --- CHECKLIST ITEM CRUD ---
// Create a checklist item
app.post('/checklists/:id/items', async (req, res) => {
  const { id } = req.params;
  const { content, checked } = req.body;
  console.log('Creating checklist item:', { checklist_id: id, content, checked });
  try {
    const result = await pool.query(
      'INSERT INTO checklist_items (checklist_id, content, checked) VALUES ($1, $2, $3) RETURNING *',
      [id, content, checked || false]
    );
    console.log('Checklist item created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating checklist item:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a checklist item
app.put('/checklists/:checklistId/items/:itemId', async (req, res) => {
  const { checklistId, itemId } = req.params;
  const { content, checked } = req.body;
  try {
    const result = await pool.query(
      'UPDATE checklist_items SET content=$1, checked=$2 WHERE id=$3 AND checklist_id=$4 RETURNING *',
      [content, checked, itemId, checklistId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a checklist item
app.delete('/checklists/:checklistId/items/:itemId', async (req, res) => {
  const { checklistId, itemId } = req.params;
  try {
    await pool.query('DELETE FROM checklist_items WHERE id=$1 AND checklist_id=$2', [itemId, checklistId]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================
// NO TRADE DAYS API - /api prefix for frontend
// ==============================================
async function ensureNoTradeDaysTable() {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS no_trade_days (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        notes TEXT,
        screenshot_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await pool.query('ALTER TABLE no_trade_days ADD COLUMN IF NOT EXISTS screenshot_url TEXT').catch(() => {});
  } catch (e) { /* ignore */ }
}

// No-trade-days routes (with /api prefix for frontend)
app.get('/api/no-trade-days', authenticateToken, async (req, res) => {
  try {
    const { journal_id, start_date, end_date } = req.query;
    let query = 'SELECT * FROM no_trade_days WHERE user_id = $1';
    const params = [req.user.userId];
    let i = 2;
    if (journal_id) { query += ` AND journal_id = $${i}`; params.push(journal_id); i++; }
    if (start_date) { query += ` AND date >= $${i}`; params.push(start_date); i++; }
    if (end_date) { query += ` AND date <= $${i}`; params.push(end_date); }
    query += ' ORDER BY date DESC';
    const result = await pool.query(query, params);
    const items = result.rows.map(r => ({
      id: r.id, userId: r.user_id, journalId: r.journal_id, date: r.date,
      notes: r.notes || '', screenshotUrl: r.screenshot_url || null,
      createdAt: r.created_at, updatedAt: r.updated_at
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.post('/api/no-trade-days', authenticateToken, async (req, res) => {
  try {
    await ensureNoTradeDaysTable();
    const { date, notes, journalId, screenshotUrl } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    let journalIdFinal = journalId;
    if (!journalIdFinal) {
      const j = await pool.query('SELECT id FROM journals WHERE user_id = $1 ORDER BY created_at LIMIT 1', [req.user.userId]);
      journalIdFinal = j.rows[0]?.id || null;
    }
    const existing = await pool.query(
      'SELECT id FROM no_trade_days WHERE user_id = $1 AND journal_id IS NOT DISTINCT FROM $2 AND date = $3',
      [req.user.userId, journalIdFinal, date]
    );
    let r;
    if (existing.rows.length > 0) {
      const u = await pool.query(
        'UPDATE no_trade_days SET notes = $1, screenshot_url = COALESCE($2, screenshot_url), updated_at = NOW() WHERE id = $3 RETURNING *',
        [notes || '', screenshotUrl || null, existing.rows[0].id]
      );
      r = u.rows[0];
    } else {
      const ins = await pool.query(
        'INSERT INTO no_trade_days (user_id, journal_id, date, notes, screenshot_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [req.user.userId, journalIdFinal, date, notes || '', screenshotUrl || null]
      );
      r = ins.rows[0];
    }
    res.status(201).json({
      id: r.id, userId: r.user_id, journalId: r.journal_id, date: r.date,
      notes: r.notes || '', screenshotUrl: r.screenshot_url || null,
      createdAt: r.created_at, updatedAt: r.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.put('/api/no-trade-days/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, notes, screenshotUrl } = req.body;
    const updates = [];
    const params = [];
    let i = 1;
    if (date !== undefined) { updates.push(`date = $${i}`); params.push(date); i++; }
    if (notes !== undefined) { updates.push(`notes = $${i}`); params.push(notes); i++; }
    if (screenshotUrl !== undefined) { updates.push(`screenshot_url = $${i}`); params.push(screenshotUrl); i++; }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(id, req.user.userId);
    const result = await pool.query(
      `UPDATE no_trade_days SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No trade day entry not found' });
    const r = result.rows[0];
    res.json({ id: r.id, userId: r.user_id, journalId: r.journal_id, date: r.date, notes: r.notes || '', screenshotUrl: r.screenshot_url || null, createdAt: r.created_at, updatedAt: r.updated_at });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.delete('/api/no-trade-days/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM no_trade_days WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No trade day entry not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, '0.0.0.0', async () => {
  await ensureNoTradeDaysTable();
  console.log(`Backend API running on port ${PORT}`);
  console.log(`Accessible at: http://localhost:${PORT}`);
  console.log(`Network access: http://[your-ip]:${PORT}`);
}); 