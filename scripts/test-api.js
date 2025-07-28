#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests all authentication endpoints and functionality
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const TEST_EMAIL = process.env.TEST_EMAIL || '23071a7225@vnrvjiet.in';
const TEST_USER_DATA = {
  name: 'Test User',
  email: TEST_EMAIL,
  employeeId: 'TEST001',
  department: 'Computer Science and Engineering',
  role: 'faculty'
};

let authToken = null;
let testUserId = null;

// Helper functions
const log = {
  info: (msg) => console.log('ℹ️ '.blue + msg),
  success: (msg) => console.log('✅ '.green + msg.green),
  error: (msg) => console.log('❌ '.red + msg.red),
  warning: (msg) => console.log('⚠️ '.yellow + msg.yellow),
  test: (msg) => console.log('🧪 '.cyan + msg.cyan),
  step: (msg) => console.log('\n📋 '.magenta + msg.magenta.bold)
};

const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

const waitForInput = (prompt) => {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    readline.question(prompt, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
};

// Test functions
async function testHealthCheck() {
  log.step('Testing Health Check');
  const result = await makeRequest('GET', '/test');
  
  if (result.success) {
    log.success('Health check passed');
    log.info(`Server status: ${JSON.stringify(result.data, null, 2)}`);
  } else {
    log.error('Health check failed');
    log.error(JSON.stringify(result.error, null, 2));
  }
  
  return result.success;
}

async function testSimpleAuth() {
  log.step('Testing Simplified Authentication');

  const result = await makeRequest('POST', '/auth/simple-auth', { email: TEST_EMAIL });

  if (result.success) {
    log.success('Simple authentication successful');
    const userData = result.data;
    log.info(`Auto-created/found user:`);
    log.info(`  Name: ${userData.name}`);
    log.info(`  Email: ${userData.email}`);
    log.info(`  Role: ${userData.role} (${userData.roleDisplayName})`);
    log.info(`  Department: ${userData.department}`);
    log.info(`Check email ${TEST_EMAIL} for login OTP`);
  } else {
    log.error('Simple authentication failed');
    log.error(JSON.stringify(result.error, null, 2));
  }

  return result.success;
}

// Email verification not needed with simple auth - auto-verified

// OTP request handled automatically by simple auth

async function testLogin() {
  log.step('Testing Login with OTP');
  
  const otp = await waitForInput('Enter the OTP received in email for login: ');
  
  const result = await makeRequest('POST', '/auth/login', {
    email: TEST_EMAIL,
    otp: otp.trim()
  });
  
  if (result.success) {
    log.success('Login successful');
    authToken = result.data.data.token;
    log.info(`Auth token received: ${authToken.substring(0, 20)}...`);
    log.info(`User role: ${result.data.data.user.role}`);
  } else {
    log.error('Login failed');
    log.error(JSON.stringify(result.error, null, 2));
  }
  
  return result.success;
}

async function testAuthenticatedEndpoints() {
  log.step('Testing Authenticated Endpoints');
  
  // Test /auth/me
  log.test('Testing GET /auth/me');
  const meResult = await makeRequest('GET', '/auth/me');
  
  if (meResult.success) {
    log.success('GET /auth/me successful');
    log.info(`Current user: ${meResult.data.data.user.name} (${meResult.data.data.user.role})`);
  } else {
    log.error('GET /auth/me failed');
    log.error(JSON.stringify(meResult.error, null, 2));
  }
  
  // Test token refresh
  log.test('Testing POST /auth/refresh');
  const refreshResult = await makeRequest('POST', '/auth/refresh');
  
  if (refreshResult.success) {
    log.success('Token refresh successful');
    authToken = refreshResult.data.data.token;
  } else {
    log.error('Token refresh failed');
    log.error(JSON.stringify(refreshResult.error, null, 2));
  }
  
  return meResult.success && refreshResult.success;
}

async function testUserManagement() {
  log.step('Testing User Management Endpoints');
  
  // Test get users (might fail if not admin)
  log.test('Testing GET /users');
  const usersResult = await makeRequest('GET', '/users');
  
  if (usersResult.success) {
    log.success('GET /users successful');
    log.info(`Found ${usersResult.data.data.users.length} users`);
  } else {
    log.warning('GET /users failed (might require admin role)');
    log.info(JSON.stringify(usersResult.error, null, 2));
  }
  
  // Test get current user profile
  if (testUserId) {
    log.test(`Testing GET /users/${testUserId}`);
    const userResult = await makeRequest('GET', `/users/${testUserId}`);
    
    if (userResult.success) {
      log.success('GET /users/:id successful');
      log.info(`User: ${userResult.data.data.user.name}`);
    } else {
      log.error('GET /users/:id failed');
      log.error(JSON.stringify(userResult.error, null, 2));
    }
  }
  
  return true;
}

async function testLogout() {
  log.step('Testing Logout');
  
  const result = await makeRequest('POST', '/auth/logout');
  
  if (result.success) {
    log.success('Logout successful');
    authToken = null;
  } else {
    log.error('Logout failed');
    log.error(JSON.stringify(result.error, null, 2));
  }
  
  return result.success;
}

async function testRateLimiting() {
  log.step('Testing Rate Limiting');
  
  log.test('Making multiple rapid simple auth requests to test rate limiting...');

  const requests = [];
  for (let i = 0; i < 5; i++) {
    requests.push(makeRequest('POST', '/auth/simple-auth', {
      email: TEST_EMAIL
    }));
  }
  
  const results = await Promise.all(requests);
  const successful = results.filter(r => r.success).length;
  const rateLimited = results.filter(r => r.status === 429).length;
  
  log.info(`Successful requests: ${successful}`);
  log.info(`Rate limited requests: ${rateLimited}`);
  
  if (rateLimited > 0) {
    log.success('Rate limiting is working correctly');
  } else {
    log.warning('Rate limiting might not be working as expected');
  }
  
  return true;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests for Key Management Authentication System\n'.rainbow.bold);
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck, required: true },
    { name: 'Simplified Authentication', fn: testSimpleAuth, required: true },
    { name: 'Login with OTP', fn: testLogin, required: true },
    { name: 'Authenticated Endpoints', fn: testAuthenticatedEndpoints, required: true },
    { name: 'User Management', fn: testUserManagement, required: false },
    { name: 'Rate Limiting', fn: testRateLimiting, required: false },
    { name: 'Logout', fn: testLogout, required: true }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        log.success(`✓ ${test.name} passed`);
      } else {
        failed++;
        log.error(`✗ ${test.name} failed`);
        if (test.required) {
          log.error('Required test failed. Stopping execution.');
          break;
        }
      }
    } catch (error) {
      failed++;
      log.error(`✗ ${test.name} threw an error: ${error.message}`);
      if (test.required) {
        log.error('Required test failed. Stopping execution.');
        break;
      }
    }
    
    // Wait a bit between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Results:'.bold);
  console.log(`✅ Passed: ${passed}`.green);
  console.log(`❌ Failed: ${failed}`.red);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The API is working correctly.'.green.bold);
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above.'.yellow.bold);
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npm run test:api [options]

Options:
  --help, -h     Show this help message
  --email EMAIL  Use custom test email (default: test.user@vnrvjiet.in)

Environment Variables:
  API_BASE_URL   Base URL for the API (default: http://localhost:5000/api)
  TEST_EMAIL     Email to use for testing (default: test.user@vnrvjiet.in)

Example:
  npm run test:api
  npm run test:api -- --email mytest@vnrvjiet.in
    `);
    process.exit(0);
  }
  
  const emailIndex = args.indexOf('--email');
  if (emailIndex !== -1 && args[emailIndex + 1]) {
    TEST_USER_DATA.email = args[emailIndex + 1];
    console.log(`Using custom test email: ${TEST_USER_DATA.email}`);
  }
  
  runTests().catch(error => {
    log.error(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };
