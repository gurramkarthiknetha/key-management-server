const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testSec12340() {
  try {
    console.log('🧪 Testing security user sec12340...\n');
    
    // Step 1: Login
    console.log('1. Logging in as sec12340...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      userId: 'sec12340',
      password: '123456789'
    });
    
    console.log('✅ Login successful!');
    console.log('User:', loginResponse.data.data.user);
    
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Step 2: Get all keys (security staff can see all keys)
    console.log('\n2. Fetching all keys...');
    const allKeysResponse = await axios.get(`${API_BASE}/keys`, { headers });
    
    console.log(`✅ Found ${allKeysResponse.data.data.total} total keys`);
    
    // Filter keys assigned to sec12340
    const myKeys = allKeysResponse.data.data.keys.filter(key => 
      key.assignedTo === 'sec12340'
    );
    
    console.log(`\n🔑 Keys assigned to sec12340: ${myKeys.length}`);
    myKeys.forEach(key => {
      console.log(`   - ${key.keyId}: ${key.keyName}`);
      console.log(`     Status: ${key.status}, Department: ${key.department}`);
      console.log(`     Location: ${key.location}`);
      console.log(`     Assigned: ${key.assignedDate ? new Date(key.assignedDate).toLocaleDateString() : 'N/A'}`);
      console.log('');
    });
    
    // Step 3: Test getting available keys
    console.log('3. Fetching available keys...');
    const availableKeysResponse = await axios.get(`${API_BASE}/keys?status=available`, { headers });
    
    console.log(`✅ Found ${availableKeysResponse.data.data.total} available keys`);
    console.log('Available security keys:');
    availableKeysResponse.data.data.keys
      .filter(key => key.department === 'Security')
      .slice(0, 5) // Show first 5
      .forEach(key => {
        console.log(`   - ${key.keyId}: ${key.keyName}`);
      });
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSec12340();
