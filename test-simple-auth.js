#!/usr/bin/env node

/**
 * Quick test for the simplified authentication system
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testSimpleAuth() {
  console.log('🧪 Testing Simplified Authentication System\n');

  // Test different email patterns
  const testEmails = [
    'john.doe@vnrvjiet.in',           // Should be Faculty
    'hod.cse@vnrvjiet.in',            // Should be HOD
    'security@vnrvjiet.in',           // Should be Security
    'security.incharge@vnrvjiet.in',  // Should be Security Incharge
    'admin@vnrvjiet.in',              // Should be Admin
    'dr.smith.cse@vnrvjiet.in',       // Should be Faculty (CSE)
    'prof.kumar.ece@vnrvjiet.in',     // Should be Faculty (ECE)
  ];

  for (const email of testEmails) {
    try {
      console.log(`📧 Testing email: ${email}`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/simple-auth`, {
        email: email
      });

      if (response.data.success) {
        const user = response.data.data;
        console.log(`✅ Success! Auto-created user:`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role} (${user.roleDisplayName})`);
        console.log(`   Department: ${user.department}`);
        console.log(`   Message: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.error || error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  // Test invalid email
  console.log('🚫 Testing invalid email domain:');
  try {
    await axios.post(`${API_BASE_URL}/auth/simple-auth`, {
      email: 'test@gmail.com'
    });
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.response?.data?.error}`);
  }

  console.log('\n🎉 Simple authentication test completed!');
  console.log('\nTo test the full flow:');
  console.log('1. Visit http://localhost:3000/login');
  console.log('2. Enter any @vnrvjiet.in email');
  console.log('3. Check email for OTP');
  console.log('4. Enter OTP to complete login');
}

// Run the test
testSimpleAuth().catch(console.error);
