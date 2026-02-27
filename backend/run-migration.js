#!/usr/bin/env node
/**
 * Run database migration script
 * Usage: node run-migration.js migrations/2026-01-28-ai-recommendation-completions.sql
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const migrationFile = process.argv[2] || 'migrations/2026-01-28-ai-recommendation-completions.sql';

if (!fs.existsSync(migrationFile)) {
  console.error(`Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const db = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'tradebuddy'}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await db.connect();
  try {
    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log(`Running migration: ${migrationFile}`);
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await db.end();
  }
}

runMigration();
