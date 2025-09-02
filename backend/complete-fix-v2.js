const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function completeFix() {
  try {
    console.log('🚀 STARTING COMPLETE DATABASE AND SYSTEM FIX...');
    
    // 1. Fix the checklist with proper items (UPDATE instead of DELETE)
    console.log('\n📋 FIXING CHECKLIST DATA...');
    
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
    
    // Update existing checklists with proper data
    await db.query(`
      UPDATE checklists 
      SET name = 'Pre-Trade Analysis',
          description = 'Essential checks before entering any trade',
          items = $1
      WHERE user_id = $2
    `, [JSON.stringify(sampleItems), userId]);
    
    // Insert a new checklist if none exist
    const existingChecklists = await db.query('SELECT id FROM checklists WHERE user_id = $1', [userId]);
    if (existingChecklists.rows.length === 0) {
      await db.query(
        'INSERT INTO checklists (user_id, name, description, items) VALUES ($1, $2, $3, $4)',
        [
          userId,
          'Pre-Trade Analysis',
          'Essential checks before entering any trade',
          JSON.stringify(sampleItems)
        ]
      );
    }
    
    console.log('✅ Fixed checklist with proper items');
    
    // 2. Verify the fix
    console.log('\n🔍 VERIFYING FIXES...');
    
    const verifyChecklist = await db.query('SELECT id, name, items FROM checklists WHERE user_id = $1', [userId]);
    if (verifyChecklist.rows.length > 0) {
      console.log('✅ Checklist verification:');
      verifyChecklist.rows.forEach(checklist => {
        console.log(`  ID: ${checklist.id}, Name: ${checklist.name}`);
        console.log(`  Items count: ${checklist.items.length}`);
        checklist.items.forEach(item => {
          console.log(`    - ${item.text}`);
        });
      });
    }
    
    // 3. Show current P&L state
    console.log('\n💰 CURRENT P&L VALUES:');
    const allTrades = await db.query('SELECT id, symbol, pnl, trade_type FROM trades ORDER BY id');
    allTrades.rows.forEach(trade => {
      console.log(`ID: ${trade.id}, Symbol: ${trade.symbol}, P&L: ${trade.pnl}, Type: ${trade.trade_type}`);
    });
    
    console.log('\n🎉 DATABASE FIX COMPLETED!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await db.end();
  }
}

completeFix();



