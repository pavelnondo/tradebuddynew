const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testChecklistUpdate() {
  try {
    console.log('🧪 TESTING CHECKLIST UPDATE WITH VARIOUS SCENARIOS:');
    
    // Test 1: Update with valid items
    console.log('\n1. Testing update with valid items...');
    const validItems = [
      { id: 1, text: "Check support levels", completed: false },
      { id: 2, text: "Confirm trend direction", completed: false }
    ];
    
    await db.query(
      'UPDATE checklists SET items = $1 WHERE id = 7',
      [JSON.stringify(validItems)]
    );
    console.log('✅ Update with valid items: SUCCESS');
    
    // Test 2: Update with empty array
    console.log('\n2. Testing update with empty array...');
    await db.query(
      'UPDATE checklists SET items = $1 WHERE id = 7',
      [JSON.stringify([])]
    );
    console.log('✅ Update with empty array: SUCCESS');
    
    // Test 3: Check current state
    console.log('\n3. Checking current checklist state...');
    const result = await db.query('SELECT * FROM checklists WHERE id = 7');
    if (result.rows.length > 0) {
      const checklist = result.rows[0];
      console.log(`Name: ${checklist.name}`);
      console.log(`Items: ${JSON.stringify(checklist.items)}`);
      console.log(`Items type: ${typeof checklist.items}`);
      console.log(`Items is array: ${Array.isArray(checklist.items)}`);
    }
    
    console.log('\n🎉 All database operations successful!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await db.end();
  }
}

testChecklistUpdate();



