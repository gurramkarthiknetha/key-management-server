#!/usr/bin/env node

/**
 * Keys Import Script
 * Imports seed data for keys into the database
 */

const mongoose = require('mongoose');
const colors = require('colors');
require('dotenv').config();

// Import models (we'll need to create the Key model)
const Key = require('../models/Key');
const User = require('../models/User');

// Helper functions
const log = {
  info: (msg) => console.log('ℹ️ '.blue + msg),
  success: (msg) => console.log('✅ '.green + msg.green),
  error: (msg) => console.log('❌ '.red + msg.red),
  warning: (msg) => console.log('⚠️ '.yellow + msg.yellow),
  step: (msg) => console.log('\n📋 '.magenta + msg.magenta.bold)
};

// Sample keys data
const keysData = [
  // Computer Science Department
  {
    keyId: 'CSE-LAB-001',
    name: 'Computer Science Lab 1',
    description: 'Main programming lab with 60 computers',
    location: 'Block A, Floor 2, Room 201',
    department: 'Computer Science and Engineering',
    category: 'laboratory',
    isActive: true,
    maxAllowedTime: 480, // 8 hours in minutes
    requiresApproval: false,
    allowedRoles: ['faculty', 'hod'],
    qrCode: 'CSE-LAB-001-QR',
    specifications: {
      capacity: 60,
      equipment: ['Computers', 'Projector', 'Whiteboard', 'AC'],
      software: ['Visual Studio', 'Eclipse', 'Python', 'MySQL']
    }
  },
  {
    keyId: 'CSE-LAB-002',
    name: 'Computer Science Lab 2',
    description: 'Advanced programming and project lab',
    location: 'Block A, Floor 2, Room 202',
    department: 'Computer Science and Engineering',
    category: 'laboratory',
    isActive: true,
    maxAllowedTime: 480,
    requiresApproval: false,
    allowedRoles: ['faculty', 'hod'],
    qrCode: 'CSE-LAB-002-QR',
    specifications: {
      capacity: 40,
      equipment: ['Computers', 'Projector', 'Smart Board', 'AC'],
      software: ['IntelliJ IDEA', 'Android Studio', 'Git', 'Docker']
    }
  },
  {
    keyId: 'CSE-CONF-001',
    name: 'CSE Conference Room',
    description: 'Department conference and meeting room',
    location: 'Block A, Floor 3, Room 301',
    department: 'Computer Science and Engineering',
    category: 'conference_room',
    isActive: true,
    maxAllowedTime: 240, // 4 hours
    requiresApproval: true,
    allowedRoles: ['faculty', 'hod'],
    qrCode: 'CSE-CONF-001-QR',
    specifications: {
      capacity: 25,
      equipment: ['Projector', 'Conference Table', 'Chairs', 'AC', 'Video Conferencing']
    }
  },

  // Electronics and Communication Department
  {
    keyId: 'ECE-LAB-001',
    name: 'Electronics Lab 1',
    description: 'Basic electronics and circuits lab',
    location: 'Block B, Floor 1, Room 101',
    department: 'Electronics and Communication Engineering',
    category: 'laboratory',
    isActive: true,
    maxAllowedTime: 360, // 6 hours
    requiresApproval: false,
    allowedRoles: ['faculty', 'hod'],
    qrCode: 'ECE-LAB-001-QR',
    specifications: {
      capacity: 30,
      equipment: ['Oscilloscopes', 'Function Generators', 'Multimeters', 'Breadboards', 'Power Supplies']
    }
  },
  {
    keyId: 'ECE-LAB-002',
    name: 'Communication Systems Lab',
    description: 'Advanced communication and signal processing lab',
    location: 'Block B, Floor 2, Room 201',
    department: 'Electronics and Communication Engineering',
    category: 'laboratory',
    isActive: true,
    maxAllowedTime: 360,
    requiresApproval: false,
    allowedRoles: ['faculty', 'hod'],
    qrCode: 'ECE-LAB-002-QR',
    specifications: {
      capacity: 25,
      equipment: ['Spectrum Analyzers', 'Signal Generators', 'Network Analyzers', 'DSP Kits']
    }
  },

  // Mechanical Engineering Department
  {
    keyId: 'MECH-LAB-001',
    name: 'Manufacturing Lab',
    description: 'Mechanical manufacturing and machining lab',
    location: 'Block C, Floor 1, Room 101',
    department: 'Mechanical Engineering',
    category: 'laboratory',
    isActive: true,
    maxAllowedTime: 480,
    requiresApproval: true,
    allowedRoles: ['faculty', 'hod'],
    qrCode: 'MECH-LAB-001-QR',
    specifications: {
      capacity: 20,
      equipment: ['Lathe Machines', 'Milling Machines', 'Drilling Machines', 'Grinders', 'Safety Equipment']
    }
  },
  {
    keyId: 'MECH-LAB-002',
    name: 'CAD/CAM Lab',
    description: 'Computer-aided design and manufacturing lab',
    location: 'Block C, Floor 2, Room 201',
    department: 'Mechanical Engineering',
    category: 'laboratory',
    isActive: true,
    maxAllowedTime: 360,
    requiresApproval: false,
    allowedRoles: ['faculty', 'hod'],
    qrCode: 'MECH-LAB-002-QR',
    specifications: {
      capacity: 30,
      equipment: ['Computers', 'CAD Software', '3D Printers', 'Plotters'],
      software: ['AutoCAD', 'SolidWorks', 'CATIA', 'ANSYS']
    }
  },

  // General/Administrative Keys
  {
    keyId: 'ADMIN-AUD-001',
    name: 'Main Auditorium',
    description: 'College main auditorium for events',
    location: 'Block D, Ground Floor',
    department: 'General',
    category: 'auditorium',
    isActive: true,
    maxAllowedTime: 720, // 12 hours
    requiresApproval: true,
    allowedRoles: ['faculty', 'hod', 'admin'],
    qrCode: 'ADMIN-AUD-001-QR',
    specifications: {
      capacity: 500,
      equipment: ['Stage', 'Sound System', 'Projectors', 'Lighting', 'AC']
    }
  },
  {
    keyId: 'ADMIN-LIB-001',
    name: 'Library Conference Room',
    description: 'Library conference room for meetings',
    location: 'Library Building, Floor 2',
    department: 'General',
    category: 'conference_room',
    isActive: true,
    maxAllowedTime: 240,
    requiresApproval: true,
    allowedRoles: ['faculty', 'hod'],
    qrCode: 'ADMIN-LIB-001-QR',
    specifications: {
      capacity: 15,
      equipment: ['Conference Table', 'Projector', 'Whiteboard', 'AC']
    }
  },

  // Security Keys
  {
    keyId: 'SEC-GATE-001',
    name: 'Main Gate Control Room',
    description: 'Main entrance gate control and monitoring',
    location: 'Main Gate',
    department: 'Security',
    category: 'security',
    isActive: true,
    maxAllowedTime: 1440, // 24 hours
    requiresApproval: false,
    allowedRoles: ['security', 'security_incharge'],
    qrCode: 'SEC-GATE-001-QR',
    specifications: {
      equipment: ['CCTV Monitors', 'Access Control System', 'Communication Equipment']
    }
  },
  {
    keyId: 'SEC-PATROL-001',
    name: 'Security Patrol Vehicle',
    description: 'Campus security patrol vehicle',
    location: 'Security Office',
    department: 'Security',
    category: 'vehicle',
    isActive: true,
    maxAllowedTime: 480,
    requiresApproval: false,
    allowedRoles: ['security', 'security_incharge'],
    qrCode: 'SEC-PATROL-001-QR',
    specifications: {
      equipment: ['Radio Communication', 'First Aid Kit', 'Emergency Equipment']
    }
  }
];

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('Connected to MongoDB');
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
}

