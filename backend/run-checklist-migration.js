#!/usr/bin/env node
/**
 * Migration: Add pre/during/post checklist columns to trades table.
 * Run: node run-checklist-migration.js
 * Use this if checklists aren't saving/displaying correctly (DB may only have one checklist column).
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'tradebuddy'}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const sqlPath = path.join(__dirname, 'migrations', 'add-three-checklist-columns.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  try {
    await pool.query(sql);
    console.log('✅ Checklist columns migration completed. Pre, during, and post checklist data will now save correctly.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
