import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import { connectDB } from '../config/database';

// Load environment variables
dotenv.config({ path: '.env.local' });

const checkUsers = async () => {
  try {
    console.log('🔍 Checking users in database...');
    
    // Connect to database
    await connectDB();
    
    // Get all users
    const users = await User.find({}).select('userId role createdAt');
    console.log(`📊 Found ${users.length} users:`);
    
    users.forEach(user => {
      console.log(`  - ${user.userId} (${user.role}) - Created: ${user.createdAt}`);
    });
    
    // Test specific user
    const testUser = await User.findOne({ userId: 'fac12301' });
    if (testUser) {
      console.log('\n✅ Found fac12301:', {
        userId: testUser.userId,
        role: testUser.role,
        createdAt: testUser.createdAt
      });
    } else {
      console.log('\n❌ User fac12301 not found');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  checkUsers();
}

export default checkUsers;
