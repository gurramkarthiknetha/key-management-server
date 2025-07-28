# Scripts Documentation

This directory contains utility scripts for the Key Management Authentication Server.

## Available Scripts

### 1. API Testing Script (`test-api.js`)

Comprehensive testing script for all authentication endpoints.

**Usage:**
```bash
# From backend directory
npm run test:api

# From frontend directory  
npm run test:api

# With custom email
npm run test:api -- --email mytest@vnrvjiet.in

# Show help
npm run test:api -- --help
```

**What it tests:**
- ✅ Health check and CORS connectivity
- ✅ User registration with email verification
- ✅ OTP generation and email delivery
- ✅ Login with OTP verification
- ✅ JWT token authentication
- ✅ Protected endpoint access
- ✅ User management endpoints
- ✅ Rate limiting functionality
- ✅ Logout functionality

**Requirements:**
- Backend server running on port 5000
- Valid email configuration in .env
- Test email ending with @vnrvjiet.in

### 2. Keys Import Script (`import-keys.js`)

Imports seed data for keys into the database.

**Usage:**
```bash
# Import keys (keep existing)
npm run import:keys

# Clear existing keys and import fresh data
npm run import:keys:clear

# Show help
npm run import:keys -- --help
```

**What it imports:**
- 🏫 **Laboratory Keys**: Computer labs, electronics labs, mechanical labs
- 🏢 **Conference Rooms**: Department meeting rooms
- 🎭 **Auditoriums**: Main auditorium for events
- 🔒 **Security Keys**: Gate control, patrol vehicles
- 🚗 **Vehicle Keys**: Campus transportation
- 📚 **Administrative Keys**: Library, general facilities

**Sample Data Includes:**
- CSE Labs (CSE-LAB-001, CSE-LAB-002)
- ECE Labs (ECE-LAB-001, ECE-LAB-002)
- Mechanical Labs (MECH-LAB-001, MECH-LAB-002)
- Conference rooms and auditoriums
- Security and administrative keys

## Environment Setup

Make sure your `.env` file is properly configured:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# JWT & Security
JWT_SECRET=your-long-random-secret
SESSION_SECRET=your-session-secret

# Organization
ALLOWED_EMAIL_DOMAIN=vnrvjiet.in
ORGANIZATION_NAME=VNR VJIET
```

## Testing Workflow

### Complete System Test

1. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd key-management-server
   npm run dev
   
   # Terminal 2 - Frontend  
   cd key-management
   npm run dev
   ```

2. **Import seed data:**
   ```bash
   npm run import:keys:clear
   ```

3. **Run API tests:**
   ```bash
   npm run test:api
   ```

4. **Test frontend:**
   - Visit http://localhost:3000/test-auth
   - Test registration and login flow
   - Verify email OTP functionality

### Manual Testing Steps

1. **Registration Test:**
   - Use email ending with @vnrvjiet.in
   - Check email for verification OTP
   - Complete email verification

2. **Login Test:**
   - Request login OTP
   - Check email for login OTP
   - Complete login process

3. **Key Management Test:**
   - View available keys
   - Test key assignment
   - Test QR code scanning
   - Test key return process

## Troubleshooting

### Common Issues

**1. Email not sending:**
```bash
# Check SMTP configuration
echo $SMTP_USER
echo $SMTP_HOST

# Test email service
node -e "
const emailService = require('./services/emailService');
emailService.sendOTPEmail('test@vnrvjiet.in', '123456', 'login', 'Test User')
  .then(result => console.log('Email test result:', result))
  .catch(err => console.error('Email test error:', err));
"
```

**2. Database connection issues:**
```bash
# Test database connection
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database error:', err));
"
```

**3. CORS issues:**
```bash
# Test CORS
curl -H "Origin: http://localhost:3000" \
     -H "Content-Type: application/json" \
     http://localhost:5000/api/test
```

**4. Port conflicts:**
```bash
# Check if ports are in use
lsof -i :5000  # Backend port
lsof -i :3000  # Frontend port

# Kill processes if needed
kill -9 $(lsof -t -i:5000)
kill -9 $(lsof -t -i:3000)
```

### Script Debugging

**Enable verbose logging:**
```bash
# Set debug environment
export DEBUG=true
npm run test:api

# Check script logs
tail -f logs/api-test.log
```

**Test individual endpoints:**
```bash
# Test health check
curl http://localhost:5000/health

# Test CORS
curl -H "Origin: http://localhost:3000" http://localhost:5000/api/test

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@vnrvjiet.in","name":"Test User","employeeId":"TEST001","department":"Computer Science","role":"faculty"}'
```

## Script Customization

### Adding New Test Cases

Edit `test-api.js` to add new test functions:

```javascript
async function testNewFeature() {
  log.step('Testing New Feature');
  
  const result = await makeRequest('POST', '/api/new-endpoint', {
    // test data
  });
  
  if (result.success) {
    log.success('New feature test passed');
  } else {
    log.error('New feature test failed');
  }
  
  return result.success;
}

// Add to test array in runTests()
const tests = [
  // ... existing tests
  { name: 'New Feature', fn: testNewFeature, required: false }
];
```

### Adding New Seed Data

Edit `import-keys.js` to add new keys:

```javascript
const newKey = {
  keyId: 'NEW-KEY-001',
  name: 'New Key Name',
  description: 'Description of the new key',
  location: 'Building X, Floor Y, Room Z',
  department: 'Department Name',
  category: 'laboratory', // or other category
  isActive: true,
  maxAllowedTime: 480,
  requiresApproval: false,
  allowedRoles: ['faculty', 'hod'],
  qrCode: 'NEW-KEY-001-QR',
  specifications: {
    capacity: 30,
    equipment: ['Equipment 1', 'Equipment 2']
  }
};

// Add to keysData array
const keysData = [
  // ... existing keys
  newKey
];
```

## Performance Monitoring

### Script Performance

```bash
# Time script execution
time npm run test:api
time npm run import:keys

# Monitor memory usage
/usr/bin/time -v npm run import:keys
```

### Database Performance

```bash
# Monitor database operations
mongotop --host your-mongodb-host

# Check collection stats
mongo your-database --eval "db.keys.stats()"
mongo your-database --eval "db.users.stats()"
```

## Security Considerations

- Never commit real credentials to version control
- Use environment variables for all sensitive data
- Rotate JWT secrets regularly
- Monitor failed authentication attempts
- Use HTTPS in production
- Implement proper rate limiting
- Validate all input data
- Use secure session configuration

## Support

For issues with scripts:
1. Check the troubleshooting section above
2. Verify environment configuration
3. Check server logs for detailed error messages
4. Test individual components separately
5. Create an issue with detailed error logs
