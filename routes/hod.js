const express = require('express');
const { verifyToken, requireMinRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply authentication to all HOD routes
router.use(verifyToken);

/**
 * @route   GET /api/hod/analytics
 * @desc    Get HOD analytics data
 * @access  Private (HOD or Security Incharge)
 */
router.get('/analytics', requireMinRole('hod'), asyncHandler(async (req, res) => {
  const { type = 'overview' } = req.query;
  const user = req.user;

  console.log(`📊 HOD API: User ${user.email} requesting analytics of type: ${type}`);

  let analyticsData = {};

  switch (type) {
    case 'overview':
      analyticsData = {
        totalKeys: 25,
        keysInUse: 5,
        overdueKeys: 2,
        totalUsers: 150,
        activeUsers: 145,
        todayTransactions: 12,
        weeklyTransactions: 78,
        departmentBreakdown: {
          'Computer Science': { keys: 8, usage: 65 },
          'Electronics': { keys: 6, usage: 45 },
          'Mechanical': { keys: 5, usage: 38 },
          'Civil': { keys: 4, usage: 28 },
          'Physics': { keys: 2, usage: 15 }
        },
        usageStats: {
          peakHours: ['10:00-12:00', '14:00-16:00'],
          averageUsageDuration: '2.8 hours',
          mostActiveDay: 'Tuesday'
        }
      };
      break;

    case 'department':
      analyticsData = {
        departmentKeys: [
          {
            department: 'Computer Science',
            totalKeys: 8,
            inUse: 3,
            available: 5,
            usage: {
              thisWeek: 25,
              lastWeek: 22,
              trend: 'up'
            }
          },
          {
            department: 'Electronics',
            totalKeys: 6,
            inUse: 1,
            available: 5,
            usage: {
              thisWeek: 18,
              lastWeek: 20,
              trend: 'down'
            }
          }
        ]
      };
      break;

    case 'usage':
      analyticsData = {
        dailyUsage: [
          { date: '2024-01-22', count: 8 },
          { date: '2024-01-23', count: 12 },
          { date: '2024-01-24', count: 15 },
          { date: '2024-01-25', count: 10 },
          { date: '2024-01-26', count: 14 }
        ],
        hourlyDistribution: [
          { hour: '08:00', count: 2 },
          { hour: '09:00', count: 5 },
          { hour: '10:00', count: 8 },
          { hour: '11:00', count: 12 },
          { hour: '12:00', count: 6 },
          { hour: '13:00', count: 3 },
          { hour: '14:00', count: 9 },
          { hour: '15:00', count: 11 },
          { hour: '16:00', count: 7 },
          { hour: '17:00', count: 4 }
        ]
      };
      break;

    default:
      analyticsData = {
        error: 'Invalid analytics type',
        availableTypes: ['overview', 'department', 'usage']
      };
  }

  console.log(`📊 HOD API: Returning ${type} analytics for user ${user.email}`);

  res.json({
    success: true,
    message: `${type} analytics retrieved successfully`,
    data: analyticsData
  });
}));

/**
 * @route   GET /api/hod/faculty
 * @desc    Get faculty management data
 * @access  Private (HOD or Security Incharge)
 */
router.get('/faculty', requireMinRole('hod'), asyncHandler(async (req, res) => {
  const user = req.user;

  console.log(`👥 HOD API: User ${user.email} requesting faculty data`);

  const facultyData = [
    {
      id: 'faculty-001',
      name: 'Dr. Smith',
      email: 'smith@vnrvjiet.in',
      department: 'Computer Science',
      currentKeys: 1,
      totalUsage: 45,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'active',
      accessLevel: 'Standard',
      assignedKeys: ['CSE-LAB-001']
    },
    {
      id: 'faculty-002',
      name: 'Prof. Johnson',
      email: 'johnson@vnrvjiet.in',
      department: 'Computer Science',
      currentKeys: 2,
      totalUsage: 32,
      lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'active',
      accessLevel: 'Advanced',
      assignedKeys: ['CSE-LAB-002', 'CSE-LAB-003']
    },
    {
      id: 'faculty-003',
      name: 'Dr. Wilson',
      email: 'wilson@vnrvjiet.in',
      department: 'Physics',
      currentKeys: 0,
      totalUsage: 28,
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'active',
      accessLevel: 'Standard',
      assignedKeys: []
    }
  ];

  res.json({
    success: true,
    message: 'Faculty data retrieved successfully',
    data: {
      faculty: facultyData,
      total: facultyData.length,
      summary: {
        totalFaculty: facultyData.length,
        activeFaculty: facultyData.filter(f => f.status === 'active').length,
        facultyWithKeys: facultyData.filter(f => f.assignedKeys.length > 0).length,
        totalKeysInUse: facultyData.reduce((sum, f) => sum + f.assignedKeys.length, 0)
      }
    }
  });
}));

/**
 * @route   GET /api/hod/reports
 * @desc    Get HOD reports
 * @access  Private (HOD or Security Incharge)
 */
router.get('/reports', requireMinRole('hod'), asyncHandler(async (req, res) => {
  const { type = 'summary', startDate, endDate } = req.query;
  const user = req.user;

  console.log(`📋 HOD API: User ${user.email} requesting ${type} report`);

  let reportData = {};

  switch (type) {
    case 'daily':
      reportData = {
        type: 'daily',
        title: 'Daily Summary Report',
        generatedAt: new Date(),
        generatedBy: user.email,
        period: {
          start: new Date().toDateString(),
          end: new Date().toDateString()
        },
        summary: {
          totalTransactions: 12,
          uniqueUsers: 8,
          peakUsageHour: '14:00',
          averageUsageDuration: '1.5 hours',
          keysInUse: 5,
          overdueKeys: 1
        },
        transactions: [
          { time: '08:30', user: 'Dr. Smith', action: 'Key Checkout', key: 'CSE-LAB-001' },
          { time: '10:15', user: 'Prof. Johnson', action: 'Key Return', key: 'CSE-LAB-002' },
          { time: '14:20', user: 'Dr. Wilson', action: 'Key Checkout', key: 'PHY-LAB-001' },
          { time: '16:45', user: 'Dr. Smith', action: 'Key Return', key: 'CSE-LAB-001' }
        ],
        departmentStats: {
          'Computer Science': { checkouts: 8, returns: 6, active: 2 },
          'Physics': { checkouts: 3, returns: 3, active: 0 },
          'Electronics': { checkouts: 1, returns: 1, active: 0 }
        }
      };
      break;

    case 'faculty':
      reportData = {
        type: 'faculty',
        title: 'Faculty Usage Report',
        generatedAt: new Date(),
        generatedBy: user.email,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toDateString(),
          end: new Date().toDateString()
        },
        summary: {
          totalFaculty: 15,
          activeFaculty: 12,
          facultyWithKeys: 5,
          averageUsagePerFaculty: '3.2 hours/week'
        },
        facultyDetails: [
          {
            name: 'Dr. Smith',
            email: 'smith@vnrvjiet.in',
            department: 'Computer Science',
            totalUsage: 45,
            keysUsed: ['CSE-LAB-001', 'CSE-LAB-003'],
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: 'active'
          },
          {
            name: 'Prof. Johnson',
            email: 'johnson@vnrvjiet.in',
            department: 'Computer Science',
            totalUsage: 32,
            keysUsed: ['CSE-LAB-002'],
            lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
            status: 'active'
          },
          {
            name: 'Dr. Wilson',
            email: 'wilson@vnrvjiet.in',
            department: 'Physics',
            totalUsage: 28,
            keysUsed: [],
            lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
            status: 'active'
          }
        ]
      };
      break;

    case 'weekly':
      reportData = {
        type: 'weekly',
        title: 'Weekly Analysis Report',
        generatedAt: new Date(),
        generatedBy: user.email,
        period: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toDateString(),
          end: new Date().toDateString()
        },
        summary: {
          totalTransactions: 78,
          uniqueUsers: 25,
          peakUsageDay: 'Tuesday',
          averageUsageDuration: '2.8 hours',
          weeklyGrowth: '+12%'
        },
        dailyBreakdown: [
          { day: 'Monday', transactions: 8, users: 6, peakHour: '10:00' },
          { day: 'Tuesday', transactions: 15, users: 9, peakHour: '14:00' },
          { day: 'Wednesday', transactions: 12, users: 8, peakHour: '11:00' },
          { day: 'Thursday', transactions: 14, users: 7, peakHour: '15:00' },
          { day: 'Friday', transactions: 18, users: 10, peakHour: '13:00' },
          { day: 'Saturday', transactions: 6, users: 4, peakHour: '09:00' },
          { day: 'Sunday', transactions: 5, users: 3, peakHour: '16:00' }
        ]
      };
      break;

    default:
      reportData = {
        type: 'summary',
        title: 'General Summary Report',
        generatedAt: new Date(),
        generatedBy: user.email,
        period: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toDateString(),
          end: new Date().toDateString()
        },
        summary: {
          totalTransactions: 78,
          uniqueUsers: 25,
          peakUsageDay: 'Tuesday',
          averageUsageDuration: '2.8 hours'
        }
      };
  }

  console.log(`📋 HOD API: Generated ${type} report for user ${user.email}`);

  res.json({
    success: true,
    message: `${type} report generated successfully`,
    data: reportData
  });
}));

module.exports = router;
