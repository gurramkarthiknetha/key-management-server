# Key Management System - Server

Backend API server for the Key Management System built with Express.js, TypeScript, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (optional for development - server runs with mock data)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The server will start on `http://localhost:5000`

## 📋 Available Scripts

### Development
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
```

### Testing
```bash
npm run test                # Run endpoint tests
npm run test:endpoints      # Run comprehensive API endpoint tests
```

### Data Management
```bash
npm run import:data         # Import seed data (clears existing data)
npm run import:data:no-clear # Import seed data (keeps existing data)
npm run seed               # Alias for import:data
```

## 🧪 Testing Endpoints

The server includes a comprehensive test suite that validates all API endpoints:

### Run Tests
```bash
# Make sure server is running first
npm run dev

# In another terminal, run tests
npm run test:endpoints
```

### Test Coverage
- ✅ Health check endpoint
- ✅ Authentication endpoints (login, register, me)
- ✅ Error handling (404, validation errors)
- ✅ Mock data responses
- ✅ Request/response validation

### Sample Test Output
```
Key Management Server API Test Suite
Testing server at: http://localhost:5000

=== Health Check ===
✓ PASS GET /health

=== Authentication Endpoints ===
✓ PASS POST /api/auth/login (valid)
✓ PASS POST /api/auth/login (invalid)
✓ PASS POST /api/auth/register
✓ PASS GET /api/auth/me

=== 404 Error Handling ===
✓ PASS GET /api/nonexistent

Test Suite Completed
Total time: 0.15s
```

## 📊 Seed Data

The server includes comprehensive seed data for development and testing:

### Data Included
- **5 Departments**: CS, IT, Math, Physics, Security
- **8 Users**: Admin, Security staff, Faculty, HODs
- **8 Keys**: Labs, offices, storage rooms with different statuses
- **Key Logs**: Check-in/out history
- **Notifications**: System alerts and messages

### Sample Users
```
Email: admin@university.edu
Password: admin123
Role: Admin

Email: security.chief@university.edu  
Password: security123
Role: Security Incharge

Email: alice.johnson@university.edu
Password: faculty123
Role: Faculty

Email: bob.smith@university.edu
Password: hod123
Role: HOD (Head of Department)
```

### Import Data
```bash
# Clear existing data and import fresh seed data
npm run import:data

# Import without clearing (append to existing data)
npm run import:data:no-clear
```

## 🔧 API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST /api/auth/login      # User login
POST /api/auth/register   # User registration  
GET  /api/auth/me         # Get current user
```

### Future Endpoints (To be implemented)
```
GET    /api/keys          # List all keys
POST   /api/keys          # Create new key
GET    /api/keys/:id      # Get key details
PUT    /api/keys/:id      # Update key
DELETE /api/keys/:id      # Delete key

GET    /api/users         # List users
POST   /api/users         # Create user
GET    /api/users/:id     # Get user details
PUT    /api/users/:id     # Update user

GET    /api/departments   # List departments
GET    /api/logs          # Get activity logs
GET    /api/dashboard     # Dashboard data
GET    /api/notifications # User notifications
GET    /api/reports       # Generate reports
```

## 🏗️ Project Structure

```
server/
├── src/
│   ├── config/           # Database and app configuration
│   ├── data/             # Seed data files
│   ├── middleware/       # Express middleware
│   ├── models/           # Mongoose models (being fixed)
│   ├── routes/           # API route handlers
│   ├── scripts/          # Utility scripts (data import)
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Helper utilities
│   └── index.ts          # Main server entry point
├── test-endpoints.js     # Comprehensive API test suite
├── package.json
└── README.md
```

## 🔄 Current Status

### ✅ Working Features
- Express.js server with TypeScript
- Health check endpoint
- Mock authentication endpoints
- Comprehensive test suite
- Seed data system
- Error handling middleware
- CORS and security headers

### 🚧 In Progress
- Mongoose model TypeScript fixes
- Real database operations
- JWT token generation
- Password hashing
- QR code generation

### 📋 Next Steps
1. Fix Mongoose model TypeScript interfaces
2. Enable real database operations
3. Implement remaining API endpoints
4. Add authentication middleware
5. Connect with Next.js frontend

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port 5000 is available
lsof -i :5000

# Kill process using port 5000
kill -9 $(lsof -t -i:5000)
```

### MongoDB Connection Issues
The server runs without MongoDB for development. Database connection errors are logged but don't crash the server.

### Test Failures
```bash
# Make sure server is running
curl http://localhost:5000/health

# Check server logs for errors
npm run dev
```

## 📝 Development Notes

- Server uses mock data when database models are unavailable
- TypeScript compilation errors in models are temporarily bypassed
- All endpoints return JSON responses with consistent structure
- Error handling follows REST API best practices
- Comprehensive logging for debugging

## 🤝 Contributing

1. Ensure all tests pass: `npm run test:endpoints`
2. Follow TypeScript best practices
3. Add tests for new endpoints
4. Update seed data as needed
5. Document API changes in README
