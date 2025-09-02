const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkLatestTrade() {
  try {
    console.log('🔍 CHECKING LATEST TRADE DATA:');
    const result = await db.query('SELECT id, symbol, pnl, trade_type, entry_price, exit_price FROM trades ORDER BY id DESC LIMIT 1');
    if (result.rows.length > 0) {
      const trade = result.rows[0];
      console.log(`Latest trade (ID ${trade.id}):`);
      console.log(`  Symbol: ${trade.symbol}`);
      console.log(`  Type: ${trade.trade_type}`);
      console.log(`  Entry: ${trade.entry_price}`);
      console.log(`  Exit: ${trade.exit_price}`);
      console.log(`  P&L (raw): ${trade.pnl}`);
      console.log(`  P&L (typeof): ${typeof trade.pnl}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.end();
  }
}

checkLatestTrade();



