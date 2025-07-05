/**
 * Seed Data for Key Management System
 * Contains sample data for testing and development
 */

import { UserRole, KeyStatus, LogAction } from '../types';

export const departments = [
  {
    name: 'Computer Science',
    code: 'CS',
    description: 'Computer Science and Engineering Department',
    location: 'Building A, Floor 3',
    contactEmail: 'cs@university.edu',
    contactPhone: '+1-555-0101',
    hodId: null, // Will be set after users are created
    isActive: true
  },
  {
    name: 'Information Technology',
    code: 'IT',
    description: 'Information Technology Department',
    location: 'Building B, Floor 2',
    contactEmail: 'it@university.edu',
    contactPhone: '+1-555-0102',
    hodId: null,
    isActive: true
  },
  {
    name: 'Mathematics',
    code: 'MATH',
    description: 'Mathematics Department',
    location: 'Building C, Floor 1',
    contactEmail: 'math@university.edu',
    contactPhone: '+1-555-0103',
    hodId: null,
    isActive: true
  },
  {
    name: 'Physics',
    code: 'PHY',
    description: 'Physics Department',
    location: 'Building D, Floor 2',
    contactEmail: 'physics@university.edu',
    contactPhone: '+1-555-0104',
    hodId: null,
    isActive: true
  },
  {
    name: 'Security',
    code: 'SEC',
    description: 'Campus Security Department',
    location: 'Security Office, Ground Floor',
    contactEmail: 'security@university.edu',
    contactPhone: '+1-555-0105',
    hodId: null,
    isActive: true
  }
];

export const users = [
  {
    name: 'Admin User',
    email: 'admin@university.edu',
    password: 'admin123', // Will be hashed
    employeeId: 'ADM001',
    role: UserRole.ADMIN,
    department: 'IT',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date()
  },
  {
    name: 'Security Chief',
    email: 'security.chief@university.edu',
    password: 'security123',
    employeeId: 'SEC001',
    role: UserRole.SECURITY_INCHARGE,
    department: 'Security',
    isActive: true,
    createdAt: new Date('2024-01-02'),
    lastLogin: new Date()
  },
  {
    name: 'John Security',
    email: 'john.security@university.edu',
    password: 'guard123',
    employeeId: 'SEC002',
    role: UserRole.SECURITY_STAFF,
    department: 'Security',
    isActive: true,
    createdAt: new Date('2024-01-03'),
    lastLogin: new Date()
  },
  {
    name: 'Dr. Alice Johnson',
    email: 'alice.johnson@university.edu',
    password: 'faculty123',
    employeeId: 'CS001',
    role: UserRole.FACULTY,
    department: 'Computer Science',
    isActive: true,
    createdAt: new Date('2024-01-04'),
    lastLogin: new Date()
  },
  {
    name: 'Prof. Bob Smith',
    email: 'bob.smith@university.edu',
    password: 'hod123',
    employeeId: 'CS002',
    role: UserRole.HOD,
    department: 'Computer Science',
    isActive: true,
    createdAt: new Date('2024-01-05'),
    lastLogin: new Date()
  },
  {
    name: 'Dr. Carol Davis',
    email: 'carol.davis@university.edu',
    password: 'faculty123',
    employeeId: 'IT001',
    role: UserRole.FACULTY,
    department: 'Information Technology',
    isActive: true,
    createdAt: new Date('2024-01-06'),
    lastLogin: new Date()
  },
  {
    name: 'Prof. David Wilson',
    email: 'david.wilson@university.edu',
    password: 'hod123',
    employeeId: 'MATH001',
    role: UserRole.HOD,
    department: 'Mathematics',
    isActive: true,
    createdAt: new Date('2024-01-07'),
    lastLogin: new Date()
  },
  {
    name: 'Mike Security',
    email: 'mike.security@university.edu',
    password: 'guard123',
    employeeId: 'SEC003',
    role: UserRole.SECURITY_STAFF,
    department: 'Security',
    isActive: true,
    createdAt: new Date('2024-01-08'),
    lastLogin: new Date()
  }
];

