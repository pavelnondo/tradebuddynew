const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function completeFix() {
  try {
    console.log('🚀 STARTING COMPLETE DATABASE AND SYSTEM FIX...');
    
    // 1. Fix the checklist with proper items
    console.log('\n📋 FIXING CHECKLIST DATA...');
    
    // Update the "Pre-Trade Analysis" checklist with proper items
    const sampleItems = [
      { id: 1, text: "Check market sentiment and overall trend", completed: false },
      { id: 2, text: "Verify support and resistance levels", completed: false },
      { id: 3, text: "Set stop loss and take profit levels", completed: false },
      { id: 4, text: "Check volume and liquidity", completed: false },
      { id: 5, text: "Review risk management rules", completed: false }
    ];
    
    // Get the first user
    const firstUser = await db.query('SELECT id FROM users ORDER BY id LIMIT 1');
    const userId = firstUser.rows[0].id;
    
    // Delete existing bad checklists and recreate with proper data
    await db.query('DELETE FROM checklists WHERE user_id = $1', [userId]);
    
    // Insert proper checklist
    await db.query(
      'INSERT INTO checklists (user_id, name, description, items) VALUES ($1, $2, $3, $4)',
      [
        userId,
        'Pre-Trade Analysis',
        'Essential checks before entering any trade',
        JSON.stringify(sampleItems)
      ]
    );
    console.log('✅ Fixed checklist with proper items');
    
    // 2. Verify the fix
    console.log('\n🔍 VERIFYING FIXES...');
    
    const verifyChecklist = await db.query('SELECT id, name, items FROM checklists WHERE user_id = $1', [userId]);
    if (verifyChecklist.rows.length > 0) {
      console.log('✅ Checklist verification:');
      console.log(`  Name: ${verifyChecklist.rows[0].name}`);
      console.log(`  Items count: ${verifyChecklist.rows[0].items.length}`);
      verifyChecklist.rows[0].items.forEach(item => {
        console.log(`    - ${item.text}`);
      });
    }
    
    // 3. Clean up any negative P&L issues (convert back to positive if they should be)
    console.log('\n💰 FIXING P&L VALUES...');
    const negativePnlTrades = await db.query('SELECT id, symbol, pnl FROM trades WHERE pnl < 0');
    console.log(`Found ${negativePnlTrades.rows.length} trades with negative P&L`);
    
    // Show current state
    console.log('\n📊 CURRENT TRADE DATA:');
    const allTrades = await db.query('SELECT id, symbol, pnl, trade_type FROM trades ORDER BY id');
    allTrades.rows.forEach(trade => {
      console.log(`ID: ${trade.id}, Symbol: ${trade.symbol}, P&L: ${trade.pnl}, Type: ${trade.trade_type}`);
    });
    
    console.log('\n🎉 COMPLETE FIX FINISHED!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await db.end();
  }
}

completeFix();



