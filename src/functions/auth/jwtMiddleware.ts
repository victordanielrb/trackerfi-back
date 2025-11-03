import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwtUtil';

// Express middleware to authenticate JWT and attach payload to req.user
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // attach user payload
    (req as any).user = decoded;
    next();
  } catch (err) {
    console.error('JWT middleware error:', err);
    return res.status(500).json({ success: false, message: 'Token verification failed' });
  }
}

export default authenticateToken;
