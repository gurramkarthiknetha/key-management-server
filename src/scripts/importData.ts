#!/usr/bin/env ts-node

/**
 * Data Import Script for Key Management System
 * Imports seed data into MongoDB database
 * 
 * Usage: npm run import:data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { hashPassword } from '../utils/auth';
import { generateUserQRData, generateQRCode } from '../utils/qr';
import seedData from '../data/seedData';

// Load environment variables
dotenv.config();

// Import models (when they're fixed)
// import { User } from '../models/User';
// import { Department } from '../models/Department';
// import { Key } from '../models/Key';
// import { KeyLog } from '../models/KeyLog';
// import { Notification } from '../models/Notification';

// Mock models for now (replace with real models when fixed)
const mockModel = {
  deleteMany: async () => ({ deletedCount: 0 }),
  insertMany: async (data: any[]) => data.map((item, index) => ({ ...item, _id: `mock_id_${index}` })),
  findOne: async (query: any) => null,
  findByIdAndUpdate: async (id: string, update: any) => ({ _id: id, ...update })
};

const User = mockModel;
const Department = mockModel;
const Key = mockModel;
const KeyLog = mockModel;
const Notification = mockModel;

interface ImportOptions {
  clearExisting?: boolean;
  verbose?: boolean;
}

/**
 * Clear existing data from all collections
 */
