import { Router, Request, Response } from 'express';
import login from '../functions/auth/login';
import register from '../functions/auth/register';
import { authenticateToken } from '../functions/auth/jwtMiddleware';
import { add2FA, remove2FA, get2FA, verify2FA } from '../functions/auth/twoFactorAuth';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    const result = await register(email, password, username);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await login(email, password);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /auth/verify
router.get('/verify', authenticateToken, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: (req as any).user
    }
  });
});

// POST /auth/logout - Logout user (stateless, just returns success)
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
  // JWT is stateless, so we just acknowledge the logout
  // Client should clear the token from storage
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ==================== 2FA Routes ====================

// POST /auth/2fa/add - Add 2FA hash for authenticated user
router.post('/2fa/add', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { two_factor_hash } = req.body;

    if (!two_factor_hash) {
      return res.status(400).json({
        success: false,
        message: '2FA hash is required'
      });
    }

    const result = await add2FA(userId, two_factor_hash);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Add 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /auth/2fa/remove - Remove 2FA for authenticated user
router.delete('/2fa/remove', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await remove2FA(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Remove 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /auth/2fa - Get 2FA status for authenticated user
router.get('/2fa', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await get2FA(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /auth/2fa/verify - Verify 2FA code for authenticated user
router.post('/2fa/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { two_factor_hash } = req.body;

    if (!two_factor_hash) {
      return res.status(400).json({
        success: false,
        message: '2FA hash is required for verification'
      });
    }

    const result = await verify2FA(userId, two_factor_hash);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;