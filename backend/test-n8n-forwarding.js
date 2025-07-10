const axios = require('axios');

// Test the N8N forwarding functionality
async function testN8NForwarding() {
  const testData = {
    message: {
      message_id: 123,
      from: {
        id: 456789,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User'
      },
      chat: {
        id: 456789,
        type: 'private'
      },
      date: Math.floor(Date.now() / 1000),
      text: 'Test message from Trade Buddy'
    }
  };

  try {
    console.log('Testing N8N forwarding...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost:4001/forward-to-n8n', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success! Response:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test the Telegram webhook endpoint
async function testTelegramWebhook() {
  const testTelegramData = {
    update_id: 123456789,
    message: {
      message_id: 123,
      from: {
        id: 456789,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User'
      },
      chat: {
        id: 456789,
        type: 'private'
      },
      date: Math.floor(Date.now() / 1000),
      text: '/addtrade AAPL LONG 150.50 155.00 100'
    }
  };

  try {
    console.log('\nTesting Telegram webhook...');
    console.log('Test data:', JSON.stringify(testTelegramData, null, 2));
    
    const response = await axios.post('http://localhost:4001/telegram-webhook', testTelegramData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success! Response:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Testing N8N Integration...\n');
  
  await testN8NForwarding();
  await testTelegramWebhook();
  
  console.log('\n✨ Tests completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testN8NForwarding, testTelegramWebhook }; 