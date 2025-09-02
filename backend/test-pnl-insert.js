const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testPnLInsert() {
  try {
    console.log('🧪 TESTING DIRECT P&L INSERT:');
    
    // Test 1: Insert a trade with positive P&L
    const testPnL = 123.45;
    console.log(`Attempting to insert P&L: ${testPnL}`);
    
    const result = await db.query(`
      INSERT INTO trades (
        user_id, symbol, type, trade_type, direction, entry_price, exit_price, 
        quantity, position_size, entry_time, exit_time, pnl
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING id, symbol, pnl
    `, [
      1, // user_id
      'TEST',
      'buy',
      'Long',
      'long',
      100.00,
      150.00,
      1,
      1,
      new Date().toISOString(),
      new Date().toISOString(),
      testPnL
    ]);
    
    console.log('✅ Insert successful:');
    console.log(`  ID: ${result.rows[0].id}`);
    console.log(`  Symbol: ${result.rows[0].symbol}`);
    console.log(`  P&L stored: ${result.rows[0].pnl}`);
    console.log(`  P&L type: ${typeof result.rows[0].pnl}`);
    
    // Clean up the test record
    await db.query('DELETE FROM trades WHERE id = $1', [result.rows[0].id]);
    console.log('🧹 Cleaned up test record');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await db.end();
  }
}

testPnLInsert();