export const keys = [
  {
    keyId: 'CS-LAB-001',
    name: 'Computer Lab 1',
    description: 'Main computer laboratory with 30 workstations',
    department: 'Computer Science',
    location: 'Building A, Room 301',
    status: KeyStatus.AVAILABLE,
    maxLoanDuration: 480, // 8 hours in minutes
    category: 'Laboratory',
    priority: 'High',
    tags: ['computer', 'lab', 'programming'],
    isActive: true
  },
  {
    keyId: 'CS-LAB-002',
    name: 'Computer Lab 2',
    description: 'Secondary computer lab for advanced courses',
    department: 'Computer Science',
    location: 'Building A, Room 302',
    status: KeyStatus.AVAILABLE,
    maxLoanDuration: 480,
    category: 'Laboratory',
    priority: 'High',
    tags: ['computer', 'lab', 'advanced'],
    isActive: true
  },
  {
    keyId: 'CS-OFF-001',
    name: 'CS Faculty Office 1',
    description: 'Faculty office for CS department',
    department: 'Computer Science',
    location: 'Building A, Room 310',
    status: KeyStatus.AVAILABLE,
    maxLoanDuration: 1440, // 24 hours
    category: 'Office',
    priority: 'Medium',
    tags: ['office', 'faculty'],
    isActive: true
  },
  {
    keyId: 'IT-LAB-001',
    name: 'Network Lab',
    description: 'Networking and infrastructure laboratory',
    department: 'Information Technology',
    location: 'Building B, Room 201',
    status: KeyStatus.ISSUED,
    currentHolder: null, // Will be set to user ID after users are created
    issuedAt: new Date(),
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    maxLoanDuration: 480,
    category: 'Laboratory',
    priority: 'High',
    tags: ['network', 'lab', 'infrastructure'],
    isActive: true
  },
  {
    keyId: 'MATH-001',
    name: 'Mathematics Classroom 1',
    description: 'Large classroom for mathematics lectures',
    department: 'Mathematics',
    location: 'Building C, Room 101',
    status: KeyStatus.AVAILABLE,
    maxLoanDuration: 240, // 4 hours
    category: 'Classroom',
    priority: 'Medium',
    tags: ['classroom', 'lecture'],
    isActive: true
  },
  {
    keyId: 'PHY-LAB-001',
    name: 'Physics Laboratory',
    description: 'General physics laboratory with equipment',
    department: 'Physics',
    location: 'Building D, Room 201',
    status: KeyStatus.MAINTENANCE,
    maxLoanDuration: 480,
    category: 'Laboratory',
    priority: 'High',
    tags: ['physics', 'lab', 'equipment'],
    lastMaintenanceDate: new Date(),
    nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true
  },
  {
    keyId: 'SEC-001',
    name: 'Security Office',
    description: 'Main security office key',
    department: 'Security',
    location: 'Security Office, Ground Floor',
    status: KeyStatus.AVAILABLE,
    maxLoanDuration: 1440, // 24 hours
    category: 'Office',
    priority: 'Critical',
    tags: ['security', 'office', 'critical'],
    isActive: true
  },
  {
    keyId: 'STORE-001',
    name: 'Equipment Storage',
    description: 'General equipment storage room',
    department: 'IT',
    location: 'Building B, Basement',
    status: KeyStatus.OVERDUE,
    currentHolder: null, // Will be set after users are created
    issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
    maxLoanDuration: 1440,
    category: 'Storage',
    priority: 'Medium',
    tags: ['storage', 'equipment'],
    isActive: true
  }
];

export const keyLogs = [
  {
    keyId: 'CS-LAB-001',
    userId: null, // Will be set after users are created
    action: LogAction.CHECK_OUT,
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    location: 'Building A, Room 301',
    notes: 'Lab session for Programming 101',
    performedBy: null // Will be set after users are created
  },
  {
    keyId: 'CS-LAB-001',
    userId: null,
    action: LogAction.CHECK_IN,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    location: 'Building A, Room 301',
    duration: 120, // 2 hours
    notes: 'Lab session completed',
    performedBy: null
  },
  {
    keyId: 'IT-LAB-001',
    userId: null,
    action: LogAction.CHECK_OUT,
    timestamp: new Date(),
    location: 'Building B, Room 201',
    notes: 'Network configuration class',
    performedBy: null
  }
];

export const notifications = [
  {
    title: 'Key Overdue',
    message: 'Equipment Storage key (STORE-001) is overdue',
    type: 'warning',
    userId: null, // Will be set to admin user
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    title: 'Maintenance Required',
    message: 'Physics Laboratory (PHY-LAB-001) requires maintenance',
    type: 'info',
    userId: null,
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
  },
  {
    title: 'New User Registration',
    message: 'New faculty member registered: Dr. Carol Davis',
    type: 'success',
    userId: null,
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  }
];

export default {
  departments,
  users,
  keys,
  keyLogs,
  notifications
};
