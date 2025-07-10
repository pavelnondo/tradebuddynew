const axios = require('axios');

// Test your specific N8N webhook directly
async function testN8NWebhook() {
  const n8nWebhookUrl = '[REDACTED]';
  
  const testData = {
    source: 'telegram',
    timestamp: new Date().toISOString(),
    data: {
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
        text: 'Test message from Trade Buddy Backend'
      }
    }
  };

  try {
    console.log('🧪 Testing N8N webhook directly...');
    console.log('URL:', n8nWebhookUrl);
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(n8nWebhookUrl, testData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Trade-Buddy-Backend/1.0'
      },
      timeout: 10000, // 10 second timeout
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false // Allow self-signed certificates
      })
    });
    
    console.log('✅ Success! N8N webhook responded:');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Error testing N8N webhook:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test the backend forwarding
async function testBackendForwarding() {
  const testData = {
    message: {
      message_id: 124,
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
    console.log('\n🧪 Testing backend forwarding...');
    
    const response = await axios.post('http://localhost:4001/forward-to-n8n', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Backend forwarding successful:');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Backend forwarding failed:');
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Testing N8N Integration with your webhook...\n');
  
  await testN8NWebhook();
  await testBackendForwarding();
  
  console.log('\n✨ All tests completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testN8NWebhook, testBackendForwarding }; 