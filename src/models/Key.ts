import mongoose, { Document, Schema, Model } from 'mongoose';

// Key interface
export interface IKey extends Document {
  keyId: string;
  keyName: string;
  labName: string;
  department: string;
  location: string;
  description?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'lost';
  assignedTo?: string; // User ID
  assignedDate?: Date;
  dueDate?: Date;
  assignmentType: 'permanent' | 'temporary';
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Key model interface with static methods
export interface IKeyModel extends Model<IKey> {
  findByUser(userId: string): Promise<IKey[]>;
  findAvailable(): Promise<IKey[]>;
  findOverdue(): Promise<IKey[]>;
}

// Key schema
const keySchema = new Schema<IKey>({
  keyId: {
    type: String,
    required: [true, 'Key ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9-]+$/, 'Key ID must contain only uppercase letters, numbers, and hyphens']
  },
  keyName: {
    type: String,
    required: [true, 'Key name is required'],
    trim: true,
    maxlength: [100, 'Key name cannot exceed 100 characters']
  },
  labName: {
    type: String,
    required: [true, 'Lab name is required'],
    trim: true,
    maxlength: [100, 'Lab name cannot exceed 100 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    maxlength: [50, 'Department cannot exceed 50 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['available', 'assigned', 'maintenance', 'lost'],
      message: 'Invalid status specified'
    },
    default: 'available'
  },
  assignedTo: {
    type: String,
    ref: 'User',
    default: null
  },
  assignedDate: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  },
  assignmentType: {
    type: String,
    enum: {
      values: ['permanent', 'temporary'],
      message: 'Invalid assignment type specified'
    },
    default: 'temporary'
  },
  qrCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      return ret;
    }
  }
});

// Indexes for faster queries
keySchema.index({ keyId: 1 });
keySchema.index({ status: 1 });
keySchema.index({ assignedTo: 1 });
keySchema.index({ department: 1 });
keySchema.index({ dueDate: 1 });

// Virtual for checking if key is overdue
keySchema.virtual('isOverdue').get(function() {
  if (this.status === 'assigned' && this.dueDate && this.assignmentType === 'temporary') {
    return new Date() > this.dueDate;
  }
  return false;
});

// Static method to find keys by user
keySchema.statics.findByUser = function(userId: string) {
  return this.find({ assignedTo: userId, status: 'assigned' });
};

// Static method to find available keys
keySchema.statics.findAvailable = function() {
  return this.find({ status: 'available' });
};

// Static method to find overdue keys
keySchema.statics.findOverdue = function() {
  const now = new Date();
  return this.find({
    status: 'assigned',
    assignmentType: 'temporary',
    dueDate: { $lt: now }
  });
};

// Pre-save middleware to generate QR code data
keySchema.pre('save', function(next) {
  if (!this.qrCode) {
    // Generate QR code data as JSON string
    this.qrCode = JSON.stringify({
      keyId: this.keyId,
      keyName: this.keyName,
      department: this.department,
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Create and export the model
const Key = mongoose.model<IKey, IKeyModel>('Key', keySchema);

export default Key;
