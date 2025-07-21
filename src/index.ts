// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { connectDB } from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
// import userRoutes from './routes/users';
// TODO: Add other routes as they are migrated
// import keyRoutes from './routes/keys';
// import departmentRoutes from './routes/departments';
// import logRoutes from './routes/logs';
// import dashboardRoutes from './routes/dashboard';
// import notificationRoutes from './routes/notifications';
// import reportRoutes from './routes/reports';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database (optional for now)
connectDB().catch(err => {
  console.warn('MongoDB connection failed, continuing without database:', err.message);
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Key Management Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// TODO: Add other routes as they are migrated
// app.use('/api/keys', keyRoutes);
// app.use('/api/departments', departmentRoutes);
// app.use('/api/logs', logRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

export default app;
