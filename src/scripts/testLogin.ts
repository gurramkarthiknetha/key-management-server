import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import { connectDB } from '../config/database';

// Load environment variables
dotenv.config({ path: '.env.local' });

const testLogin = async () => {
  try {
    console.log('🔍 Testing login for fac12301...');
    
    // Connect to database
    await connectDB();
    
    // Find user with password field
    const user = await User.findOne({ userId: 'fac12301' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      userId: user.userId,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });
    
    // Test password comparison
    const testPassword = '123456789';
    console.log(`🔐 Testing password: "${testPassword}"`);
    
    try {
      const isValid = await user.comparePassword(testPassword);
      console.log('🔍 Password comparison result:', isValid);
      
      if (!isValid) {
        console.log('❌ Password does not match');
        
        // Let's also test with some other common passwords
        const testPasswords = ['123456789', 'fac123', 'faculty123'];
        for (const pwd of testPasswords) {
          const result = await user.comparePassword(pwd);
          console.log(`  Testing "${pwd}": ${result}`);
        }
      } else {
        console.log('✅ Password matches!');
      }
    } catch (error) {
      console.error('❌ Error comparing password:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  testLogin();
}

export default testLogin;
