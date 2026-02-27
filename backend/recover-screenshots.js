#!/usr/bin/env node
/**
 * Recovery script: Try to re-attach orphaned screenshot files to trades with NULL screenshot_url.
 * Matches by approximate date (file mtime vs trade created_at).
 * 
 * Run with DB available: node backend/recover-screenshots.js
 * Dry run (no DB writes): DRY_RUN=1 node backend/recover-screenshots.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'tradebuddy_user',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'tradebuddy',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5440,
});

const DRY_RUN = process.env.DRY_RUN === '1';

const uploadsDir = path.join(__dirname, 'uploads');
const lovableDir = path.join(__dirname, '../public/lovable-uploads');

function getFilesWithMtime(dir, urlPrefix) {
  if (!fs.existsSync(dir)) return [];
  const names = fs.readdirSync(dir);
  return names
    .filter((n) => /\.(png|jpg|jpeg|gif|webp)$/i.test(n))
    .map((n) => {
      const fp = path.join(dir, n);
      const stat = fs.statSync(fp);
      return { name: n, mtime: stat.mtimeMs, url: `${urlPrefix}${n}` };
    });
}

async function main() {
  const files = [
    ...getFilesWithMtime(uploadsDir, '/uploads/'),
    ...getFilesWithMtime(lovableDir, '/lovable-uploads/'),
  ].sort((a, b) => a.mtime - b.mtime);

  const { rows: trades } = await pool.query(
    `SELECT id, symbol, created_at, screenshot_url 
     FROM trades 
     WHERE screenshot_url IS NULL 
     ORDER BY created_at ASC`
  );

  if (trades.length === 0) {
    console.log('No trades with NULL screenshot_url. Nothing to recover.');
    await pool.end();
    return;
  }
  if (files.length === 0) {
    console.log('No screenshot files found in uploads or lovable-uploads. Nothing to attach.');
    await pool.end();
    return;
  }

  console.log(`Found ${trades.length} trades with NULL screenshot, ${files.length} orphaned files.\n`);

  const used = new Set();
  let matched = 0;

  for (const trade of trades) {
    const tradeTime = new Date(trade.created_at).getTime();
    let best = null;
    let bestDiff = Infinity;

    for (const f of files) {
      if (used.has(f.url)) continue;
      const diff = Math.abs(f.mtime - tradeTime);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = f;
      }
    }

    if (best && bestDiff < 2 * 24 * 60 * 60 * 1000) {
      used.add(best.url);
      matched++;
      console.log(`Match: trade ${trade.id} (${trade.symbol}) -> ${best.url}`);
      if (!DRY_RUN) {
        await pool.query(
          'UPDATE trades SET screenshot_url = $1, updated_at = NOW() WHERE id = $2',
          [best.url, trade.id]
        );
      }
    }
  }

  console.log(`\n${DRY_RUN ? '[DRY RUN] Would have ' : ''}Updated ${matched} trades.`);
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
