/**
 * Check all trades in the database for data consistency
 * Run: node backend/check-trades.js
 */
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/tradebuddy',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTrades() {
  try {
    const result = await db.query(`
      SELECT id, symbol, trade_type, entry_price, exit_price, quantity, position_size, pnl, entry_time, exit_time
      FROM trades 
      ORDER BY entry_time ASC
    `);
    console.log(`\n📊 Found ${result.rows.length} trade(s):\n`);
    result.rows.forEach((t, i) => {
      const entryPrice = parseFloat(t.entry_price);
      const exitPrice = t.exit_price != null ? parseFloat(t.exit_price) : null;
      const quantity = parseFloat(t.quantity);
      const pnl = parseFloat(t.pnl);
      const expectedPnl = exitPrice != null ? (exitPrice - entryPrice) * quantity : null;
      console.log(`Trade ${i + 1}: ${t.symbol} (${t.trade_type})`);
      console.log(`  Entry: $${entryPrice}, Exit: ${exitPrice != null ? '$' + exitPrice : 'null'}`);
      console.log(`  Quantity: ${quantity} (raw: ${t.quantity})`);
      console.log(`  P&L (DB): $${pnl}`);
      if (expectedPnl != null) {
        const match = Math.abs(pnl - expectedPnl) < 0.01 ? '✓' : '⚠️';
        console.log(`  P&L (calc): $${expectedPnl.toFixed(2)} ${match}`);
      }
      console.log('');
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.end();
  }
}

checkTrades();
