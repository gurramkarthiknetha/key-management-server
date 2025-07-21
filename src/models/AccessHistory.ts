import mongoose, { Document, Schema, Model } from 'mongoose';

// Access History interface
export interface IAccessHistory extends Document {
  keyId: string;
  userId: string;
  action: 'assigned' | 'returned' | 'scanned' | 'access_granted' | 'access_denied';
  timestamp: Date;
  location?: string;
  notes?: string;
  securityPersonnelId?: string;
  scanData?: {
    qrData: string;
    deviceInfo?: string;
    ipAddress?: string;
  };
  status: 'success' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// Access History model interface with static methods
export interface IAccessHistoryModel extends Model<IAccessHistory> {
  findByUser(userId: string, limit?: number): Promise<IAccessHistory[]>;
  findByKey(keyId: string, limit?: number): Promise<IAccessHistory[]>;
  findRecentActivity(limit?: number): Promise<IAccessHistory[]>;
  findFailedAttempts(timeRange: Date, limit?: number): Promise<IAccessHistory[]>;
}

// Access History schema
const accessHistorySchema = new Schema<IAccessHistory>({
  keyId: {
    type: String,
    required: [true, 'Key ID is required'],
    index: true
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User',
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: {
      values: ['assigned', 'returned', 'scanned', 'access_granted', 'access_denied'],
      message: 'Invalid action specified'
    },
    index: true
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now,
    index: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  securityPersonnelId: {
    type: String,
    ref: 'User',
    default: null
  },
  scanData: {
    qrData: {
      type: String,
      default: null
    },
    deviceInfo: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['success', 'failed'],
      message: 'Invalid status specified'
    },
    default: 'success',
    index: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      return ret;
    }
  }
});

// Compound indexes for efficient queries
accessHistorySchema.index({ keyId: 1, timestamp: -1 });
accessHistorySchema.index({ userId: 1, timestamp: -1 });
accessHistorySchema.index({ action: 1, timestamp: -1 });
accessHistorySchema.index({ status: 1, timestamp: -1 });

// Static method to find history by user
accessHistorySchema.statics.findByUser = function(userId: string, limit: number = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('keyId', 'keyId keyName labName department location');
};

// Static method to find history by key
accessHistorySchema.statics.findByKey = function(keyId: string, limit: number = 50) {
  return this.find({ keyId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'userId role')
    .populate('securityPersonnelId', 'userId role');
};

// Static method to find recent activity
accessHistorySchema.statics.findRecentActivity = function(limit: number = 100) {
  return this.find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('keyId', 'keyId keyName labName department')
    .populate('userId', 'userId role');
};

// Static method to find failed access attempts
accessHistorySchema.statics.findFailedAttempts = function(timeRange: Date, limit: number = 50) {
  return this.find({
    status: 'failed',
    timestamp: { $gte: timeRange }
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('keyId', 'keyId keyName labName department')
    .populate('userId', 'userId role');
};

// Create and export the model
const AccessHistory = mongoose.model<IAccessHistory, IAccessHistoryModel>('AccessHistory', accessHistorySchema);

export default AccessHistory;
