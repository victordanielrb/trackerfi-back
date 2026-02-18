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

// ==================== 2FA Routes (TOTP-based) ====================

// POST /auth/2fa/setup - Generate TOTP secret + QR code
router.post('/2fa/setup', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const result = await add2FA(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /auth/2fa/verify - Verify TOTP code (enables 2FA on first successful verify)
router.post('/2fa/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'TOTP token is required (6-digit code from authenticator app)'
      });
    }

    const result = await verify2FA(userId, token);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /auth/2fa - Get 2FA status (enabled/disabled, no secret exposed)
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
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;