require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool(); // uses .env for config

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

app.get('/trades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trades ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a trade (now supports advanced fields)
app.post('/trades', async (req, res) => {
  const {
    symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes,
    emotion, setup, execution_quality, duration, checklist_id, checklist_completed, screenshot
  } = req.body;
  try {
    const checklistCompletedJson = checklist_completed ? JSON.stringify(checklist_completed) : null;
    const result = await pool.query(
      `INSERT INTO trades (symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes,
        emotion, setup, execution_quality, duration, checklist_id, checklist_completed, screenshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes,
        emotion, setup, execution_quality, duration, checklist_id, checklistCompletedJson, screenshot]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a trade (now supports advanced fields)
app.put('/trades/:id', async (req, res) => {
  const { id } = req.params;
  const {
    symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes,
    emotion, setup, execution_quality, duration, checklist_id, checklist_completed, screenshot
  } = req.body;
  try {
    const checklistCompletedJson = checklist_completed ? JSON.stringify(checklist_completed) : null;
    const result = await pool.query(
      `UPDATE trades SET symbol=$1, type=$2, entry_price=$3, exit_price=$4, quantity=$5, entry_time=$6, exit_time=$7, pnl=$8, notes=$9,
        emotion=$10, setup=$11, execution_quality=$12, duration=$13, checklist_id=$14, checklist_completed=$15, screenshot=$16
       WHERE id=$17 RETURNING *`,
      [symbol, type, entry_price, exit_price, quantity, entry_time, exit_time, pnl, notes,
        emotion, setup, execution_quality, duration, checklist_id, checklistCompletedJson, screenshot, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a trade
app.delete('/trades/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM trades WHERE id=$1', [id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all checklists
app.get('/checklists', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM checklists ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single checklist by ID
app.get('/checklists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM checklists WHERE id=$1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
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
app.get('/screenshots', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM screenshots ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Screenshot upload endpoint
app.post('/upload', upload.single('screenshot'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the public URL for the uploaded file
  const url = `/public/lovable-uploads/${req.file.filename}`;
  res.json({ url });
});

// --- CHECKLIST CRUD ---
// Create a checklist
app.post('/checklists', async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO checklists (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a checklist
app.put('/checklists/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE checklists SET name=$1, description=$2 WHERE id=$3 RETURNING *',
      [name, description, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a checklist (and its items)
app.delete('/checklists/:id', async (req, res) => {
  const { id } = req.params;
  try {
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

const PORT = process.env.PORT || 4004;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API running on port ${PORT}`);
  console.log(`Accessible at: http://localhost:${PORT}`);
  console.log(`Network access: http://[your-ip]:${PORT}`);
}); 