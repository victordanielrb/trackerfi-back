import express from 'express';
import { authenticateToken } from '../functions/auth/jwtMiddleware';
import addTrackedWallet from '../functions/userRelated/addTrackedWallet';
import removeTrackedWallet from '../functions/userRelated/removeTrackedWallet';
import getUserTrackedWallets from '../functions/userRelated/getUserTrackedWallets';
import getTokensFromTrackedWallets from '../functions/userRelated/getTokensFromTrackedWallets';
import getUserSnapshots from '../functions/userRelated/getUserSnapshots';
import { getUserTransactions } from '../functions/userRelated/getUserTransactions';
import addAlert from '../functions/alerts/addAlert';

const router = express.Router();

// Use shared JWT middleware

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

// Get user's alerts
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const user = await (await import('../functions/userRelated/getUser')).getUser(userId);
    res.json({ alerts: user?.alerts || [] });
  } catch (error) {
    console.error('Error getting user alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Create a new alert for the authenticated user
router.post('/alerts', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { token, price_threshold, alert_type } = req.body;
    if (!token || !price_threshold || !alert_type) {
      return res.status(400).json({ error: 'token, price_threshold and alert_type are required' });
    }
    const result = await addAlert(userId, { token, price_threshold, alert_type });
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Get user's portfolio snapshots
router.get('/snapshots', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { days, limit } = req.query;
    
    const snapshots = await getUserSnapshots(userId, {
      days: days ? parseInt(days as string) : undefined,
      limit: limit ? parseInt(limit as string) : 30
    });
    
    res.json({ snapshots });
  } catch (error) {
    console.error('Error getting user snapshots:', error);
    res.status(500).json({ error: 'Failed to get snapshots' });
  }
});

// Get all user transactions (from all tracked wallets - stored in DB by hourly GitHub Action)
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { wallet, chain, type, direction, from_date, to_date, limit } = req.query;
    
    console.log('=== GET /transactions ===');
    console.log('userId:', userId);
    console.log('filters:', { wallet, chain, type, direction, from_date, to_date, limit });
    
    const result = await getUserTransactions(userId, {
      wallet_address: wallet as string,
      chain: chain as string,
      type: type as string,
      direction: direction as 'in' | 'out' | 'self',
      from_date: from_date ? new Date(from_date as string) : undefined,
      to_date: to_date ? new Date(to_date as string) : undefined,
      limit: limit ? parseInt(limit as string) : 100
    });
    
    console.log(`Returning ${result.transactions?.length} transactions, last updated: ${result.lastUpdated}`);
    
    res.json({
      transactions: result.transactions,
      total_count: result.totalCount,
      last_updated: result.lastUpdated
    });
  } catch (error) {
    console.error('Error getting user transactions:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

export default router;
