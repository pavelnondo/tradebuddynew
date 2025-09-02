const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixChecklistDeletion() {
  try {
    console.log('🔍 INVESTIGATING CHECKLIST DELETION ISSUE:');
    
    // Check if checklist 3 exists and what might be preventing deletion
    const checklist = await db.query('SELECT * FROM checklists WHERE id = 3');
    if (checklist.rows.length > 0) {
      console.log('✅ Checklist 3 exists:', checklist.rows[0].name);
      
      // Check for any trades referencing this checklist
      const tradesUsingChecklist = await db.query('SELECT id, symbol FROM trades WHERE checklist_id = 3');
      console.log(`📊 Found ${tradesUsingChecklist.rows.length} trades using checklist 3`);
      
      if (tradesUsingChecklist.rows.length > 0) {
        console.log('🔄 Removing checklist references from trades...');
        await db.query('UPDATE trades SET checklist_id = NULL, checklist_items = NULL WHERE checklist_id = 3');
        console.log('✅ Cleared checklist references from trades');
      }
      
      // Now try to delete the checklist
      console.log('🗑️ Attempting to delete checklist 3...');
      const deleteResult = await db.query('DELETE FROM checklists WHERE id = 3 RETURNING id');
      
      if (deleteResult.rows.length > 0) {
        console.log('✅ Successfully deleted checklist 3');
      } else {
        console.log('❌ Failed to delete checklist 3');
      }
    } else {
      console.log('ℹ️ Checklist 3 does not exist');
    }
    
    // List remaining checklists
    console.log('\\n📋 REMAINING CHECKLISTS:');
    const remaining = await db.query('SELECT id, name, description FROM checklists ORDER BY id');
    remaining.rows.forEach(checklist => {
      console.log(`  ${checklist.id}: ${checklist.name} - ${checklist.description}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await db.end();
  }
}

fixChecklistDeletion();



