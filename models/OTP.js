const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  purpose: {
    type: String,
    required: true,
    enum: ['login', 'registration', 'password_reset', 'email_verification'],
    default: 'login'
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      const expirationTime = parseInt(process.env.OTP_EXPIRES_IN) || 300000; // 5 minutes default
      return new Date(Date.now() + expirationTime);
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance and automatic cleanup
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup
otpSchema.index({ createdAt: -1 });

// Instance methods
otpSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

otpSchema.methods.isValid = function() {
  return !this.isUsed && !this.isExpired() && this.attempts < 5;
};

otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

otpSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

// Static methods
otpSchema.statics.findValidOTP = function(email, otp, purpose = 'login') {
  return this.findOne({
    email: email.toLowerCase(),
    otp,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 5 }
  });
};

otpSchema.statics.findLatestOTP = function(email, purpose = 'login') {
  return this.findOne({
    email: email.toLowerCase(),
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

otpSchema.statics.invalidateAllOTPs = function(email, purpose = null) {
  const query = { email: email.toLowerCase() };
  if (purpose) {
    query.purpose = purpose;
  }
  
  return this.updateMany(query, { 
    $set: { isUsed: true } 
  });
};

otpSchema.statics.cleanupExpiredOTPs = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true }
    ]
  });
};

// Pre-save middleware to ensure only one active OTP per email/purpose
otpSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Invalidate any existing OTPs for this email and purpose
    await this.constructor.updateMany(
      { 
        email: this.email, 
        purpose: this.purpose,
        isUsed: false 
      },
      { $set: { isUsed: true } }
    );
  }
  next();
});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
