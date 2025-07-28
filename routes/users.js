const express = require('express');
const User = require('../models/User');
const { verifyToken, requireMinRole } = require('../middleware/auth');
const { 
  validateProfileUpdate, 
  validateRoleUpdate, 
  validatePagination,
  validateSearch,
  handleValidationErrors 
} = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (security_incharge only)
 * @access  Private (Security Incharge)
 */
router.get('/',
  verifyToken,
  requireMinRole('security_incharge'),
  validatePagination(),
  validateSearch(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const department = req.query.department || '';
    const isActive = req.query.isActive;

    // Build query
    const query = { deletedAt: null };

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

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id',
  verifyToken,
  asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // Users can only view their own profile unless they're admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      throw new AppError('Access denied', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user || user.deletedAt) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  })
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private
 */
router.put('/:id',
  verifyToken,
  validateProfileUpdate(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { name, department } = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      throw new AppError('Access denied', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    const user = await User.findById(userId);
    
    if (!user || user.deletedAt) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Update allowed fields
    if (name) user.name = name;
    if (department) user.department = department;

    await user.save();

    console.log(`👤 User profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          employeeId: user.employeeId,
          role: user.role,
          department: user.department,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          lastLogin: user.lastLogin
        }
      }
    });
  })
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (security_incharge only)
 * @access  Private (Security Incharge)
 */
router.put('/:id/role',
  verifyToken,
  requireMinRole('security_incharge'),
  validateRoleUpdate(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;

    const user = await User.findById(userId);
    
    if (!user || user.deletedAt) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Prevent admin from changing their own role
    if (req.user._id.toString() === userId) {
      throw new AppError('Cannot change your own role', 400, 'CANNOT_CHANGE_OWN_ROLE');
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    console.log(`🔄 User role updated: ${user.email} (${oldRole} → ${role})`);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          oldRole
        }
      }
    });
  })
);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Activate/deactivate user (security_incharge only)
 * @access  Private (Security Incharge)
 */
router.put('/:id/status',
  verifyToken,
  requireMinRole('security_incharge'),
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean value', 400, 'INVALID_STATUS');
    }

    const user = await User.findById(userId);
    
    if (!user || user.deletedAt) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Prevent admin from deactivating themselves
    if (req.user._id.toString() === userId && !isActive) {
      throw new AppError('Cannot deactivate your own account', 400, 'CANNOT_DEACTIVATE_SELF');
    }

    user.isActive = isActive;
    await user.save();

    console.log(`${isActive ? '✅' : '❌'} User ${isActive ? 'activated' : 'deactivated'}: ${user.email}`);

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isActive: user.isActive
        }
      }
    });
  })
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete user (security_incharge only)
 * @access  Private (Security Incharge)
 */
router.delete('/:id',
  verifyToken,
  requireMinRole('security_incharge'),
  asyncHandler(async (req, res) => {
    const userId = req.params.id;

    const user = await User.findById(userId);
    
    if (!user || user.deletedAt) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === userId) {
      throw new AppError('Cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
    }

    // Soft delete
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    user.isActive = false;
    await user.save();

    console.log(`🗑️ User deleted: ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

/**
 * @route   GET /api/users/roles/summary
 * @desc    Get user roles summary
 * @access  Private (Min: Security)
 */
router.get('/roles/summary',
  verifyToken,
  requireMinRole('security'),
  asyncHandler(async (req, res) => {
    const summary = await User.aggregate([
      {
        $match: { deletedAt: null }
      },
      {
        $group: {
          _id: '$role',
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary
      }
    });
  })
);

module.exports = router;
