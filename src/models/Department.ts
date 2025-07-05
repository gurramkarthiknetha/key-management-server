import mongoose, { Schema, Document } from 'mongoose';
import { Department as IDepartment } from '../types';

export interface DepartmentDocument extends Document {
  name: string;
  code: string;
  description?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  hodId: string;
  isActive: boolean;
}

const DepartmentSchema = new Schema<DepartmentDocument>({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Department code cannot exceed 10 characters']
  },
  hodId: {
    type: String,
    required: [true, 'HOD is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  contactEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactPhone: {
    type: String,
    trim: true,
    maxlength: [15, 'Phone number cannot exceed 15 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
DepartmentSchema.index({ code: 1 });
DepartmentSchema.index({ hodId: 1 });
DepartmentSchema.index({ isActive: 1 });

// Virtual to populate HOD details
DepartmentSchema.virtual('hod', {
  ref: 'User',
  localField: 'hodId',
  foreignField: '_id',
  justOne: true
});

// Virtual to get department keys count
DepartmentSchema.virtual('keysCount', {
  ref: 'Key',
  localField: '_id',
  foreignField: 'department',
  count: true
});

// Virtual to get department users count
DepartmentSchema.virtual('usersCount', {
  ref: 'User',
  localField: 'name',
  foreignField: 'department',
  count: true
});

export default mongoose.models.Department || mongoose.model<DepartmentDocument>('Department', DepartmentSchema);
