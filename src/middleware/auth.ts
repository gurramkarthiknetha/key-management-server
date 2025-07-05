import { Request, Response, NextFunction } from 'express';
import { verifyToken, hasPermission } from '../utils/auth';
import { UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    department: string;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      department: decoded.department
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
    return;
  }
};

export const requireRoles = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !hasPermission(req.user.role, roles)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }
    next();
  };
};

export const requireAdmin = requireRoles([UserRole.SECURITY_INCHARGE]);

export const requireHODOrAdmin = requireRoles([UserRole.HOD, UserRole.SECURITY_INCHARGE]);

export const requireStaffAccess = requireRoles([
  UserRole.SECURITY_STAFF,
  UserRole.FACULTY_LAB_STAFF,
  UserRole.HOD,
  UserRole.SECURITY_INCHARGE
]);

export const requireSecurityStaffOrAbove = requireRoles([
  UserRole.SECURITY_STAFF,
  UserRole.SECURITY_INCHARGE
]);

export const requireHODOrAbove = requireRoles([
  UserRole.HOD,
  UserRole.SECURITY_INCHARGE
]);
