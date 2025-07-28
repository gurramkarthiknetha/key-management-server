const express = require('express');
const { verifyToken, requireMinRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply authentication to all admin routes
router.use(verifyToken);

/**
 * @route   GET /api/admin/keys
 * @desc    Get all keys with statistics (security_incharge only)
 * @access  Private (Security Incharge)
 */
router.get('/keys', requireMinRole('security_incharge'), asyncHandler(async (req, res) => {
  const { includeStats } = req.query;
  const user = req.user;

  console.log(`📋 Admin API: User ${user.email} requesting keys with stats: ${includeStats}`);

  // Mock data for keys with statistics
  const mockKeysWithStats = [
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
      lastUsed: null,
      stats: {
        totalUsage: 45,
        thisWeek: 8,
        averageDuration: '2.5 hours',
        lastUsedBy: 'Dr. Smith'
      }
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
      status: 'in_use',
      currentHolder: {
        id: 'faculty-001',
        name: 'Prof. Johnson',
        email: 'johnson@vnrvjiet.in'
      },
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      stats: {
        totalUsage: 32,
        thisWeek: 5,
        averageDuration: '3.2 hours',
        lastUsedBy: 'Prof. Johnson'
      }
    },
    {
      id: 'PHY-LAB-001',
      name: 'Physics Lab',
      labName: 'Mechanics Lab',
      labNumber: 'PHY-101',
      department: 'Physics',
      description: 'Physics mechanics laboratory',
      keyType: 'lab',
      location: {
        building: 'Science Block',
        floor: '2nd Floor',
        room: 'Room 201'
      },
      isActive: true,
      status: 'available',
      currentHolder: null,
      lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
      stats: {
        totalUsage: 28,
        thisWeek: 3,
        averageDuration: '2.8 hours',
        lastUsedBy: 'Dr. Wilson'
      }
    }
  ];

  const response = {
    success: true,
    message: 'Keys retrieved successfully',
    data: {
      keys: mockKeysWithStats,
      total: mockKeysWithStats.length,
      summary: {
        totalKeys: mockKeysWithStats.length,
        available: mockKeysWithStats.filter(k => k.status === 'available').length,
        inUse: mockKeysWithStats.filter(k => k.status === 'in_use').length,
        maintenance: mockKeysWithStats.filter(k => k.status === 'maintenance').length
      }
    }
  };

  if (includeStats === 'true') {
    response.data.statistics = {
      totalUsageThisWeek: mockKeysWithStats.reduce((sum, key) => sum + (key.stats?.thisWeek || 0), 0),
      averageUsageDuration: '2.8 hours',
      mostUsedKey: mockKeysWithStats.reduce((prev, current) => 
        (prev.stats?.totalUsage || 0) > (current.stats?.totalUsage || 0) ? prev : current
      ),
      departments: [...new Set(mockKeysWithStats.map(k => k.department))]
    };
  }

  console.log(`📋 Admin API: Returning ${mockKeysWithStats.length} keys for user ${user.email}`);

  res.json(response);
}));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Security Incharge)
 */
router.get('/dashboard', requireMinRole('security_incharge'), asyncHandler(async (req, res) => {
  const user = req.user;

  console.log(`📊 Admin API: User ${user.email} requesting dashboard stats`);

  const dashboardStats = {
    keys: {
      total: 25,
      available: 18,
      inUse: 5,
      maintenance: 2
    },
    users: {
      total: 150,
      faculty: 120,
      security: 8,
      hod: 15,
      security_incharge: 2,
      active: 145
    },
    transactions: {
      today: 12,
      thisWeek: 78,
      thisMonth: 324,
      pending: 3
    },
    alerts: {
      overdueKeys: 2,
      maintenanceRequired: 1,
      securityIssues: 0
    }
  };

  res.json({
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: dashboardStats
  });
}));

module.exports = router;
