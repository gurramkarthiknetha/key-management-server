#!/usr/bin/env node

/**
 * Test Data Import Script
 * Tests the data import functionality without requiring MongoDB
 * 
 * Usage: node test-import.js
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

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
 * Test seed data structure
 */
async function testSeedData() {
  logSection('Seed Data Structure');
  
  try {
    // Test if we can import the seed data module
    const seedDataPath = './src/data/seedData.ts';
    
    // Check if file exists
    const fs = require('fs');
    const fileExists = fs.existsSync(seedDataPath);
    logResult('Seed data file exists', fileExists, `Path: ${seedDataPath}`);
    
    if (fileExists) {
      // Read file content to check structure
      const content = fs.readFileSync(seedDataPath, 'utf8');
      
      const hasUsers = content.includes('export const users');
      logResult('Users data defined', hasUsers);
      
      const hasDepartments = content.includes('export const departments');
      logResult('Departments data defined', hasDepartments);
      
      const hasKeys = content.includes('export const keys');
      logResult('Keys data defined', hasKeys);
      
      const hasKeyLogs = content.includes('export const keyLogs');
      logResult('Key logs data defined', hasKeyLogs);
      
      const hasNotifications = content.includes('export const notifications');
      logResult('Notifications data defined', hasNotifications);
      
      const hasDefaultExport = content.includes('export default');
      logResult('Default export defined', hasDefaultExport);
    }
    
  } catch (error) {
    logResult('Seed data structure test', false, `Error: ${error.message}`);
  }
}

/**
 * Test import script structure
 */
async function testImportScript() {
  logSection('Import Script Structure');
  
  try {
    const importScriptPath = './src/scripts/importData.ts';
    const fs = require('fs');
    
    const fileExists = fs.existsSync(importScriptPath);
    logResult('Import script exists', fileExists, `Path: ${importScriptPath}`);
    
    if (fileExists) {
      const content = fs.readFileSync(importScriptPath, 'utf8');
      
      const hasImportFunction = content.includes('async function importData');
      logResult('Import function defined', hasImportFunction);
      
      const hasClearFunction = content.includes('async function clearData');
      logResult('Clear data function defined', hasClearFunction);
      
      const hasUserImport = content.includes('async function importUsers');
      logResult('User import function defined', hasUserImport);
      
      const hasKeyImport = content.includes('async function importKeys');
      logResult('Key import function defined', hasKeyImport);
      
      const hasMainExecution = content.includes('if (require.main === module)');
      logResult('Main execution block defined', hasMainExecution);
    }
    
  } catch (error) {
    logResult('Import script structure test', false, `Error: ${error.message}`);
  }
}

/**
 * Test package.json scripts
 */
async function testPackageScripts() {
  logSection('Package.json Scripts');
  
  try {
    const packagePath = './package.json';
    const fs = require('fs');
    
    const fileExists = fs.existsSync(packagePath);
    logResult('Package.json exists', fileExists);
    
    if (fileExists) {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const scripts = packageContent.scripts || {};
      
      const hasImportScript = 'import:data' in scripts;
      logResult('import:data script defined', hasImportScript, 
        hasImportScript ? `Command: ${scripts['import:data']}` : 'Missing');
      
      const hasImportNoClearScript = 'import:data:no-clear' in scripts;
      logResult('import:data:no-clear script defined', hasImportNoClearScript,
        hasImportNoClearScript ? `Command: ${scripts['import:data:no-clear']}` : 'Missing');
      
      const hasSeedScript = 'seed' in scripts;
      logResult('seed script defined', hasSeedScript,
        hasSeedScript ? `Command: ${scripts['seed']}` : 'Missing');
      
      const hasTestScript = 'test:endpoints' in scripts;
      logResult('test:endpoints script defined', hasTestScript,
        hasTestScript ? `Command: ${scripts['test:endpoints']}` : 'Missing');
    }
    
  } catch (error) {
    logResult('Package scripts test', false, `Error: ${error.message}`);
  }
}

/**
 * Test data validation
 */
async function testDataValidation() {
  logSection('Data Validation');
  
  try {
    // Test sample data counts and structure
    const seedDataPath = './src/data/seedData.ts';
    const fs = require('fs');
    
    if (fs.existsSync(seedDataPath)) {
      const content = fs.readFileSync(seedDataPath, 'utf8');
      
      // Count departments
      const departmentMatches = content.match(/{\s*name:/g);
      const departmentCount = departmentMatches ? departmentMatches.length : 0;
      logResult('Departments count > 0', departmentCount > 0, `Found: ${departmentCount} departments`);
      
      // Check for required fields
      const hasEmailFields = content.includes('email:');
      logResult('Email fields present', hasEmailFields);
      
      const hasPasswordFields = content.includes('password:');
      logResult('Password fields present', hasPasswordFields);
      
      const hasRoleFields = content.includes('role:');
      logResult('Role fields present', hasRoleFields);
      
      const hasKeyIdFields = content.includes('keyId:');
      logResult('KeyId fields present', hasKeyIdFields);
      
      const hasStatusFields = content.includes('status:');
      logResult('Status fields present', hasStatusFields);
    }
    
  } catch (error) {
    logResult('Data validation test', false, `Error: ${error.message}`);
  }
}

/**
 * Test TypeScript compilation readiness
 */
async function testTypeScriptReadiness() {
  logSection('TypeScript Compilation');
  
  try {
    // Check if TypeScript files can be parsed
    const { spawn } = require('child_process');
    
    // Test if ts-node is available
    const tsNodeCheck = spawn('npx', ['ts-node', '--version'], { stdio: 'pipe' });
    
    tsNodeCheck.on('close', (code) => {
      logResult('ts-node available', code === 0, 
        code === 0 ? 'Ready for TypeScript execution' : 'ts-node not available');
    });
    
    // Check TypeScript config
    const fs = require('fs');
    const tsconfigExists = fs.existsSync('./tsconfig.json');
    logResult('TypeScript config exists', tsconfigExists);
    
  } catch (error) {
    logResult('TypeScript readiness test', false, `Error: ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bold}${colors.blue}Data Import System Test Suite${colors.reset}`);
  console.log(`${colors.blue}Testing data import functionality${colors.reset}\n`);

  const startTime = Date.now();
  
  // Run all tests
  await testSeedData();
  await testImportScript();
  await testPackageScripts();
  await testDataValidation();
  await testTypeScriptReadiness();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n${colors.bold}${colors.green}Test Suite Completed${colors.reset}`);
  console.log(`${colors.blue}Total time: ${duration}s${colors.reset}`);
  
  console.log(`\n${colors.yellow}Usage Instructions:${colors.reset}`);
  console.log(`${colors.blue}• Run data import: npm run import:data${colors.reset}`);
  console.log(`${colors.blue}• Import without clearing: npm run import:data:no-clear${colors.reset}`);
  console.log(`${colors.blue}• Quick seed: npm run seed${colors.reset}`);
  console.log(`\n${colors.yellow}Note: Import requires MongoDB connection for full functionality.${colors.reset}`);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
