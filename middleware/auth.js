const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.authToken ||
                  req.session?.authToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database to ensure they still exist and are active
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token. User not found.',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const isDevelopment = process.env.NODE_ENV === 'development';

    // In development mode, allow role switching for demo purposes
    if (isDevelopment) {
      console.log(`🔓 Backend Auth: Development mode - allowing ${userRole} to access ${allowedRoles.join(', ')} endpoints`);
      next();
      return;
    }

    // Production mode: strict role checking
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has security role or higher
 */
const requireSecurity = requireRole(['security', 'security_incharge']);

/**
 * Middleware to check if user has HOD role or higher
 */
const requireHOD = requireRole(['hod']);

/**
 * Middleware for optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.authToken ||
                  req.session?.authToken;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
          req.token = token;
        }
      } catch (jwtError) {
        // Ignore JWT errors for optional auth
        console.log('Optional auth JWT error (ignored):', jwtError.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Role hierarchy for permission checking
 */
const roleHierarchy = {
  'security_incharge': 4,
  'hod': 3,
  'security': 2,
  'faculty': 1
};

/**
 * Check if user has sufficient role level
 */
const hasRoleLevel = (userRole, requiredRole) => {
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Middleware to check minimum role level
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const isDevelopment = process.env.NODE_ENV === 'development';

    // In development mode, allow role switching for demo purposes
    if (isDevelopment) {
      console.log(`🔓 Backend Auth: Development mode - allowing ${req.user.role} to access ${minRole}+ endpoints`);
      next();
      return;
    }

    // Production mode: strict role level checking
    if (!hasRoleLevel(req.user.role, minRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Minimum required role: ${minRole}. Your role: ${req.user.role}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requireSecurity,
  requireHOD,
  requireMinRole,
  optionalAuth,
  hasRoleLevel
};
