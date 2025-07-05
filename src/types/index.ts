import { Request } from 'express';

export interface User {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SECURITY_STAFF = 'security_staff',
  FACULTY_LAB_STAFF = 'faculty_lab_staff',
  HOD = 'hod',
  SECURITY_INCHARGE = 'security_incharge'
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  hodId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Key {
  _id: string;
  keyId: string;
  name: string;
  description?: string;
  department: string;
  location: string;
  qrCode: string;
  status: KeyStatus;
  currentHolder?: string;
  issuedAt?: Date;
  dueDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  maxLoanDuration?: number;
  category?: string;
  priority?: string;
  tags?: string[];
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
}

export enum KeyStatus {
  AVAILABLE = 'available',
  ISSUED = 'issued',
  OVERDUE = 'overdue',
  MAINTENANCE = 'maintenance'
}

export interface KeyLog {
  _id: string;
  keyId: string;
  userId: string;
  action: LogAction;
  timestamp: Date;
  location?: string;
  notes?: string;
  isOffline: boolean;
  syncedAt?: Date;
  createdBy: string;
}

export enum LogAction {
  CHECK_OUT = 'check_out',
  CHECK_IN = 'check_in',
  OVERDUE_ALERT = 'overdue_alert',
  FORCE_RETURN = 'force_return'
}

export interface Notification {
  _id: string;
  type: NotificationType;
  recipient: string;
  subject: string;
  message: string;
  data?: any;
  status: NotificationStatus;
  sentAt?: Date;
  createdAt: Date;
}

export enum NotificationType {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SYSTEM = 'system'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed'
}

export interface OfflineTransaction {
  id: string;
  type: 'check_out' | 'check_in';
  keyId: string;
  userId: string;
  timestamp: Date;
  location?: string;
  notes?: string;
  synced: boolean;
}

export interface DashboardStats {
  totalKeys: number;
  availableKeys: number;
  issuedKeys: number;
  overdueKeys: number;
  totalUsers: number;
  activeUsers: number;
  todayTransactions: number;
}

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  department?: string;
  userId?: string;
  keyId?: string;
  action?: LogAction;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId: string;
  department: string;
  isActive: boolean;
  lastLogin?: Date;
  qrCode?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  department: string;
  iat: number;
  exp: number;
}

// Express Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    department: string;
  };
}

// Registration request interface
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  role: UserRole;
  department: string;
}
