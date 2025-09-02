const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupUserSettings() {
  try {
    console.log('🔧 SETTING UP USER SETTINGS SYSTEM:');
    
    // Step 1: Clean up dummy checklists
    console.log('\\n1. Cleaning up dummy checklists...');
    const dummyChecklists = await db.query(`
      SELECT id, name FROM checklists 
      WHERE name LIKE '%dummy%' OR name LIKE '%test%' OR name = 'Nice site)' 
      ORDER BY id
    `);
    
    console.log(`Found ${dummyChecklists.rows.length} dummy checklists to remove:`);
    for (const checklist of dummyChecklists.rows) {
      console.log(`  - ${checklist.id}: ${checklist.name}`);
      
      // Remove checklist references from trades first
      await db.query('UPDATE trades SET checklist_id = NULL, checklist_items = NULL WHERE checklist_id = $1', [checklist.id]);
      
      // Delete the checklist
      await db.query('DELETE FROM checklists WHERE id = $1', [checklist.id]);
      console.log(`    ✅ Deleted checklist ${checklist.id}`);
    }
    
    // Step 2: Create user_settings table
    console.log('\\n2. Creating user_settings table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        initial_balance NUMERIC DEFAULT 10000.00,
        currency VARCHAR(10) DEFAULT 'USD',
        date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);
    console.log('✅ user_settings table created');
    
    // Step 3: Create or update a sample checklist
    console.log('\\n3. Creating professional sample checklist...');
    const sampleChecklist = await db.query(`
      INSERT INTO checklists (user_id, name, description, items) 
      VALUES (1, 'Pre-Trade Analysis', 'Essential analysis before entering any trade', $1)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [JSON.stringify([
      { id: 1, text: "Market trend analysis completed", completed: false },
      { id: 2, text: "Risk/reward ratio calculated (min 1:2)", completed: false },
      { id: 3, text: "Position size determined based on risk tolerance", completed: false },
      { id: 4, text: "Entry and exit levels identified", completed: false },
      { id: 5, text: "Stop loss level set", completed: false }
    ])]);
    
    if (sampleChecklist.rows.length > 0) {
      console.log(`✅ Created sample checklist with ID: ${sampleChecklist.rows[0].id}`);
    } else {
      console.log('ℹ️ Sample checklist already exists');
    }
    
    // Step 4: Initialize default settings for existing users
    console.log('\\n4. Initializing default settings for existing users...');
    const users = await db.query('SELECT id FROM users');
    console.log(`Found ${users.rows.length} users`);
    
    for (const user of users.rows) {
      await db.query(`
        INSERT INTO user_settings (user_id, initial_balance, currency, date_format)
        VALUES ($1, 10000.00, 'USD', 'MM/DD/YYYY')
        ON CONFLICT (user_id) DO NOTHING
      `, [user.id]);
    }
    console.log('✅ Default settings initialized for all users');
    
    // Step 5: Show final state
    console.log('\\n📊 FINAL STATE:');
    const finalChecklists = await db.query('SELECT id, name FROM checklists ORDER BY id');
    console.log('Remaining checklists:');
    finalChecklists.rows.forEach(checklist => {
      console.log(`  ${checklist.id}: ${checklist.name}`);
    });
    
    const settingsCount = await db.query('SELECT COUNT(*) as count FROM user_settings');
    console.log(`\\nUser settings records: ${settingsCount.rows[0].count}`);
    
    console.log('\\n🎉 USER SETTINGS SYSTEM READY!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await db.end();
  }
}

setupUserSettings();