// Clear existing keys
async function clearKeys() {
  try {
    const result = await Key.deleteMany({});
    log.info(`Cleared ${result.deletedCount} existing keys`);
  } catch (error) {
    log.error(`Failed to clear keys: ${error.message}`);
    throw error;
  }
}

// Import keys
async function importKeys() {
  try {
    log.step('Importing Keys Data');
    
    let imported = 0;
    let errors = 0;
    
    for (const keyData of keysData) {
      try {
        const key = new Key(keyData);
        await key.save();
        imported++;
        log.success(`✓ Imported: ${keyData.keyId} - ${keyData.name}`);
      } catch (error) {
        errors++;
        log.error(`✗ Failed to import ${keyData.keyId}: ${error.message}`);
      }
    }
    
    log.step('Import Summary');
    log.success(`Successfully imported: ${imported} keys`);
    if (errors > 0) {
      log.error(`Failed to import: ${errors} keys`);
    }
    
    return { imported, errors };
  } catch (error) {
    log.error(`Import process failed: ${error.message}`);
    throw error;
  }
}

// Create sample admin user if not exists
async function createAdminUser() {
  try {
    log.step('Checking for Admin User');
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      log.info('Admin user already exists');
      return;
    }
    
    const adminUser = new User({
      email: 'admin@vnrvjiet.in',
      name: 'System Administrator',
      employeeId: 'ADMIN001',
      role: 'admin',
      department: 'Administration',
      isActive: true,
      isEmailVerified: true
    });
    
    await adminUser.save();
    log.success('Created admin user: admin@vnrvjiet.in');
  } catch (error) {
    log.warning(`Failed to create admin user: ${error.message}`);
  }
}

// Main import function
async function runImport() {
  console.log('🔑 Starting Keys Import Process\n'.rainbow.bold);
  
  try {
    await connectDB();
    
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear') || args.includes('-c');
    
    if (shouldClear) {
      log.step('Clearing Existing Data');
      await clearKeys();
    }
    
    await createAdminUser();
    const result = await importKeys();
    
    console.log('\n📊 Import Results:'.bold);
    console.log(`✅ Successfully imported: ${result.imported} keys`.green);
    if (result.errors > 0) {
      console.log(`❌ Failed imports: ${result.errors} keys`.red);
    }
    
    if (result.imported > 0) {
      console.log('\n🎉 Keys import completed successfully!'.green.bold);
      console.log('\nYou can now:');
      console.log('• View keys in the admin dashboard');
      console.log('• Test key requests and assignments');
      console.log('• Scan QR codes for key tracking');
    }
    
  } catch (error) {
    log.error(`Import failed: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log.info('Disconnected from database');
  }
}

// Handle command line execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npm run import:keys [options]

Options:
  --help, -h     Show this help message
  --clear, -c    Clear existing keys before importing

Examples:
  npm run import:keys              # Import keys (keep existing)
  npm run import:keys -- --clear   # Clear and import keys
    `);
    process.exit(0);
  }
  
  runImport().catch(error => {
    log.error(`Import script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runImport, keysData };
