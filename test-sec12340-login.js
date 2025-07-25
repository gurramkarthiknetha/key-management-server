const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSec12340Login() {
  try {
    console.log('🔐 Testing sec12340 login and key retrieval...');
    
    // Test login
    console.log('\n1. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      userId: 'sec12340',
      password: '123456789'
    });
    
    console.log('✅ Login successful:', {
      userId: loginResponse.data.data.user.userId,
      role: loginResponse.data.data.user.role,
      token: loginResponse.data.token ? 'Present' : 'Missing'
    });
    
    const token = loginResponse.data.token;
    
    // Test getting all keys (security staff should be able to see all keys)
    console.log('\n2. Testing key retrieval...');
    const keysResponse = await axios.get(`${BASE_URL}/keys`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Keys retrieved successfully:');
    console.log(`   Total keys: ${keysResponse.data.data.keys.length}`);
    
    // Filter keys assigned to sec12340
    const assignedKeys = keysResponse.data.data.keys.filter(key => key.assignedTo === 'sec12340');
    console.log(`   Keys assigned to sec12340: ${assignedKeys.length}`);
    
    if (assignedKeys.length > 0) {
      console.log('\n📋 Keys assigned to sec12340:');
      assignedKeys.forEach(key => {
        console.log(`   - ${key.keyId}: ${key.keyName} (${key.status})`);
      });
    }
    
    // Show available keys
    const availableKeys = keysResponse.data.data.keys.filter(key => key.status === 'available');
    console.log(`   Available keys: ${availableKeys.length}`);
    
    // Show all key statuses
    const statusCounts = keysResponse.data.data.keys.reduce((acc, key) => {
      acc[key.status] = (acc[key.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Key status summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the test
testSec12340Login();
