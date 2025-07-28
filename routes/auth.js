const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const RoleService = require('../services/roleService');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { 
  validateEmail, 
  validateOTP, 
  validateUniqueRegistration, 
  validateLogin,
  validateOTPRequest,
  validatePasswordReset,
  handleValidationErrors 
} = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { securityLogger } = require('../middleware/logger');

const router = express.Router();

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // Higher limit for development
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 3, // Higher limit for development
  message: {
    success: false,
    error: 'Too many OTP requests, please try again later.',
    code: 'OTP_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply security logging to all auth routes
router.use(securityLogger);

// Development-only endpoint to clear rate limits
if (process.env.NODE_ENV === 'development') {
  router.post('/clear-rate-limit', (req, res) => {
    // Clear the rate limit store (this is a simple reset)
    authLimiter.resetKey && authLimiter.resetKey(req.ip);
    otpLimiter.resetKey && otpLimiter.resetKey(req.ip);

    res.json({
      success: true,
      message: 'Rate limits cleared for development',
      ip: req.ip
    });
  });
}

/**
 * Generate JWT token
 */
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { 
      userId, 
      email, 
      role,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Set authentication cookie
 */
const setAuthCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie('authToken', token, cookieOptions);
};

/**
 * Clear authentication cookie
 */
const clearAuthCookie = (res) => {
  res.clearCookie('authToken');
};

/**
 * @route   POST /api/auth/simple-auth
 * @desc    Simplified authentication - auto-register and send OTP with just email
 * @access  Public
 */
router.post('/simple-auth',
  authLimiter,
  validateEmail(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Validate email domain
    if (!RoleService.isValidEmail(email)) {
      throw new AppError('Only VNR VJIET email addresses are allowed', 400, 'INVALID_EMAIL_DOMAIN');
    }

    // Check if user exists, if not create automatically
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Auto-create user profile from email
      const userProfile = RoleService.createUserProfileFromEmail(email);

      user = new User(userProfile);
      await user.save();

      console.log('✅ User auto-created:', email, `(${user.role})`);
    }

    // Generate OTP for login
    const otpResult = await otpService.createOTP(email, 'login');

    if (otpResult.success) {
      // Send login OTP email
      await emailService.sendOTPEmail(email, otpResult.otp, 'login', user.name);
    }

    res.json({
      success: true,
      message: 'Login code sent to your email. Please check your inbox.',
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        roleDisplayName: RoleService.getRoleDisplayName(user.role)
      }
    });
  })
);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  validateUniqueRegistration(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, name, employeeId, role, department } = req.body;

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      name,
      employeeId,
      role,
      department,
      isEmailVerified: false
    });

    await user.save();

    // Generate OTP for email verification
    const otpResult = await otpService.createOTP(email, 'email_verification');
    
    if (otpResult.success) {
      // Send verification email
      await emailService.sendOTPEmail(email, otpResult.otp, 'email_verification', name);
    }

    console.log(`✅ User registered: ${email} (${role})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification code.',
      data: {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isEmailVerified: user.isEmailVerified
      }
    });
  })
);

/**
 * @route   POST /api/auth/request-otp
 * @desc    Request OTP for login or other purposes
 * @access  Public
 */
router.post('/request-otp',
  otpLimiter,
  validateOTPRequest(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, purpose = 'login' } = req.body;

    // Check if user exists (except for registration)
    if (purpose !== 'registration') {
      const user = await User.findByEmail(email);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (!user.isActive) {
        throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new AppError('Account is temporarily locked due to too many failed attempts', 423, 'ACCOUNT_LOCKED');
      }
    }

    // Check rate limiting
    const rateLimitCheck = await otpService.canRequestOTP(email, purpose);
    if (!rateLimitCheck.canRequest) {
      throw new AppError(rateLimitCheck.error, 429, 'OTP_RATE_LIMIT');
    }

    // Generate OTP
    const otpResult = await otpService.createOTP(email, purpose);
    
    if (!otpResult.success) {
      throw new AppError('Failed to generate OTP', 500, 'OTP_GENERATION_FAILED');
    }

    // Send OTP email
    const user = await User.findByEmail(email);
    const emailSent = await emailService.sendOTPEmail(
      email, 
      otpResult.otp, 
      purpose, 
      user?.name
    );

    if (!emailSent) {
      console.warn(`⚠️ Failed to send OTP email to ${email}`);
    }

    console.log(`📧 OTP requested for ${email} (Purpose: ${purpose})`);

    res.json({
      success: true,
      message: 'OTP sent to your email address',
      data: {
        email,
        purpose,
        expiresAt: otpResult.expiresAt,
        emailSent
      }
    });
  })
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP for email verification
 * @access  Public
 */
router.post('/verify-otp',
  authLimiter,
  validateEmail(),
  validateOTP(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, otp, purpose = 'email_verification' } = req.body;

    // Verify OTP
    const otpResult = await otpService.verifyOTP(email, otp, purpose);

    if (!otpResult.success) {
      throw new AppError(otpResult.error, 400, otpResult.code);
    }

    // Find user and update verification status
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (purpose === 'email_verification') {
      user.isEmailVerified = true;
      await user.save();
    }

    console.log(`✅ OTP verified for ${email} (Purpose: ${purpose})`);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        purpose
      }
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with OTP
 * @access  Public
 */
router.post('/login',
  authLimiter,
  validateLogin(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new AppError('Account is temporarily locked due to too many failed attempts', 423, 'ACCOUNT_LOCKED');
    }

    // Verify OTP
    const otpResult = await otpService.verifyOTP(email, otp, 'login');

    if (!otpResult.success) {
      // Increment login attempts on failed OTP
      await user.incLoginAttempts();
      throw new AppError(otpResult.error, 401, otpResult.code);
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    await user.updateLastLogin();

    // Generate JWT token
    const token = generateToken(user._id, user.email, user.role);

    // Set authentication cookie
    setAuthCookie(res, token);

    // Store token in session as well
    req.session.authToken = token;
    req.session.userId = user._id.toString();

    console.log(`🔐 User logged in: ${email} (${user.role})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          employeeId: user.employeeId,
          role: user.role,
          department: user.department,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  verifyToken,
  asyncHandler(async (req, res) => {
    // Clear authentication cookie
    clearAuthCookie(res);

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });

    console.log(`🚪 User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me',
  verifyToken,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  })
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh authentication token
 * @access  Private
 */
router.post('/refresh',
  verifyToken,
  asyncHandler(async (req, res) => {
    // Generate new token
    const token = generateToken(req.user._id, req.user.email, req.user.role);

    // Set new authentication cookie
    setAuthCookie(res, token);

    // Update session
    req.session.authToken = token;

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });
  })
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post('/reset-password',
  authLimiter,
  validatePasswordReset(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify OTP
    const otpResult = await otpService.verifyOTP(email, otp, 'password_reset');

    if (!otpResult.success) {
      throw new AppError(otpResult.error, 400, otpResult.code);
    }

    // Update password
    user.password = password;
    user.passwordResetRequired = false;
    await user.save();

    console.log(`🔑 Password reset for: ${email}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  })
);

/**
 * @route   GET /api/auth/validate-session
 * @desc    Validate current session
 * @access  Public
 */
router.get('/validate-session',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.json({
        success: false,
        message: 'No valid session found',
        isAuthenticated: false
      });
    }

    res.json({
      success: true,
      message: 'Session is valid',
      isAuthenticated: true,
      data: {
        user: req.user
      }
    });
  })
);

/**
 * @route   GET /api/auth/stats
 * @desc    Get authentication statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats',
  verifyToken,
  asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied. Admin role required.', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    // Get OTP statistics
    const otpStats = await otpService.getOTPStats();

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
        }
      }
    ]);

    // Get recent login statistics
    const recentLogins = await User.aggregate([
      {
        $match: {
          lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        otp: otpStats,
        users: userStats,
        recentLogins: recentLogins
      }
    });
  })
);

module.exports = router;
