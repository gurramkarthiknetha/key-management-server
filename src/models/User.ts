import mongoose, { Schema, Document } from 'mongoose';
import { User as IUser, UserRole } from '../types';

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  qrCode: string;
  lastLogin?: Date;
  profileImage?: string;
  displayName: string;
}

const UserSchema = new Schema<UserDocument>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    maxlength: [20, 'Employee ID cannot exceed 20 characters']
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: [true, 'Role is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  qrCode: {
    type: String,
    required: true
  },
  lastLogin: {
    type: Date
  },
  profileImage: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ employeeId: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ role: 1 });

// Virtual for full name display
UserSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.employeeId})`;
});

export default mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
