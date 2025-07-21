import express, { Request, Response } from 'express';
import AccessHistory from '../models/AccessHistory';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get access history for current user (Faculty)
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { limit = 50, page = 1 } = req.query;

    // Faculty can only see their own history
    if (['faculty', 'faculty_lab_staff', 'hod'].includes(user.role)) {
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const history = await AccessHistory.find({ userId: user.userId })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string))
        .skip(skip);

      const total = await AccessHistory.countDocuments({ userId: user.userId });

      res.json({
        success: true,
        data: {
          history,
          pagination: {
            total,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            pages: Math.ceil(total / parseInt(limit as string))
          }
        }
      });
      return;
    }

    // Security staff can see all history
    if (['security_staff', 'security_incharge'].includes(user.role)) {
      const { userId, keyId, action, status, startDate, endDate } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (keyId) filter.keyId = keyId;
      if (action) filter.action = action;
      if (status) filter.status = status;
      
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate as string);
        if (endDate) filter.timestamp.$lte = new Date(endDate as string);
      }

      const history = await AccessHistory.find(filter)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string))
        .skip(skip);

      const total = await AccessHistory.countDocuments(filter);

      res.json({
        success: true,
        data: {
          history,
          pagination: {
            total,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            pages: Math.ceil(total / parseInt(limit as string))
          }
        }
      });
      return;
    }

    res.status(403).json({
      success: false,
      error: 'Access denied - insufficient permissions'
    });

  } catch (error: any) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get history for a specific key (Security staff only)
router.get('/key/:keyId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyId } = req.params;
    const { limit = 50 } = req.query;
    const user = (req as any).user;

    // Check permissions
    if (!['security_staff', 'security_incharge'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied - insufficient permissions'
      });
      return;
    }

    const history = await AccessHistory.findByKey(keyId, parseInt(limit as string));

    res.json({
      success: true,
      data: {
        keyId,
        history,
        total: history.length
      }
    });

  } catch (error: any) {
    console.error('Get key history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get recent activity (Security staff only)
router.get('/recent', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 100 } = req.query;
    const user = (req as any).user;

    // Check permissions
    if (!['security_staff', 'security_incharge'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied - insufficient permissions'
      });
      return;
    }

    const history = await AccessHistory.findRecentActivity(parseInt(limit as string));

    res.json({
      success: true,
      data: {
        history,
        total: history.length
      }
    });

  } catch (error: any) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get failed access attempts (Security staff only)
router.get('/failed', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { hours = 24, limit = 50 } = req.query;
    const user = (req as any).user;

    // Check permissions
    if (!['security_staff', 'security_incharge'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied - insufficient permissions'
      });
      return;
    }

    const timeRange = new Date();
    timeRange.setHours(timeRange.getHours() - parseInt(hours as string));

    const history = await AccessHistory.findFailedAttempts(timeRange, parseInt(limit as string));

    res.json({
      success: true,
      data: {
        history,
        timeRange: {
          from: timeRange,
          to: new Date(),
          hours: parseInt(hours as string)
        },
        total: history.length
      }
    });

  } catch (error: any) {
    console.error('Get failed attempts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get access statistics (Security staff only)
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);

    const [
      totalAccess,
      todayAccess,
      weekAccess,
      monthAccess,
      failedToday,
      failedWeek,
      successfulScans,
      failedScans
    ] = await Promise.all([
      AccessHistory.countDocuments({}),
      AccessHistory.countDocuments({ timestamp: { $gte: today } }),
      AccessHistory.countDocuments({ timestamp: { $gte: thisWeek } }),
      AccessHistory.countDocuments({ timestamp: { $gte: thisMonth } }),
      AccessHistory.countDocuments({ 
        status: 'failed', 
        timestamp: { $gte: today } 
      }),
      AccessHistory.countDocuments({ 
        status: 'failed', 
        timestamp: { $gte: thisWeek } 
      }),
      AccessHistory.countDocuments({ 
        action: { $in: ['scanned', 'access_granted'] },
        status: 'success'
      }),
      AccessHistory.countDocuments({ 
        action: { $in: ['scanned', 'access_denied'] },
        status: 'failed'
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total: {
            access: totalAccess,
            successful: totalAccess - failedScans,
            failed: failedScans
          },
          today: {
            access: todayAccess,
            failed: failedToday
          },
          week: {
            access: weekAccess,
            failed: failedWeek
          },
          month: {
            access: monthAccess
          },
          scans: {
            successful: successfulScans,
            failed: failedScans,
            total: successfulScans + failedScans
          }
        }
      }
    });

  } catch (error: any) {
    console.error('Get access stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
