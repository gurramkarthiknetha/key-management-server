import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable');
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const hasPermission = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole);
};

export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === UserRole.SECURITY_INCHARGE;
};

export const isHOD = (userRole: UserRole): boolean => {
  return userRole === UserRole.HOD;
};

export const canManageKeys = (userRole: UserRole): boolean => {
  return [UserRole.SECURITY_INCHARGE, UserRole.HOD].includes(userRole);
};

export const canAccessDepartmentData = (userRole: UserRole, userDepartment: string, targetDepartment: string): boolean => {
  // Admin can access all departments
  if (userRole === UserRole.SECURITY_INCHARGE) {
    return true;
  }
  
  // HOD can only access their own department
  if (userRole === UserRole.HOD) {
    return userDepartment === targetDepartment;
  }
  
  // Other roles can only access their own department
  return userDepartment === targetDepartment;
};
