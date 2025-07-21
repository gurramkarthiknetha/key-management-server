import express, { Request, Response } from 'express';
import Key, { IKey } from '../models/Key';
import AccessHistory from '../models/AccessHistory';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all keys (Security and Security-Head only)
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    
    // Check if user has permission to view all keys
    if (!['security_staff', 'security_incharge'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied - insufficient permissions'
      });
      return;
    }

    const { status, department, assignedTo } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (assignedTo) filter.assignedTo = assignedTo;

    const keys = await Key.find(filter)
      .populate('assignedTo', 'userId role')
      .sort({ keyId: 1 });

    res.json({
      success: true,
      data: {
        keys,
        total: keys.length
      }
    });

  } catch (error: any) {
    console.error('Get all keys error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user's assigned keys (Faculty only)
router.get('/my', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    
    // Check if user is faculty
    if (!['faculty', 'faculty_lab_staff', 'hod'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied - only faculty can view assigned keys'
      });
      return;
    }

    const keys = await Key.findByUser(user.userId);

    res.json({
      success: true,
      data: {
        keys,
        total: keys.length
      }
    });

  } catch (error: any) {
    console.error('Get my keys error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get key by ID
router.get('/:keyId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyId } = req.params;
    const user = (req as any).user;

    const key = await Key.findOne({ keyId }).populate('assignedTo', 'userId role');
    
    if (!key) {
      res.status(404).json({
        success: false,
        error: 'Key not found'
      });
      return;
    }

    // Check permissions - faculty can only see their own keys
    if (user.role === 'faculty' && key.assignedTo !== user.userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied - you can only view your assigned keys'
      });
      return;
    }

    res.json({
      success: true,
      data: { key }
    });

  } catch (error: any) {
    console.error('Get key by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new key (Security-Head only)
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    
    // Check if user has permission to create keys
    if (user.role !== 'security_incharge') {
      res.status(403).json({
        success: false,
        error: 'Access denied - only security incharge can create keys'
      });
      return;
    }

    const { keyId, keyName, labName, department, location, description } = req.body;

    // Validation
    if (!keyId || !keyName || !labName || !department || !location) {
      res.status(400).json({
        success: false,
        error: 'Key ID, name, lab name, department, and location are required'
      });
      return;
    }

    // Check if key already exists
    const existingKey = await Key.findOne({ keyId });
    if (existingKey) {
      res.status(409).json({
        success: false,
        error: 'Key ID already exists'
      });
      return;
    }

    // Create new key
    const key = new Key({
      keyId,
      keyName,
      labName,
      department,
      location,
      description
    });

    await key.save();

    // Log the creation
    await AccessHistory.create({
      keyId: key.keyId,
      userId: user.userId,
      action: 'assigned',
      notes: 'Key created',
      securityPersonnelId: user.userId,
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Key created successfully',
      data: { key }
    });

  } catch (error: any) {
    console.error('Create key error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Assign key to user
router.post('/:keyId/assign', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyId } = req.params;
    const { assignTo, durationHours, assignmentType = 'temporary' } = req.body;
    const user = (req as any).user;

    // Check permissions
    if (!['security_staff', 'security_incharge'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied - insufficient permissions'
      });
      return;
    }

    // Validation
    if (!assignTo) {
      res.status(400).json({
        success: false,
        error: 'User ID to assign to is required'
      });
      return;
    }

    const key = await Key.findOne({ keyId });
    if (!key) {
      res.status(404).json({
        success: false,
        error: 'Key not found'
      });
      return;
    }

    if (key.status !== 'available') {
      res.status(400).json({
        success: false,
        error: 'Key is not available for assignment'
      });
      return;
    }

    // Calculate due date for temporary assignments
    let dueDate: Date | undefined = undefined;
    if (assignmentType === 'temporary' && durationHours) {
      dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + parseInt(durationHours));
    }

    // Update key
    key.status = 'assigned';
    key.assignedTo = assignTo;
    key.assignedDate = new Date();
    key.dueDate = dueDate;
    key.assignmentType = assignmentType;

    await key.save();

    // Log the assignment
    await AccessHistory.create({
      keyId: key.keyId,
      userId: assignTo,
      action: 'assigned',
      notes: `Key assigned by ${user.userId} for ${assignmentType} use${durationHours ? ` (${durationHours} hours)` : ''}`,
      securityPersonnelId: user.userId,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Key assigned successfully',
      data: { key }
    });

  } catch (error: any) {
    console.error('Assign key error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Return key
router.post('/:keyId/return', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyId } = req.params;
    const user = (req as any).user;

    // Check permissions
    if (!['security_staff', 'security_incharge'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied - insufficient permissions'
      });
      return;
    }

    const key = await Key.findOne({ keyId });
    if (!key) {
      res.status(404).json({
        success: false,
        error: 'Key not found'
      });
      return;
    }

    if (key.status !== 'assigned') {
      res.status(400).json({
        success: false,
        error: 'Key is not currently assigned'
      });
      return;
    }

    const previousAssignee = key.assignedTo;

    // Update key
    key.status = 'available';
    key.assignedTo = undefined;
    key.assignedDate = undefined;
    key.dueDate = undefined;
    key.assignmentType = 'temporary';

    await key.save();

    // Log the return
    await AccessHistory.create({
      keyId: key.keyId,
      userId: previousAssignee || user.userId,
      action: 'returned',
      notes: `Key returned to ${user.userId}`,
      securityPersonnelId: user.userId,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Key returned successfully',
      data: { key }
    });

  } catch (error: any) {
    console.error('Return key error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Scan QR code
router.post('/scan', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrData, location, deviceInfo } = req.body;
    const user = (req as any).user;

    // Validation
    if (!qrData) {
      res.status(400).json({
        success: false,
        error: 'QR data is required'
      });
      return;
    }

    let parsedQRData;
    try {
      parsedQRData = JSON.parse(qrData);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid QR code format'
      });
      return;
    }

    const { keyId } = parsedQRData;
    if (!keyId) {
      res.status(400).json({
        success: false,
        error: 'QR code does not contain valid key information'
      });
      return;
    }

    const key = await Key.findOne({ keyId });
    if (!key) {
      // Log failed attempt
      await AccessHistory.create({
        keyId: keyId,
        userId: user.userId,
        action: 'scanned',
        location,
        notes: 'Key not found in database',
        scanData: {
          qrData,
          deviceInfo,
          ipAddress: req.ip
        },
        status: 'failed'
      });

      res.status(404).json({
        success: false,
        error: 'Key not found'
      });
      return;
    }

    // Check if user has access to this key
    const hasAccess = key.assignedTo === user.userId ||
                     ['security_staff', 'security_incharge'].includes(user.role);

    const action = hasAccess ? 'access_granted' : 'access_denied';
    const status = hasAccess ? 'success' : 'failed';

    // Log the scan attempt
    await AccessHistory.create({
      keyId: key.keyId,
      userId: user.userId,
      action,
      location,
      notes: hasAccess ? 'QR scan successful - access granted' : 'QR scan failed - access denied',
      scanData: {
        qrData,
        deviceInfo,
        ipAddress: req.ip
      },
      status
    });

    if (hasAccess) {
      res.json({
        success: true,
        message: 'Access granted',
        data: {
          key: {
            keyId: key.keyId,
            keyName: key.keyName,
            labName: key.labName,
            department: key.department,
            location: key.location
          },
          accessGranted: true
        }
      });
    } else {
      res.status(403).json({
        success: false,
        error: 'Access denied - key not assigned to you',
        data: {
          accessGranted: false
        }
      });
    }

  } catch (error: any) {
    console.error('Scan QR error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete key (Security-Head only)
router.delete('/:keyId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyId } = req.params;
    const user = (req as any).user;

    // Check permissions
    if (user.role !== 'security_incharge') {
      res.status(403).json({
        success: false,
        error: 'Access denied - only security incharge can delete keys'
      });
      return;
    }

    const key = await Key.findOne({ keyId });
    if (!key) {
      res.status(404).json({
        success: false,
        error: 'Key not found'
      });
      return;
    }

    if (key.status === 'assigned') {
      res.status(400).json({
        success: false,
        error: 'Cannot delete assigned key - return it first'
      });
      return;
    }

    await Key.deleteOne({ keyId });

    // Log the deletion
    await AccessHistory.create({
      keyId: key.keyId,
      userId: user.userId,
      action: 'returned', // Using 'returned' as closest action for deletion
      notes: 'Key deleted from system',
      securityPersonnelId: user.userId,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Key deleted successfully',
      data: { deletedKey: key }
    });

  } catch (error: any) {
    console.error('Delete key error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get key statistics
router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    // Check permissions
    if (!['security_staff', 'security_incharge'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied - insufficient permissions'
      });
      return;
    }

    const now = new Date();
    const [
      totalKeys,
      availableKeys,
      assignedKeys,
      overdueKeys,
      maintenanceKeys
    ] = await Promise.all([
      Key.countDocuments({}),
      Key.countDocuments({ status: 'available' }),
      Key.countDocuments({ status: 'assigned' }),
      Key.countDocuments({
        status: 'assigned',
        assignmentType: 'temporary',
        dueDate: { $lt: now }
      }),
      Key.countDocuments({ status: 'maintenance' })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total: totalKeys,
          available: availableKeys,
          assigned: assignedKeys,
          overdue: overdueKeys,
          maintenance: maintenanceKeys,
          lost: totalKeys - availableKeys - assignedKeys - maintenanceKeys
        }
      }
    });

  } catch (error: any) {
    console.error('Get key stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
