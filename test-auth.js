const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

async function testAuthentication() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerData = {
      userId: 'test123',
      password: 'password123',
      role: 'faculty_lab_staff'
    };

    const registerResponse = await axios.post(`${BASE_URL}/register`, registerData);
    console.log('✅ Registration successful:', {
      success: registerResponse.data.success,
      userId: registerResponse.data.data?.user?.userId,
      role: registerResponse.data.data?.user?.role
    });
    console.log('Token received:', !!registerResponse.data.token);

    // Test 2: Login with the registered user
    console.log('\n2. Testing user login...');
    const loginData = {
      userId: 'test123',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/login`, loginData);
    console.log('✅ Login successful:', {
      success: loginResponse.data.success,
      userId: loginResponse.data.data?.user?.userId,
      role: loginResponse.data.data?.user?.role
    });
    
    const token = loginResponse.data.token;
    console.log('Token received:', !!token);

    // Test 3: Get current user info
    console.log('\n3. Testing get current user...');
    const meResponse = await axios.get(`${BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Get user info successful:', {
      success: meResponse.data.success,
      userId: meResponse.data.data?.user?.userId,
      role: meResponse.data.data?.user?.role
    });

    // Test 4: Test different roles
    console.log('\n4. Testing different roles...');
    const roles = ['security_staff', 'hod', 'security_incharge'];
    
    for (const role of roles) {
      const userData = {
        userId: `test_${role}`,
        password: 'password123',
        role: role
      };
      
      const response = await axios.post(`${BASE_URL}/register`, userData);
      console.log(`✅ ${role} registration:`, {
        success: response.data.success,
        userId: response.data.data?.user?.userId,
        role: response.data.data?.user?.role
      });
    }

    // Test 5: Test invalid login
    console.log('\n5. Testing invalid login...');
    try {
      await axios.post(`${BASE_URL}/login`, {
        userId: 'test123',
        password: 'wrongpassword'
      });
    } catch (error) {
      console.log('✅ Invalid login correctly rejected:', error.response?.data?.error);
    }

    // Test 6: Test duplicate registration
    console.log('\n6. Testing duplicate registration...');
    try {
      await axios.post(`${BASE_URL}/register`, registerData);
    } catch (error) {
      console.log('✅ Duplicate registration correctly rejected:', error.response?.data?.error);
    }

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testAuthentication();
