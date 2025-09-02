const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function findTriggers() {
  try {
    console.log('🔍 SEARCHING FOR TRIGGERS AND FUNCTIONS:');
    
    // Check for any functions that might calculate P&L
    const functions = await db.query(`
      SELECT routine_name, routine_definition 
      FROM information_schema.routines 
      WHERE routine_type = 'FUNCTION' AND routine_schema = 'public'
    `);
    
    console.log('📋 Database functions:');
    functions.rows.forEach(func => {
      console.log(`  Function: ${func.routine_name}`);
      if (func.routine_definition && func.routine_definition.toLowerCase().includes('pnl')) {
        console.log(`    ⚠️ Contains P&L logic: ${func.routine_definition.substring(0, 200)}...`);
      }
    });
    
    // Check for any views that might be affecting the data
    const views = await db.query(`
      SELECT table_name, view_definition 
      FROM information_schema.views 
      WHERE table_schema = 'public'
    `);
    
    console.log('\\n📋 Database views:');
    views.rows.forEach(view => {
      console.log(`  View: ${view.table_name}`);
    });
    
    // Check table definition
    console.log('\\n📋 Trades table definition:');
    const tableInfo = await db.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'trades' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    tableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (default: ${col.column_default}, nullable: ${col.is_nullable})`);
      if (col.column_name === 'pnl' && col.column_default) {
        console.log(`    ⚠️ P&L has default value: ${col.column_default}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

findTriggers();



