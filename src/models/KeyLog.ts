import mongoose, { Schema, Document } from 'mongoose';
import { KeyLog as IKeyLog, LogAction } from '../types';

export interface KeyLogDocument extends Document {
  keyId: string;
  userId: string;
  action: LogAction;
  timestamp: Date;
  notes?: string;
  createdBy: string;
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
  };
  geoLocation?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  duration?: number;
  returnCondition?: string;
  images?: string[];
  formattedTimestamp: string;
  durationDisplay: string;
}

const KeyLogSchema = new Schema<KeyLogDocument>({
  keyId: {
    type: String,
    required: [true, 'Key ID is required']
  },
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  action: {
    type: String,
    enum: Object.values(LogAction),
    required: [true, 'Action is required']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isOffline: {
    type: Boolean,
    default: false
  },
  syncedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: String,
    required: [true, 'Created by is required']
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    deviceType: String
  },
  geoLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  duration: {
    type: Number, // in minutes, for check-in actions
    default: null
  },
  returnCondition: {
    type: String,
    enum: ['good', 'damaged', 'lost'],
    default: null
  },
  images: [{
    type: String // URLs to uploaded images
  }]
}, {
  timestamps: true
});

// Indexes for better performance
KeyLogSchema.index({ keyId: 1 });
KeyLogSchema.index({ userId: 1 });
KeyLogSchema.index({ action: 1 });
KeyLogSchema.index({ timestamp: -1 });
KeyLogSchema.index({ isOffline: 1 });
KeyLogSchema.index({ createdBy: 1 });

// Compound indexes for common queries
KeyLogSchema.index({ keyId: 1, timestamp: -1 });
KeyLogSchema.index({ userId: 1, timestamp: -1 });
KeyLogSchema.index({ action: 1, timestamp: -1 });
KeyLogSchema.index({ timestamp: -1, isOffline: 1 });

// Virtual to populate key details
KeyLogSchema.virtual('key', {
  ref: 'Key',
  localField: 'keyId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate user details
KeyLogSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate creator details
KeyLogSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Virtual to format timestamp
KeyLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Virtual to calculate duration for check-in logs
KeyLogSchema.virtual('calculatedDuration').get(function() {
  if (this.action === LogAction.CHECK_IN && this.duration) {
    const hours = Math.floor(this.duration / 60);
    const minutes = this.duration % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
  return null;
});

// Static method to get logs for a specific key
KeyLogSchema.statics.getKeyHistory = function(keyId: string, limit: number = 50) {
  return this.find({ keyId })
    .populate('user', 'name employeeId')
    .populate('createdBy', 'name employeeId')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get logs for a specific user
KeyLogSchema.statics.getUserHistory = function(userId: string, limit: number = 50) {
  return this.find({ userId })
    .populate('key', 'name keyId location')
    .populate('createdBy', 'name employeeId')
    .sort({ timestamp: -1 })
    .limit(limit);
};

export default mongoose.models.KeyLog || mongoose.model<KeyLogDocument>('KeyLog', KeyLogSchema);
