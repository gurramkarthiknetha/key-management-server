import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// JWT secret
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register endpoint
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, password, role } = req.body;

    // Validation
    if (!userId || !password || !role) {
      res.status(400).json({
        success: false,
        error: 'User ID, password, and role are required'
      });
      return;
    }

    // Validate role
    const validRoles = ['faculty_lab_staff', 'security_staff', 'hod', 'security_incharge'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: 'Invalid role specified'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User ID already exists'
      });
      return;
    }

    // Create new user
    const user = new User({
      userId,
      password,
      role
    });

    await user.save();

    // Generate JWT token
    const payload = {
      userId: user.userId,
      id: (user._id as any).toString(),
      role: user.role
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, password } = req.body;

    // Validation
    if (!userId || !password) {
      res.status(400).json({
        success: false,
        error: 'User ID and password are required'
      });
      return;
    }

    // Find user by userId
    const user = await User.findOne({ userId }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate JWT token
    const payload = {
      userId: user.userId,
      id: (user._id as any).toString(),
      role: user.role
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get current user endpoint
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
