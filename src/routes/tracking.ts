import express from 'express';
import { verifyToken } from '../functions/auth/jwtUtil';
import addTrackedWallet from '../functions/userRelated/addTrackedWallet';
import removeTrackedWallet from '../functions/userRelated/removeTrackedWallet';
import getUserTrackedWallets from '../functions/userRelated/getUserTrackedWallets';
import getTokensFromTrackedWallets from '../functions/userRelated/getTokensFromTrackedWallets';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req: express.Request, res: express.Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  (req as any).user = decoded;
  next();
};

// Get user's tracked wallets
router.get('/wallets', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const wallets = await getUserTrackedWallets(userId);
    res.json(wallets);
  } catch (error) {
    console.error('Error getting tracked wallets:', error);
    res.status(500).json({ error: 'Failed to get tracked wallets' });
  }
});

// Add wallet to tracking list
router.post('/wallets', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { address, chain } = req.body;

    if (!address || !chain) {
      return res.status(400).json({ error: 'Address and chain are required' });
    }

    const result = await addTrackedWallet(userId, address, chain);
    res.json(result);
  } catch (error: any) {
    console.error('Error adding tracked wallet:', error);
    if (error.message === 'Wallet already tracked by this user') {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to add tracked wallet' });
    }
  }
});

// Remove wallet from tracking list
router.delete('/wallets', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { address, chain } = req.body;

    if (!address || !chain) {
      return res.status(400).json({ error: 'Address and chain are required' });
    }

    const result = await removeTrackedWallet(userId, address, chain);
    res.json(result);
  } catch (error: any) {
    console.error('Error removing tracked wallet:', error);
    if (error.message === 'Wallet not found in tracking list') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to remove tracked wallet' });
    }
  }
});

// Get tokens from all tracked wallets
router.get('/tokens', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const tokens = await getTokensFromTrackedWallets(userId);
    res.json(tokens);
  } catch (error) {
    console.error('Error getting tokens from tracked wallets:', error);
    res.status(500).json({ error: 'Failed to get tokens from tracked wallets' });
  }
});

export default router;
