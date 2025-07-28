const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Mock data for keys (temporary until full implementation)
const mockKeys = [
  {
    id: 'CSE-LAB-001',
    name: 'Computer Lab 1',
    labName: 'Programming Lab',
    labNumber: 'CSE-101',
    department: 'Computer Science',
    description: 'Main programming laboratory with 40 computers',
    keyType: 'lab',
    location: {
      building: 'CSE Block',
      floor: '1st Floor',
      room: 'Room 101'
    },
    isActive: true,
    status: 'available',
    currentHolder: null,
    lastUsed: null
  },
  {
    id: 'CSE-LAB-002',
    name: 'Computer Lab 2',
    labName: 'Data Structures Lab',
    labNumber: 'CSE-102',
    department: 'Computer Science',
    description: 'Advanced programming laboratory',
    keyType: 'lab',
    location: {
      building: 'CSE Block',
      floor: '1st Floor',
      room: 'Room 102'
    },
    isActive: true,
    status: 'available',
    currentHolder: null,
    lastUsed: null
  },
  {
    id: 'CSE-OFF-001',
    name: 'HOD Office',
    labName: 'Head of Department Office',
    labNumber: 'CSE-HOD',
    department: 'Computer Science',
    description: 'Head of Department office key',
    keyType: 'office',
    location: {
      building: 'CSE Block',
      floor: '2nd Floor',
      room: 'Room 201'
    },
    isActive: true,
    status: 'available',
    currentHolder: null,
    lastUsed: null
  },
  {
    id: 'IT-LAB-001',
    name: 'IT Lab 1',
    labName: 'Network Lab',
    labNumber: 'IT-101',
    department: 'Information Technology',
    description: 'Networking and systems laboratory',
    keyType: 'lab',
    location: {
      building: 'IT Block',
      floor: '1st Floor',
      room: 'Room 101'
    },
    isActive: true,
    status: 'available',
    currentHolder: null,
    lastUsed: null
  },
  {
    id: 'ECE-LAB-001',
    name: 'Electronics Lab',
    labName: 'Digital Electronics Lab',
    labNumber: 'ECE-101',
    department: 'Electronics',
    description: 'Digital electronics and circuits lab',
    keyType: 'lab',
    location: {
      building: 'ECE Block',
      floor: '1st Floor',
      room: 'Room 101'
    },
    isActive: true,
    status: 'available',
    currentHolder: null,
    lastUsed: null
  }
];

/**
 * @route   GET /api/keys
 * @desc    Get keys based on type and user permissions
 * @access  Private
 */
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const { type = 'all' } = req.query;
  const user = req.user;

  console.log(`📋 Keys API: User ${user.email} requesting keys of type: ${type}`);

  let filteredKeys = [...mockKeys];

  // Filter based on type
  switch (type) {
    case 'my-keys':
      // Return keys currently held by the user
      filteredKeys = mockKeys.filter(key => key.currentHolder === user.id);
      break;
    
    case 'dept-keys':
      // Return keys from user's department
      filteredKeys = mockKeys.filter(key => 
        key.department === user.department || 
        key.department === 'Computer Science' // Default for demo
      );
      break;
    
    case 'all':
    default:
      // Return all active keys (admin/security can see all)
      if (['admin', 'security', 'security_incharge'].includes(user.role)) {
        filteredKeys = mockKeys.filter(key => key.isActive);
      } else {
        // Faculty can see their department keys
        filteredKeys = mockKeys.filter(key => 
          key.department === user.department && key.isActive
        );
      }
      break;
  }

  console.log(`📋 Keys API: Returning ${filteredKeys.length} keys for user ${user.email}`);

  res.json({
    success: true,
    message: `Keys retrieved successfully`,
    data: {
      keys: filteredKeys,
      total: filteredKeys.length,
      type: type,
      userDepartment: user.department,
      userRole: user.role
    }
  });
}));

/**
 * @route   GET /api/keys/history
 * @desc    Get key usage history
 * @access  Private
 */
router.get('/history', verifyToken, asyncHandler(async (req, res) => {
  const user = req.user;

  // Mock history data
  const mockHistory = [
    {
      id: 'hist-001',
      keyId: 'CSE-LAB-001',
      keyName: 'Computer Lab 1',
      action: 'borrowed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      returnedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      duration: '1 hour',
      purpose: 'Class lecture'
    },
    {
      id: 'hist-002',
      keyId: 'CSE-LAB-002',
      keyName: 'Computer Lab 2',
      action: 'borrowed',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      returnedAt: new Date(Date.now() - 22 * 60 * 60 * 1000), // 22 hours ago
      duration: '2 hours',
      purpose: 'Lab session'
    }
  ];

  res.json({
    success: true,
    message: 'Key history retrieved successfully',
    data: {
      history: mockHistory,
      total: mockHistory.length
    }
  });
}));

module.exports = router;
