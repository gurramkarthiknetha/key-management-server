import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User interface
export interface IUser extends Document {
  userId: string;
  password: string;
  role: 'faculty_lab_staff' | 'security_staff' | 'hod' | 'security_incharge' | 'faculty';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const userSchema = new Schema<IUser>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    trim: true,
    minlength: [3, 'User ID must be at least 3 characters long'],
    maxlength: [50, 'User ID cannot exceed 50 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['faculty_lab_staff', 'security_staff', 'hod', 'security_incharge', 'faculty'],
      message: 'Invalid role specified'
    }
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

// Index for faster queries
userSchema.index({ userId: 1 });
userSchema.index({ role: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Static method to find user by userId
userSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

// Create and export the model
const User = mongoose.model<IUser>('User', userSchema);

export default User;
