const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');

// Apply authentication to all security routes
router.use(verifyToken);

/**
 * GET /api/security/pending
 * Get pending handovers for security personnel
 */
router.get('/pending', requireRole(['security', 'security_incharge']), async (req, res) => {
  try {
    console.log('📋 Security API: Getting pending handovers for user:', req.user.email);
    
    // Mock data for development - replace with actual database queries
    const pendingHandovers = [
      {
        id: 'PH001',
        keyId: 'LAB-CS-101',
        keyName: 'Computer Science Lab 101',
        facultyName: 'Dr. John Smith',
        facultyEmail: 'john.smith@vnrvjiet.in',
        requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        expectedReturn: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        status: 'pending_collection',
        isOverdue: false,
        location: 'Security Office',
        purpose: 'Lab Session'
      },
      {
        id: 'PH002',
        keyId: 'LAB-CS-102',
        keyName: 'Computer Science Lab 102',
        facultyName: 'Dr. Jane Doe',
        facultyEmail: 'jane.doe@vnrvjiet.in',
        requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        expectedReturn: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago (overdue)
        status: 'pending_return',
        isOverdue: true,
        location: 'Lab Building',
        purpose: 'Practical Session'
      }
    ];

    console.log(`📋 Security API: Returning ${pendingHandovers.length} pending handovers`);
    
    res.json({
      success: true,
      message: 'Pending handovers retrieved successfully',
      data: {
        pendingHandovers,
        total: pendingHandovers.length,
        overdue: pendingHandovers.filter(p => p.isOverdue).length
      }
    });

  } catch (error) {
    console.error('❌ Security API Error (pending):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pending handovers',
      code: 'SECURITY_PENDING_ERROR'
    });
  }
});

/**
 * GET /api/security/scan
 * Get scan history/logs for a specific date
 */
router.get('/scan', requireRole(['security', 'security_incharge']), async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    console.log('📋 Security API: Getting scan logs for date:', targetDate, 'by user:', req.user.email);
    
    // Mock data for development - replace with actual database queries
    const scanHistory = [
      {
        id: 'SCAN001',
        timestamp: new Date(),
        keyId: 'LAB-CS-101',
        keyName: 'Computer Science Lab 101',
        action: 'collection',
        facultyName: 'Dr. John Smith',
        facultyEmail: 'john.smith@vnrvjiet.in',
        securityPersonnel: req.user.name,
        location: 'Security Office',
        qrData: {
          keyId: 'LAB-CS-101',
          action: 'collection',
          timestamp: new Date().toISOString()
        },
        status: 'completed'
      },
      {
        id: 'SCAN002',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        keyId: 'LAB-CS-102',
        keyName: 'Computer Science Lab 102',
        action: 'return',
        facultyName: 'Dr. Jane Doe',
        facultyEmail: 'jane.doe@vnrvjiet.in',
        securityPersonnel: req.user.name,
        location: 'Lab Building',
        qrData: {
          keyId: 'LAB-CS-102',
          action: 'return',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        status: 'completed'
      }
    ];

    console.log(`📋 Security API: Returning ${scanHistory.length} scan logs for ${targetDate}`);
    
    res.json({
      success: true,
      message: 'Scan history retrieved successfully',
      data: {
        scanHistory,
        total: scanHistory.length,
        date: targetDate,
        securityPersonnel: req.user.name
      }
    });

  } catch (error) {
    console.error('❌ Security API Error (scan logs):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve scan history',
      code: 'SECURITY_SCAN_LOGS_ERROR'
    });
  }
});

/**
 * POST /api/security/scan
 * Process QR code scan for key collection/return
 */
router.post('/scan', requireRole(['security', 'security_incharge']), async (req, res) => {
  try {
    const { qrData, action } = req.body;
    
    console.log('📋 Security API: Processing QR scan by user:', req.user.email);
    console.log('📋 QR Data:', qrData);
    console.log('📋 Action:', action);
    
    // Validate QR data
    if (!qrData || !qrData.keyId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code data',
        code: 'INVALID_QR_DATA'
      });
    }

    // Mock processing - replace with actual business logic
    const scanResult = {
      id: `SCAN${Date.now()}`,
      timestamp: new Date(),
      keyId: qrData.keyId,
      keyName: `Lab Key ${qrData.keyId}`,
      action: action || qrData.action || 'collection',
      securityPersonnel: req.user.name,
      securityEmail: req.user.email,
      status: 'completed',
      location: 'Security Office',
      qrData: qrData
    };

    console.log('📋 Security API: QR scan processed successfully:', scanResult.id);
    
    res.json({
      success: true,
      message: 'QR code processed successfully',
      data: {
        scanResult,
        nextAction: action === 'collection' ? 'Key handed over to faculty' : 'Key returned to security'
      }
    });

  } catch (error) {
    console.error('❌ Security API Error (QR scan):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process QR code scan',
      code: 'SECURITY_QR_SCAN_ERROR'
    });
  }
});

/**
 * GET /api/security/logs
 * Get comprehensive security logs
 */
router.get('/logs', requireRole(['security', 'security_incharge']), async (req, res) => {
  try {
    const { date, limit = 50 } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    console.log('📋 Security API: Getting security logs for date:', targetDate);
    
    // Mock comprehensive logs
    const logs = [
      {
        id: 'LOG001',
        timestamp: new Date(),
        type: 'key_collection',
        keyId: 'LAB-CS-101',
        facultyEmail: 'john.smith@vnrvjiet.in',
        securityPersonnel: req.user.name,
        details: 'Key collected for lab session'
      },
      {
        id: 'LOG002',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        type: 'key_return',
        keyId: 'LAB-CS-102',
        facultyEmail: 'jane.doe@vnrvjiet.in',
        securityPersonnel: req.user.name,
        details: 'Key returned after practical session'
      }
    ];

    res.json({
      success: true,
      message: 'Security logs retrieved successfully',
      data: {
        logs,
        total: logs.length,
        date: targetDate,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Security API Error (logs):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security logs',
      code: 'SECURITY_LOGS_ERROR'
    });
  }
});

module.exports = router;
