#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');

// Use same DB config as app.js
const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost/tradebuddy';
const pool = new Pool({
  connectionString: dbUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function check() {
  try {
    const res = await pool.query(`
      SELECT id, user_id, journal_id, date, LEFT(notes, 80) as notes_preview, created_at 
      FROM no_trade_days 
      ORDER BY created_at DESC 
      LIMIT 15
    `);
    console.log('\n=== no_trade_days table ===');
    console.log('Rows found:', res.rows.length);
    if (res.rows.length > 0) {
      console.table(res.rows.map(r => {
        const d = r.date;
        const dateStr = d ? (typeof d === 'string' ? d.slice(0, 10) : (d.toISOString ? d.toISOString().slice(0, 10) : String(d).slice(0, 10))) : '';
        return {
          id: r.id?.slice(0, 8) + '...',
          journal_id: r.journal_id ? r.journal_id.slice(0, 8) + '...' : 'null',
          date_stored: dateStr,
          notes: (r.notes_preview || '').slice(0, 50),
          created_at: r.created_at
        };
      }));
    } else {
      console.log('(no rows)');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
