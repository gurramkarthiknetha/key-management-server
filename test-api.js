const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing Key Management API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test registration
    console.log('2. Testing user registration...');
    const registerData = {
      userId: 'TEST001',
      password: 'test123',
      role: 'faculty'
    };
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
      console.log('✅ Registration successful:', registerResponse.data);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  User already exists, continuing...');
      } else {
        console.log('❌ Registration failed:', error.response?.data || error.message);
      }
    }
    console.log('');

    // Test login
    console.log('3. Testing user login...');
    const loginData = {
      userId: 'TEST001',
      password: 'test123'
    };
    
    let token = null;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
      console.log('✅ Login successful:', loginResponse.data);
      token = loginResponse.data.token;
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
      return;
    }
    console.log('');

    // Test protected endpoint
    console.log('4. Testing protected endpoint (my keys)...');
    try {
      const keysResponse = await axios.get(`${BASE_URL}/api/keys/my`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ My keys:', keysResponse.data);
    } catch (error) {
      console.log('❌ Get my keys failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test history endpoint
    console.log('5. Testing history endpoint...');
    try {
      const historyResponse = await axios.get(`${BASE_URL}/api/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ History:', historyResponse.data);
    } catch (error) {
      console.log('❌ Get history failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test QR scan endpoint
    console.log('6. Testing QR scan endpoint...');
    const scanData = {
      qrData: JSON.stringify({
        keyId: 'TEST-KEY-001',
        keyName: 'Test Key',
        department: 'Test Department',
        timestamp: new Date().toISOString()
      }),
      location: 'Test Location',
      deviceInfo: 'Test Device'
    };
    
    try {
      const scanResponse = await axios.post(`${BASE_URL}/api/keys/scan`, scanData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ QR scan:', scanResponse.data);
    } catch (error) {
      console.log('❌ QR scan failed:', error.response?.data || error.message);
    }
    console.log('');

    console.log('🎉 API testing completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run the test
testAPI();
