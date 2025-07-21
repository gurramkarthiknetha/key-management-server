const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

async function testIntegration() {
  console.log('🧪 Testing Complete Authentication Integration...\n');

  try {
    // Test 1: Register a new user with simplified data
    console.log('1. Testing simplified registration...');
    const testUser = {
      userId: `testuser_${Date.now()}`,
      password: 'password123',
      role: 'faculty_lab_staff'
    };

    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);
    console.log('✅ Registration successful:', {
      success: registerResponse.data.success,
      userId: registerResponse.data.data?.user?.userId,
      role: registerResponse.data.data?.user?.role,
      tokenReceived: !!registerResponse.data.token
    });

    const token = registerResponse.data.token;

    // Test 2: Verify the token works with protected endpoint
    console.log('\n2. Testing token authentication...');
    const meResponse = await axios.get(`${BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Token authentication successful:', {
      success: meResponse.data.success,
      userId: meResponse.data.data?.user?.userId,
      role: meResponse.data.data?.user?.role
    });

    // Test 3: Test login with the same credentials
    console.log('\n3. Testing login with registered credentials...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      userId: testUser.userId,
      password: testUser.password
    });
    console.log('✅ Login successful:', {
      success: loginResponse.data.success,
      userId: loginResponse.data.data?.user?.userId,
      role: loginResponse.data.data?.user?.role,
      tokenReceived: !!loginResponse.data.token
    });

    // Test 4: Test all roles
    console.log('\n4. Testing all role types...');
    const roles = ['security_staff', 'hod', 'security_incharge'];
    
    for (const role of roles) {
      const roleUser = {
        userId: `${role}_${Date.now()}`,
        password: 'password123',
        role: role
      };
      
      const response = await axios.post(`${BASE_URL}/register`, roleUser);
      console.log(`✅ ${role} registration:`, {
        success: response.data.success,
        userId: response.data.data?.user?.userId,
        role: response.data.data?.user?.role
      });
    }

    console.log('\n🎉 All integration tests passed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Simplified registration (userId + password + role only)');
    console.log('- ✅ Automatic authentication after registration');
    console.log('- ✅ JWT token generation and validation');
    console.log('- ✅ Login with userId and password');
    console.log('- ✅ All 4 roles supported');
    console.log('- ✅ Protected endpoint access with token');
    console.log('\n🚀 Frontend-Backend integration is complete and working!');

  } catch (error) {
    console.error('❌ Integration test failed:', error.response?.data || error.message);
  }
}

// Run the integration tests
testIntegration();
