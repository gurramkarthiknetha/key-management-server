const crypto = require('crypto');
const OTP = require('../models/OTP');

class OTPService {
  constructor() {
    this.otpLength = parseInt(process.env.OTP_LENGTH) || 6;
    this.expirationTime = parseInt(process.env.OTP_EXPIRES_IN) || 900000; // 15 minutes
  }

  /**
   * Generate a random OTP
   * @param {number} length - Length of the OTP
   * @returns {string} Generated OTP
   */
  generateOTP(length = this.otpLength) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  /**
   * Create and store OTP for a user
   * @param {string} email - User's email
   * @param {string} purpose - Purpose of OTP (login, registration, etc.)
   * @returns {Promise<Object>} OTP object
   */
  async createOTP(email, purpose = 'login') {
    try {
      // Generate new OTP
      const otpCode = this.generateOTP();
      
      // Create OTP record
      const otp = new OTP({
        email: email.toLowerCase(),
        otp: otpCode,
        purpose,
        expiresAt: new Date(Date.now() + this.expirationTime)
      });

      await otp.save();
      
      console.log(`🔑 OTP created for ${email}: ${otpCode} (Purpose: ${purpose})`);
      
      return {
        success: true,
        otp: otpCode,
        expiresAt: otp.expiresAt,
        purpose
      };
    } catch (error) {
      console.error('Error creating OTP:', error);
      throw new Error('Failed to create OTP');
    }
  }

  /**
   * Verify OTP for a user
   * @param {string} email - User's email
   * @param {string} otpCode - OTP to verify
   * @param {string} purpose - Purpose of OTP
   * @returns {Promise<Object>} Verification result
   */
  async verifyOTP(email, otpCode, purpose = 'login') {
    try {
      // Find valid OTP
      const otpRecord = await OTP.findValidOTP(email, otpCode, purpose);
      
      if (!otpRecord) {
        // Check if there's an OTP record to increment attempts
        const latestOTP = await OTP.findLatestOTP(email, purpose);
        if (latestOTP && !latestOTP.isUsed) {
          await latestOTP.incrementAttempts();
        }
        
        return {
          success: false,
          error: 'Invalid or expired OTP',
          code: 'INVALID_OTP'
        };
      }

      // Check if OTP is still valid
      if (!otpRecord.isValid()) {
        return {
          success: false,
          error: 'OTP has expired or exceeded maximum attempts',
          code: 'OTP_EXPIRED'
        };
      }

      // Mark OTP as used
      await otpRecord.markAsUsed();
      
      console.log(`✅ OTP verified successfully for ${email} (Purpose: ${purpose})`);
      
      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error('Failed to verify OTP');
    }
  }

  /**
   * Check if user can request new OTP (rate limiting)
   * @param {string} email - User's email
   * @param {string} purpose - Purpose of OTP
   * @returns {Promise<Object>} Rate limit check result
   */
  async canRequestOTP(email, purpose = 'login') {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Count OTPs created in the last 5 minutes
      const recentOTPs = await OTP.countDocuments({
        email: email.toLowerCase(),
        purpose,
        createdAt: { $gte: fiveMinutesAgo }
      });

      const maxOTPsPerPeriod = 3; // Maximum 3 OTPs per 5 minutes
      
      if (recentOTPs >= maxOTPsPerPeriod) {
        return {
          canRequest: false,
          error: 'Too many OTP requests. Please wait before requesting again.',
          waitTime: 5 * 60 * 1000 // 5 minutes in milliseconds
        };
      }

      return {
        canRequest: true
      };
    } catch (error) {
      console.error('Error checking OTP rate limit:', error);
      throw new Error('Failed to check OTP rate limit');
    }
  }

  /**
   * Invalidate all OTPs for a user
   * @param {string} email - User's email
   * @param {string} purpose - Purpose of OTP (optional)
   * @returns {Promise<Object>} Invalidation result
   */
  async invalidateOTPs(email, purpose = null) {
    try {
      const result = await OTP.invalidateAllOTPs(email, purpose);
      
      console.log(`🗑️ Invalidated ${result.modifiedCount} OTPs for ${email}${purpose ? ` (Purpose: ${purpose})` : ''}`);
      
      return {
        success: true,
        invalidatedCount: result.modifiedCount
      };
    } catch (error) {
      console.error('Error invalidating OTPs:', error);
      throw new Error('Failed to invalidate OTPs');
    }
  }

  /**
   * Clean up expired OTPs (maintenance function)
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupExpiredOTPs() {
    try {
      const result = await OTP.cleanupExpiredOTPs();
      
      console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);
      
      return {
        success: true,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      throw new Error('Failed to cleanup expired OTPs');
    }
  }

  /**
   * Get OTP statistics for monitoring
   * @returns {Promise<Object>} OTP statistics
   */
  async getOTPStats() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        totalActive,
        lastHour,
        lastDay,
        byPurpose
      ] = await Promise.all([
        OTP.countDocuments({ isUsed: false, expiresAt: { $gt: now } }),
        OTP.countDocuments({ createdAt: { $gte: oneHourAgo } }),
        OTP.countDocuments({ createdAt: { $gte: oneDayAgo } }),
        OTP.aggregate([
          { $match: { createdAt: { $gte: oneDayAgo } } },
          { $group: { _id: '$purpose', count: { $sum: 1 } } }
        ])
      ]);

      return {
        totalActive,
        lastHour,
        lastDay,
        byPurpose: byPurpose.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting OTP stats:', error);
      throw new Error('Failed to get OTP statistics');
    }
  }
}

module.exports = new OTPService();
