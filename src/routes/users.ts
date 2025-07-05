import express, { Response } from 'express';
import { User } from '../models';
import { hashPassword } from '../utils/auth';
import { authenticate, requireAdmin, requireHODOrAdmin, AuthenticatedRequest } from '../middleware/auth';
import { UserRole, ApiResponse } from '../types';
import connectDB from '../config/database';

const router = express.Router();

// GET /api/users - Get all users (Admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await connectDB();

    const { page = 1, limit = 10, search, role, department, isActive } = req.query;

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await connectDB();

    const { id } = req.params;
    const currentUser = req.user!;

    // Admin can view any user, others can only view themselves
    if (currentUser.role !== UserRole.SECURITY_INCHARGE && currentUser.userId !== id) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await connectDB();

    const { id } = req.params;
    const { name, email, employeeId, role, department, isActive, password } = req.body;

    // Find user
    const user = await User.findById(id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check for duplicate email or employeeId
    if (email || employeeId) {
      const duplicateQuery: any = { _id: { $ne: id } };
      const orConditions: any[] = [];
      
      if (email) orConditions.push({ email: email.toLowerCase() });
      if (employeeId) orConditions.push({ employeeId });
      
      if (orConditions.length > 0) {
        duplicateQuery.$or = orConditions;
        const existingUser = await User.findOne(duplicateQuery);
        
        if (existingUser) {
          res.status(409).json({
            success: false,
            error: 'User with this email or employee ID already exists'
          });
          return;
        }
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (employeeId) user.employeeId = employeeId;
    if (role) user.role = role;
    if (department) user.department = department;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    
    // Update password if provided
    if (password) {
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
        return;
      }
      user.password = await hashPassword(password);
    }

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(id).select('-password');

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await connectDB();

    const { id } = req.params;
    const currentUser = req.user!;

    // Prevent admin from deleting themselves
    if (currentUser.userId === id) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
      return;
    }

    const user = await User.findById(id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
