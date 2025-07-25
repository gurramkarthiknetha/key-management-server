import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Key from '../models/Key';
import AccessHistory from '../models/AccessHistory';
import { connectDB } from '../config/database';

// Load environment variables
dotenv.config({ path: '.env.local' });

const seedData = async () => {
  try {
    console.log('🌱 Starting data seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Key.deleteMany({});
    await AccessHistory.deleteMany({});
    
    // Create users
    console.log('👥 Creating users...');
    const users = [
      // Original users
      {
        userId: 'LAB001',
        password: 'labstaff123',
        role: 'faculty_lab_staff'
      },
      {
        userId: 'HOD001',
        password: 'hod123',
        role: 'hod'
      },
      {
        userId: 'SECINC001',
        password: 'secincharge123',
        role: 'security_incharge'
      },
      // 10 Faculty users with fac123 credentials
      ...Array.from({ length: 10 }, (_, i) => ({
        userId: `fac123${String(i + 1).padStart(2, '0')}`,
        password: '123456789',
        role: 'faculty' as const
      })),
      // 40 Security users with sec123 credentials
      ...Array.from({ length: 40 }, (_, i) => ({
        userId: `sec123${String(i + 1).padStart(2, '0')}`,
        password: '123456789',
        role: 'security_staff' as const
      }))
    ];

    // Create users individually to trigger password hashing middleware
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create keys
    console.log('🔑 Creating keys...');
    const keys = [
      // Original keys
      {
        keyId: 'LAB-PH-001',
        keyName: 'Physics Laboratory Key',
        labName: 'Physics Laboratory',
        department: 'Physics',
        location: 'Block B, Floor 1, Room 101',
        description: 'Main physics lab with experimental equipment',
        status: 'available',
        assignmentType: 'temporary'
      },
      // 10 Keys for faculty users
      ...Array.from({ length: 10 }, (_, i) => {
        const keyNum = String(i + 1).padStart(3, '0');
        const facId = `fac123${String(i + 1).padStart(2, '0')}`;
        const departments = ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electronics', 'Information Technology'];
        const dept = departments[i % departments.length];

        return {
          keyId: `LAB-FAC-${keyNum}`,
          keyName: `${dept} Lab ${i + 1} Key`,
          labName: `${dept} Laboratory ${i + 1}`,
          department: dept,
          location: `Block ${String.fromCharCode(65 + Math.floor(i / 3))}, Floor ${(i % 3) + 1}, Room ${201 + i}`,
          description: `Access key for ${dept} Lab ${i + 1} - Faculty assigned`,
          status: 'assigned',
          assignedTo: facId,
          assignedDate: new Date('2024-01-15'),
          assignmentType: 'permanent'
        };
      }),
      // Additional keys for variety
      {
        keyId: 'LAB-CH-001',
        keyName: 'Chemistry Lab Key',
        labName: 'Chemistry Laboratory',
        department: 'Chemistry',
        location: 'Block B, Floor 2, Room 201',
        description: 'Chemistry lab with fume hoods and storage',
        status: 'assigned',
        assignedTo: 'LAB001',
        assignedDate: new Date('2024-06-01'),
        assignmentType: 'permanent'
      },
      {
        keyId: 'LAB-EE-001',
        keyName: 'Electrical Engineering Lab Key',
        labName: 'Electrical Engineering Lab',
        department: 'Electrical Engineering',
        location: 'Block C, Floor 1, Room 101',
        description: 'EE lab with circuit boards and testing equipment',
        status: 'available',
        assignmentType: 'temporary'
      },
      {
        keyId: 'STORE-001',
        keyName: 'Equipment Storage Room Key',
        labName: 'Equipment Storage Room',
        department: 'General',
        location: 'Block A, Ground Floor',
        description: 'Storage room for shared equipment and supplies',
        status: 'maintenance',
        assignmentType: 'temporary'
      },
      // 40 Additional keys for security staff access
      ...Array.from({ length: 40 }, (_, i) => {
        const keyNum = String(i + 1).padStart(3, '0');
        const areas = ['Main Gate', 'Parking Area', 'Library', 'Cafeteria', 'Auditorium', 'Admin Block', 'Hostel Block', 'Sports Complex'];
        const area = areas[i % areas.length];

        // Assign some keys to specific security staff for testing
        // sec12340 gets keys SEC-035 to SEC-040 (6 keys)
        // sec12339 gets keys SEC-030 to SEC-034 (5 keys)
        // sec12338 gets keys SEC-025 to SEC-029 (5 keys)
        // Rest remain available
        let status = 'available';
        let assignedTo = undefined;
        let assignedDate = undefined;

        if (i >= 34) { // SEC-035 to SEC-040 (indices 34-39)
          status = 'assigned';
          assignedTo = 'sec12340';
          assignedDate = new Date('2024-07-01');
        } else if (i >= 29) { // SEC-030 to SEC-034 (indices 29-33)
          status = 'assigned';
          assignedTo = 'sec12339';
          assignedDate = new Date('2024-07-01');
        } else if (i >= 24) { // SEC-025 to SEC-029 (indices 24-28)
          status = 'assigned';
          assignedTo = 'sec12338';
          assignedDate = new Date('2024-07-01');
        }

        return {
          keyId: `SEC-${keyNum}`,
          keyName: `${area} Security Key ${i + 1}`,
          labName: `${area} Security Access`,
          department: 'Security',
          location: `${area} - Zone ${Math.floor(i / 8) + 1}`,
          description: `Security access key for ${area} - Zone ${Math.floor(i / 8) + 1}`,
          status,
          assignedTo,
          assignedDate,
          assignmentType: 'temporary'
        };
      })
    ];

    const createdKeys = await Key.insertMany(keys);
    console.log(`✅ Created ${createdKeys.length} keys`);

    // Create access history
    console.log('📊 Creating access history...');
    const history = [
      // History for faculty users
      ...Array.from({ length: 10 }, (_, i) => {
        const facId = `fac123${String(i + 1).padStart(2, '0')}`;
        const keyId = `LAB-FAC-${String(i + 1).padStart(3, '0')}`;
        const secId = `sec123${String((i % 40) + 1).padStart(2, '0')}`;

        return {
          keyId: keyId,
          userId: facId,
          action: 'assigned',
          timestamp: new Date(`2024-01-${15 + i}T09:00:00Z`),
          notes: `Permanent assignment for faculty ${facId}`,
          securityPersonnelId: secId,
          status: 'success'
        };
      }),
      {
        keyId: 'LAB-CH-001',
        userId: 'LAB001',
        action: 'assigned',
        timestamp: new Date('2024-06-01T14:00:00Z'),
        notes: 'Lab staff permanent assignment',
        securityPersonnelId: 'SECINC001',
        status: 'success'
      },
      // Security staff key assignments
      // sec12340 assignments (SEC-035 to SEC-040)
      ...Array.from({ length: 6 }, (_, i) => {
        const keyNum = String(35 + i).padStart(3, '0');
        return {
          keyId: `SEC-${keyNum}`,
          userId: 'sec12340',
          action: 'assigned',
          timestamp: new Date(`2024-07-01T10:${String(i * 5).padStart(2, '0')}:00Z`),
          notes: `Security key assigned to sec12340 for zone patrol duties`,
          securityPersonnelId: 'SECINC001',
          status: 'success'
        };
      }),
      // sec12339 assignments (SEC-030 to SEC-034)
      ...Array.from({ length: 5 }, (_, i) => {
        const keyNum = String(30 + i).padStart(3, '0');
        return {
          keyId: `SEC-${keyNum}`,
          userId: 'sec12339',
          action: 'assigned',
          timestamp: new Date(`2024-07-01T11:${String(i * 5).padStart(2, '0')}:00Z`),
          notes: `Security key assigned to sec12339 for zone patrol duties`,
          securityPersonnelId: 'SECINC001',
          status: 'success'
        };
      }),
      // sec12338 assignments (SEC-025 to SEC-029)
      ...Array.from({ length: 5 }, (_, i) => {
        const keyNum = String(25 + i).padStart(3, '0');
        return {
          keyId: `SEC-${keyNum}`,
          userId: 'sec12338',
          action: 'assigned',
          timestamp: new Date(`2024-07-01T12:${String(i * 5).padStart(2, '0')}:00Z`),
          notes: `Security key assigned to sec12338 for zone patrol duties`,
          securityPersonnelId: 'SECINC001',
          status: 'success'
        };
      }),
      // Sample scan history for faculty users
      {
        keyId: 'LAB-FAC-001',
        userId: 'fac12301',
        action: 'scanned',
        timestamp: new Date('2024-07-20T08:30:00Z'),
        location: 'Faculty Mobile Device',
        notes: 'QR scan successful - access granted',
        scanData: {
          qrData: JSON.stringify({
            keyId: 'LAB-FAC-001',
            keyName: 'Computer Science Lab 1 Key',
            department: 'Computer Science',
            timestamp: new Date('2024-07-20T08:30:00Z').toISOString()
          }),
          deviceInfo: 'Mobile Device - Faculty App',
          ipAddress: '192.168.1.100'
        },
        status: 'success'
      },
      {
        keyId: 'LAB-FAC-002',
        userId: 'fac12302',
        action: 'access_granted',
        timestamp: new Date('2024-07-20T14:15:00Z'),
        location: 'Faculty Mobile Device',
        notes: 'QR scan successful - access granted',
        scanData: {
          qrData: JSON.stringify({
            keyId: 'LAB-FAC-002',
            keyName: 'Physics Lab 2 Key',
            department: 'Physics',
            timestamp: new Date('2024-07-20T14:15:00Z').toISOString()
          }),
          deviceInfo: 'Mobile Device - Faculty App',
          ipAddress: '192.168.1.101'
        },
        status: 'success'
      },
      {
        keyId: 'LAB-PH-001',
        userId: 'fac12303',
        action: 'access_denied',
        timestamp: new Date('2024-07-20T16:45:00Z'),
        location: 'Faculty Mobile Device',
        notes: 'QR scan failed - key not assigned to user',
        scanData: {
          qrData: JSON.stringify({
            keyId: 'LAB-PH-001',
            keyName: 'Physics Laboratory Key',
            department: 'Physics',
            timestamp: new Date('2024-07-20T16:45:00Z').toISOString()
          }),
          deviceInfo: 'Mobile Device - Faculty App',
          ipAddress: '192.168.1.100'
        },
        status: 'failed'
      }
    ];

    const createdHistory = await AccessHistory.insertMany(history);
    console.log(`✅ Created ${createdHistory.length} history entries`);

    console.log('🎉 Data seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Keys: ${createdKeys.length}`);
    console.log(`   History entries: ${createdHistory.length}`);
    
    console.log('\n👤 Test Users:');
    console.log('   Lab Staff: LAB001 / labstaff123');
    console.log('   HOD: HOD001 / hod123');
    console.log('   Security Incharge: SECINC001 / secincharge123');
    console.log('\n👨‍🏫 Faculty Users (10 total):');
    console.log('   fac12301 to fac12310 / 123456789');
    console.log('\n🛡️ Security Users (40 total):');
    console.log('   sec12301 to sec12340 / 123456789');
    console.log('\n🔑 Keys Summary:');
    console.log('   - 10 Faculty keys (LAB-FAC-001 to LAB-FAC-010) assigned to faculty');
    console.log('   - 40 Security keys (SEC-001 to SEC-040):');
    console.log('     • SEC-035 to SEC-040 assigned to sec12340 (6 keys)');
    console.log('     • SEC-030 to SEC-034 assigned to sec12339 (5 keys)');
    console.log('     • SEC-025 to SEC-029 assigned to sec12338 (5 keys)');
    console.log('     • SEC-001 to SEC-024 available for assignment (24 keys)');
    console.log('   - Additional lab and storage keys for variety');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  seedData();
}

export default seedData;
