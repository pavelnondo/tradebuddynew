const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function removePnLAutoCalculation() {
  try {
    console.log('🔥 REMOVING AUTOMATIC P&L CALCULATION:');
    
    // Step 1: Find and drop any triggers on trades table
    console.log('\\n1. Finding triggers on trades table...');
    const triggers = await db.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_table = 'trades'
    `);
    
    for (const trigger of triggers.rows) {
      console.log(`   Dropping trigger: ${trigger.trigger_name}`);
      await db.query(`DROP TRIGGER IF EXISTS ${trigger.trigger_name} ON trades`);
    }
    
    // Step 2: Drop the calculate_trade_pnl function
    console.log('\\n2. Dropping calculate_trade_pnl function...');
    await db.query('DROP FUNCTION IF EXISTS calculate_trade_pnl() CASCADE');
    
    // Step 3: Test with manual P&L insert
    console.log('\\n3. Testing manual P&L insert...');
    const testResult = await db.query(`
      INSERT INTO trades (
        user_id, symbol, type, trade_type, direction, entry_price, exit_price, 
        quantity, position_size, entry_time, exit_time, pnl
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING id, symbol, entry_price, exit_price, pnl
    `, [
      1,
      'FIXED_TEST',
      'buy',
      'Long',
      'long',
      100.00,
      150.00,
      1,
      1,
      new Date().toISOString(),
      new Date().toISOString(),
      999.99  // This should be stored as-is
    ]);
    
    console.log('✅ Test insert result:');
    console.log(`   P&L should be 999.99, actually stored: ${testResult.rows[0].pnl}`);
    
    if (testResult.rows[0].pnl == '999.99') {
      console.log('🎉 SUCCESS! Manual P&L is now working!');
    } else {
      console.log('❌ FAILED! P&L is still being auto-calculated');
    }
    
    // Clean up test record
    await db.query('DELETE FROM trades WHERE id = $1', [testResult.rows[0].id]);
    
    console.log('\\n🎯 AUTOMATIC P&L CALCULATION REMOVED!');
    console.log('   Users can now enter their own P&L values without interference.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

removePnLAutoCalculation();



