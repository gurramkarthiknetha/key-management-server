const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
  keyId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 50
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    enum: [
      'laboratory',
      'classroom',
      'conference_room',
      'auditorium',
      'office',
      'storage',
      'vehicle',
      'equipment',
      'security',
      'other'
    ],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxAllowedTime: {
    type: Number, // in minutes
    default: 480, // 8 hours default
    min: 30,
    max: 1440 // 24 hours max
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  allowedRoles: [{
    type: String,
    enum: ['faculty', 'hod', 'security', 'security_incharge', 'admin']
  }],
  qrCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  specifications: {
    capacity: {
      type: Number,
      min: 1
    },
    equipment: [{
      type: String,
      trim: true
    }],
    software: [{
      type: String,
      trim: true
    }],
    notes: {
      type: String,
      maxlength: 1000
    }
  },
  currentStatus: {
    type: String,
    enum: ['available', 'assigned', 'maintenance', 'lost', 'damaged'],
    default: 'available'
  },
  currentAssignment: {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedAt: {
      type: Date,
      default: null
    },
    expectedReturnAt: {
      type: Date,
      default: null
    },
    purpose: {
      type: String,
      maxlength: 200
    }
  },
  maintenanceInfo: {
    lastMaintenance: {
      type: Date
    },
    nextMaintenance: {
      type: Date
    },
    maintenanceNotes: {
      type: String,
      maxlength: 500
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
keySchema.index({ keyId: 1 });
keySchema.index({ department: 1 });
keySchema.index({ category: 1 });
keySchema.index({ isActive: 1 });
keySchema.index({ currentStatus: 1 });
keySchema.index({ qrCode: 1 });
keySchema.index({ 'currentAssignment.assignedTo': 1 });
keySchema.index({ createdAt: -1 });

// Virtual for checking if key is currently assigned
keySchema.virtual('isAssigned').get(function() {
  return this.currentStatus === 'assigned' && this.currentAssignment.assignedTo;
});

// Virtual for checking if key is overdue
keySchema.virtual('isOverdue').get(function() {
  if (!this.isAssigned || !this.currentAssignment.expectedReturnAt) {
    return false;
  }
  return new Date() > this.currentAssignment.expectedReturnAt;
});

// Virtual for time remaining (in minutes)
keySchema.virtual('timeRemaining').get(function() {
  if (!this.isAssigned || !this.currentAssignment.expectedReturnAt) {
    return null;
  }
  const now = new Date();
  const expectedReturn = this.currentAssignment.expectedReturnAt;
  const diffMs = expectedReturn.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60))); // Convert to minutes
});

// Instance methods
keySchema.methods.assignTo = function(userId, purpose, durationMinutes) {
  if (this.currentStatus !== 'available') {
    throw new Error('Key is not available for assignment');
  }
  
  const now = new Date();
  const duration = Math.min(durationMinutes || this.maxAllowedTime, this.maxAllowedTime);
  
  this.currentStatus = 'assigned';
  this.currentAssignment = {
    assignedTo: userId,
    assignedAt: now,
    expectedReturnAt: new Date(now.getTime() + duration * 60 * 1000),
    purpose: purpose || 'General use'
  };
  
  return this.save();
};

keySchema.methods.returnKey = function() {
  if (this.currentStatus !== 'assigned') {
    throw new Error('Key is not currently assigned');
  }
  
  this.currentStatus = 'available';
  this.currentAssignment = {
    assignedTo: null,
    assignedAt: null,
    expectedReturnAt: null,
    purpose: null
  };
  
  return this.save();
};

keySchema.methods.markAsMaintenance = function(notes) {
  this.currentStatus = 'maintenance';
  this.maintenanceInfo.lastMaintenance = new Date();
  if (notes) {
    this.maintenanceInfo.maintenanceNotes = notes;
  }
  
  // If key was assigned, clear assignment
  if (this.currentAssignment.assignedTo) {
    this.currentAssignment = {
      assignedTo: null,
      assignedAt: null,
      expectedReturnAt: null,
      purpose: null
    };
  }
  
  return this.save();
};

keySchema.methods.markAsAvailable = function() {
  if (this.currentStatus === 'assigned') {
    throw new Error('Cannot mark assigned key as available. Return the key first.');
  }
  
  this.currentStatus = 'available';
  return this.save();
};

keySchema.methods.canBeAccessedBy = function(userRole) {
  if (!this.allowedRoles || this.allowedRoles.length === 0) {
    return true; // No restrictions
  }
  
  return this.allowedRoles.includes(userRole);
};

// Static methods
keySchema.statics.findByDepartment = function(department) {
  return this.find({ 
    department, 
    isActive: true, 
    deletedAt: null 
  });
};

keySchema.statics.findByCategory = function(category) {
  return this.find({ 
    category, 
    isActive: true, 
    deletedAt: null 
  });
};

keySchema.statics.findAvailable = function() {
  return this.find({ 
    currentStatus: 'available', 
    isActive: true, 
    deletedAt: null 
  });
};

keySchema.statics.findAssignedTo = function(userId) {
  return this.find({ 
    'currentAssignment.assignedTo': userId,
    currentStatus: 'assigned',
    deletedAt: null 
  });
};

keySchema.statics.findOverdue = function() {
  const now = new Date();
  return this.find({
    currentStatus: 'assigned',
    'currentAssignment.expectedReturnAt': { $lt: now },
    deletedAt: null
  });
};

keySchema.statics.findByQRCode = function(qrCode) {
  return this.findOne({ 
    qrCode, 
    isActive: true, 
    deletedAt: null 
  });
};

keySchema.statics.getStatsByDepartment = function() {
  return this.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: '$department',
        total: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ['$currentStatus', 'available'] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ['$currentStatus', 'assigned'] }, 1, 0] } },
        maintenance: { $sum: { $cond: [{ $eq: ['$currentStatus', 'maintenance'] }, 1, 0] } },
        active: { $sum: { $cond: ['$isActive', 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

keySchema.statics.getStatsByCategory = function() {
  return this.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ['$currentStatus', 'available'] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ['$currentStatus', 'assigned'] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Pre-save middleware
keySchema.pre('save', function(next) {
  // Generate QR code if not provided
  if (!this.qrCode && this.keyId) {
    this.qrCode = `${this.keyId}-QR`;
  }
  
  // Validate assignment logic
  if (this.currentStatus === 'assigned' && !this.currentAssignment.assignedTo) {
    return next(new Error('Assigned key must have assignedTo user'));
  }
  
  if (this.currentStatus !== 'assigned' && this.currentAssignment.assignedTo) {
    // Clear assignment if status is not assigned
    this.currentAssignment = {
      assignedTo: null,
      assignedAt: null,
      expectedReturnAt: null,
      purpose: null
    };
  }
  
  next();
});

// Transform output to remove sensitive data
keySchema.methods.toJSON = function() {
  const key = this.toObject();
  delete key.__v;
  return key;
};

const Key = mongoose.model('Key', keySchema);

module.exports = Key;
