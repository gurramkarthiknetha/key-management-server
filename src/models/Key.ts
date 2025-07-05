import mongoose, { Schema, Document } from 'mongoose';
import { Key as IKey, KeyStatus } from '../types';

export interface KeyDocument extends Document {
  keyId: string;
  name: string;
  description?: string;
  department: string;
  location: string;
  qrCode: string;
  status: string;
  currentHolder?: string;
  issuedAt?: Date;
  dueDate?: Date;
  returnedAt?: Date;
  maxLoanDuration?: number;
  category?: string;
  priority?: string;
  tags?: string[];
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  isActive: boolean;
}

const KeySchema = new Schema<KeyDocument>({
  keyId: {
    type: String,
    required: [true, 'Key ID is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Key ID cannot exceed 50 characters']
  },
  name: {
    type: String,
    required: [true, 'Key name is required'],
    trim: true,
    maxlength: [100, 'Key name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  qrCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(KeyStatus),
    default: KeyStatus.AVAILABLE
  },
  currentHolder: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  issuedAt: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  },
  maxLoanDuration: {
    type: Number, // in hours
    default: 24
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
KeySchema.index({ keyId: 1 });
KeySchema.index({ department: 1 });
KeySchema.index({ status: 1 });
KeySchema.index({ currentHolder: 1 });
KeySchema.index({ dueDate: 1 });
KeySchema.index({ isActive: 1 });

// Compound indexes
KeySchema.index({ department: 1, status: 1 });
KeySchema.index({ status: 1, dueDate: 1 });

// Virtual to populate current holder details
KeySchema.virtual('holder', {
  ref: 'User',
  localField: 'currentHolder',
  foreignField: '_id',
  justOne: true
});

// Virtual to check if key is overdue
KeySchema.virtual('isOverdue').get(function() {
  if (this.status === KeyStatus.ISSUED && this.dueDate) {
    return new Date() > this.dueDate;
  }
  return false;
});

// Virtual to get days until due
KeySchema.virtual('daysUntilDue').get(function() {
  if (this.dueDate) {
    const now = new Date();
    const diffTime = this.dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
});

// Pre-save middleware to update status based on due date
KeySchema.pre('save', function(next) {
  if (this.status === KeyStatus.ISSUED && this.dueDate && new Date() > this.dueDate) {
    this.status = KeyStatus.OVERDUE;
  }
  next();
});

export default mongoose.models.Key || mongoose.model<KeyDocument>('Key', KeySchema);