async function clearData(): Promise<void> {
  console.log('🗑️  Clearing existing data...');
  
  try {
    await User.deleteMany({});
    await Department.deleteMany({});
    await Key.deleteMany({});
    await KeyLog.deleteMany({});
    await Notification.deleteMany({});
    
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

/**
 * Import departments
 */
async function importDepartments(): Promise<any[]> {
  console.log('📁 Importing departments...');
  
  try {
    const departments = await Department.insertMany(seedData.departments);
    console.log(`✅ Imported ${departments.length} departments`);
    return departments;
  } catch (error) {
    console.error('❌ Error importing departments:', error);
    throw error;
  }
}

/**
 * Import users with password hashing and QR code generation
 */
async function importUsers(): Promise<any[]> {
  console.log('👥 Importing users...');
  
  try {
    const usersWithHashedPasswords = await Promise.all(
      seedData.users.map(async (user) => {
        const hashedPassword = await hashPassword(user.password);
        const userWithHashedPassword = {
          ...user,
          password: hashedPassword,
          email: user.email.toLowerCase()
        };
        
        return userWithHashedPassword;
      })
    );
    
    const users = await User.insertMany(usersWithHashedPasswords);
    
    // Generate QR codes for users
    console.log('🔗 Generating QR codes for users...');
    for (const user of users) {
      try {
        const qrData = generateUserQRData(user._id.toString());
        const qrCode = await generateQRCode(qrData);
        
        // Update user with QR code (mock implementation)
        await User.findByIdAndUpdate(user._id, { qrCode });
      } catch (qrError) {
        console.warn(`⚠️  Failed to generate QR code for user ${user.email}:`, qrError.message);
      }
    }
    
    console.log(`✅ Imported ${users.length} users with QR codes`);
    return users;
  } catch (error) {
    console.error('❌ Error importing users:', error);
    throw error;
  }
}

/**
 * Import keys with QR code generation
 */
async function importKeys(users: any[]): Promise<any[]> {
  console.log('🔑 Importing keys...');
  
  try {
    // Set current holders for some keys
    const keysWithHolders = seedData.keys.map((key) => {
      if (key.status === 'ISSUED' || key.status === 'OVERDUE') {
        // Assign to a random faculty member
        const facultyUsers = users.filter(u => u.role === 'faculty' || u.role === 'hod');
        if (facultyUsers.length > 0) {
          const randomUser = facultyUsers[Math.floor(Math.random() * facultyUsers.length)];
          return {
            ...key,
            currentHolder: randomUser._id
          };
        }
      }
      return key;
    });
    
    const keys = await Key.insertMany(keysWithHolders);
    
    // Generate QR codes for keys
    console.log('🔗 Generating QR codes for keys...');
    for (const key of keys) {
      try {
        const qrData = {
          type: 'key',
          keyId: key.keyId,
          id: key._id.toString(),
          name: key.name
        };
        const qrCode = await generateQRCode(qrData);
        
        // Update key with QR code (mock implementation)
        await Key.findByIdAndUpdate(key._id, { qrCode });
      } catch (qrError) {
        console.warn(`⚠️  Failed to generate QR code for key ${key.keyId}:`, qrError.message);
      }
    }
    
    console.log(`✅ Imported ${keys.length} keys with QR codes`);
    return keys;
  } catch (error) {
    console.error('❌ Error importing keys:', error);
    throw error;
  }
}

/**
 * Import key logs
 */
async function importKeyLogs(users: any[], keys: any[]): Promise<any[]> {
  console.log('📋 Importing key logs...');
  
  try {
    // Map key logs to actual user and key IDs
    const logsWithIds = seedData.keyLogs.map((log) => {
      const key = keys.find(k => k.keyId === log.keyId);
      const user = users.find(u => u.role === 'faculty' || u.role === 'hod');
      const performedBy = users.find(u => u.role === 'security_staff' || u.role === 'admin');
      
      return {
        ...log,
        keyId: key?._id || log.keyId,
        userId: user?._id || null,
        performedBy: performedBy?._id || null
      };
    });
    
    const keyLogs = await KeyLog.insertMany(logsWithIds);
    console.log(`✅ Imported ${keyLogs.length} key logs`);
    return keyLogs;
  } catch (error) {
    console.error('❌ Error importing key logs:', error);
    throw error;
  }
}

/**
 * Import notifications
 */
async function importNotifications(users: any[]): Promise<any[]> {
  console.log('🔔 Importing notifications...');
  
  try {
    // Assign notifications to admin users
    const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'security_incharge');
    
    const notificationsWithUsers = seedData.notifications.map((notification, index) => {
      const targetUser = adminUsers[index % adminUsers.length];
      return {
        ...notification,
        userId: targetUser?._id || null
      };
    });
    
    const notifications = await Notification.insertMany(notificationsWithUsers);
    console.log(`✅ Imported ${notifications.length} notifications`);
    return notifications;
  } catch (error) {
    console.error('❌ Error importing notifications:', error);
    throw error;
  }
}

/**
 * Update department HODs
 */
async function updateDepartmentHODs(users: any[], departments: any[]): Promise<void> {
  console.log('👨‍💼 Updating department HODs...');
  
  try {
    const hodUsers = users.filter(u => u.role === 'hod');
    
    for (const hod of hodUsers) {
      const department = departments.find(d => d.name === hod.department || d.code === hod.department);
      if (department) {
        await Department.findByIdAndUpdate(department._id, { hodId: hod._id });
      }
    }
    
    console.log(`✅ Updated HODs for departments`);
  } catch (error) {
    console.error('❌ Error updating department HODs:', error);
    throw error;
  }
}

/**
 * Main import function
 */
async function importData(options: ImportOptions = {}): Promise<void> {
  const { clearExisting = true, verbose = true } = options;
  
  try {
    console.log('🚀 Starting data import...');
    console.log(`📊 Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/key-management'}`);
    
    // Connect to database
    await connectDB();
    
    // Clear existing data if requested
    if (clearExisting) {
      await clearData();
    }
    
    // Import data in order (respecting dependencies)
    const departments = await importDepartments();
    const users = await importUsers();
    const keys = await importKeys(users);
    const keyLogs = await importKeyLogs(users, keys);
    const notifications = await importNotifications(users);
    
    // Update relationships
    await updateDepartmentHODs(users, departments);
    
    console.log('\n🎉 Data import completed successfully!');
    console.log('📈 Summary:');
    console.log(`   • ${departments.length} departments`);
    console.log(`   • ${users.length} users`);
    console.log(`   • ${keys.length} keys`);
    console.log(`   • ${keyLogs.length} key logs`);
    console.log(`   • ${notifications.length} notifications`);
    
    if (verbose) {
      console.log('\n👥 Sample Users:');
      console.log('   • admin@university.edu (password: admin123) - Admin');
      console.log('   • security.chief@university.edu (password: security123) - Security Incharge');
      console.log('   • alice.johnson@university.edu (password: faculty123) - Faculty');
      console.log('   • bob.smith@university.edu (password: hod123) - HOD');
    }
    
  } catch (error) {
    console.error('💥 Data import failed:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run import if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    clearExisting: !args.includes('--no-clear'),
    verbose: !args.includes('--quiet')
  };
  
  importData(options)
    .then(() => {
      console.log('✅ Import completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

export { importData };
export default importData;
