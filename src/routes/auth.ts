import express, { Request, Response } from 'express';

const router = express.Router();

// POST /api/auth/login - Simple test route
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    // Mock validation for testing
    if (email === 'test@example.com' && password === 'password123') {
      res.json({
        success: true,
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: email,
            role: 'admin',
            department: 'IT'
          },
          token: 'mock-jwt-token'
        }
      });
      return;
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/auth/register - Simple test route
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, employeeId, role, department } = req.body;

    // Simple validation
    if (!name || !email || !password || !employeeId || !role || !department) {
      res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
      return;
    }

    // Mock response for testing
    res.status(201).json({
      success: true,
      data: {
        id: '2',
        name: name,
        email: email,
        role: role,
        employeeId: employeeId,
        department: department,
        isActive: true
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/auth/me - Simple test route
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    // Mock response for testing
    res.json({
      success: true,
      data: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        employeeId: 'EMP001',
        department: 'IT',
        isActive: true
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;