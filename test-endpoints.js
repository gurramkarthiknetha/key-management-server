#!/usr/bin/env node

/**
 * Comprehensive API Endpoint Testing Script
 * Tests all available endpoints in the Key Management Server
 * 
 * Usage: node test-endpoints.js
 * Make sure the server is running on http://localhost:5000
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5000';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test data
const testData = {
  validUser: {
    email: 'test@example.com',
    password: 'password123'
  },
  newUser: {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'securepass123',
    employeeId: 'EMP003',
    role: 'faculty',
    department: 'Mathematics'
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  }
};

let authToken = null;

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Log test result
 */
function logResult(testName, success, details = '') {
  const status = success ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`   ${colors.blue}${details}${colors.reset}`);
  }
}

/**
 * Log section header
 */
function logSection(title) {
  console.log(`\n${colors.bold}${colors.yellow}=== ${title} ===${colors.reset}`);
}

/**
 * Test health endpoint
 */
async function testHealth() {
  logSection('Health Check');
  
  try {
    const response = await makeRequest('GET', '/health');
    const success = response.status === 200 && response.body.success === true;
    logResult('GET /health', success, `Status: ${response.status}, Message: ${response.body.message || 'N/A'}`);
    return success;
  } catch (error) {
    logResult('GET /health', false, `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test authentication endpoints
 */
async function testAuth() {
  logSection('Authentication Endpoints');
  
  // Test login with valid credentials
  try {
    const response = await makeRequest('POST', '/api/auth/login', testData.validUser);
    const success = response.status === 200 && response.body.success === true;
    logResult('POST /api/auth/login (valid)', success, 
      `Status: ${response.status}, User: ${response.body.data?.user?.name || 'N/A'}`);
    
    if (success && response.body.data?.token) {
      authToken = response.body.data.token;
    }
  } catch (error) {
    logResult('POST /api/auth/login (valid)', false, `Error: ${error.message}`);
  }

  // Test login with invalid credentials
  try {
    const response = await makeRequest('POST', '/api/auth/login', testData.invalidUser);
    const success = response.status === 401;
    logResult('POST /api/auth/login (invalid)', success, 
      `Status: ${response.status}, Expected: 401`);
  } catch (error) {
    logResult('POST /api/auth/login (invalid)', false, `Error: ${error.message}`);
  }

  // Test login with missing data
  try {
    const response = await makeRequest('POST', '/api/auth/login', { email: 'test@example.com' });
    const success = response.status === 400;
    logResult('POST /api/auth/login (missing password)', success, 
      `Status: ${response.status}, Expected: 400`);
  } catch (error) {
    logResult('POST /api/auth/login (missing password)', false, `Error: ${error.message}`);
  }

  // Test user registration
  try {
    const response = await makeRequest('POST', '/api/auth/register', testData.newUser);
    const success = response.status === 201 && response.body.success === true;
    logResult('POST /api/auth/register', success, 
      `Status: ${response.status}, User: ${response.body.data?.name || 'N/A'}`);
  } catch (error) {
    logResult('POST /api/auth/register', false, `Error: ${error.message}`);
  }

  // Test registration with missing data
  try {
    const response = await makeRequest('POST', '/api/auth/register', { 
      name: 'Test User', 
      email: 'test@example.com' 
    });
    const success = response.status === 400;
    logResult('POST /api/auth/register (missing fields)', success, 
      `Status: ${response.status}, Expected: 400`);
  } catch (error) {
    logResult('POST /api/auth/register (missing fields)', false, `Error: ${error.message}`);
  }

  // Test get current user
  try {
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    const response = await makeRequest('GET', '/api/auth/me', null, headers);
    const success = response.status === 200 && response.body.success === true;
    logResult('GET /api/auth/me', success, 
      `Status: ${response.status}, User: ${response.body.data?.name || 'N/A'}`);
  } catch (error) {
    logResult('GET /api/auth/me', false, `Error: ${error.message}`);
  }
}

/**
 * Test non-existent endpoints
 */
async function testNotFound() {
  logSection('404 Error Handling');
  
  try {
    const response = await makeRequest('GET', '/api/nonexistent');
    const success = response.status === 404;
    logResult('GET /api/nonexistent', success, 
      `Status: ${response.status}, Expected: 404`);
  } catch (error) {
    logResult('GET /api/nonexistent', false, `Error: ${error.message}`);
  }

  try {
    const response = await makeRequest('POST', '/api/invalid/endpoint');
    const success = response.status === 404;
    logResult('POST /api/invalid/endpoint', success, 
      `Status: ${response.status}, Expected: 404`);
  } catch (error) {
    logResult('POST /api/invalid/endpoint', false, `Error: ${error.message}`);
  }
}

/**
 * Test server connectivity
 */
async function testConnectivity() {
  logSection('Server Connectivity');
  
  try {
    const response = await makeRequest('GET', '/');
    logResult('Server reachable', true, `Base URL accessible`);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logResult('Server reachable', false, 'Server is not running on http://localhost:5000');
      console.log(`\n${colors.red}${colors.bold}ERROR: Server is not running!${colors.reset}`);
      console.log(`${colors.yellow}Please start the server with: npm run dev${colors.reset}\n`);
      process.exit(1);
    } else {
      logResult('Server reachable', false, `Error: ${error.message}`);
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bold}${colors.blue}Key Management Server API Test Suite${colors.reset}`);
  console.log(`${colors.blue}Testing server at: ${BASE_URL}${colors.reset}\n`);

  const startTime = Date.now();
  
  // Test server connectivity first
  await testConnectivity();
  
  // Run all tests
  await testHealth();
  await testAuth();
  await testNotFound();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n${colors.bold}${colors.green}Test Suite Completed${colors.reset}`);
  console.log(`${colors.blue}Total time: ${duration}s${colors.reset}`);
  console.log(`\n${colors.yellow}Note: Some tests use mock data since database models are not fully implemented.${colors.reset}`);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest, testData };
