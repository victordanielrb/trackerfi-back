import express from 'express';
import { authenticateToken } from '../functions/auth/jwtMiddleware';
import addTrackedWallet from '../functions/userRelated/addTrackedWallet';
import removeTrackedWallet from '../functions/userRelated/removeTrackedWallet';
import getUserTrackedWallets from '../functions/userRelated/getUserTrackedWallets';
import getTokensFromTrackedWallets from '../functions/userRelated/getTokensFromTrackedWallets';
import getUserSnapshots from '../functions/userRelated/getUserSnapshots';
import { getUserTransactions } from '../functions/userRelated/getUserTransactions';
import addAlert from '../functions/alerts/addAlert';
import getAlerts from '../functions/alerts/getAlerts';
import updateAlert from '../functions/alerts/updateAlert';
import deleteAlert, { deleteAlertByTokenId } from '../functions/alerts/deleteAlert';

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
    const alerts = await getAlerts(userId);
    res.json({ alerts });
  } catch (error) {
    console.error('Error getting user alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Create a new alert for the authenticated user
router.post('/alerts', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { token_id, token_symbol, token_name, price_threshold, alert_type } = req.body;
    
    if (!token_id || !token_symbol || !price_threshold || !alert_type) {
      return res.status(400).json({ 
        error: 'token_id, token_symbol, price_threshold and alert_type are required' 
      });
    }
    
    if (!['price_above', 'price_below'].includes(alert_type)) {
      return res.status(400).json({ 
        error: 'alert_type must be "price_above" or "price_below"' 
      });
    }
    
    const result = await addAlert(userId, { 
      token_id, 
      token_symbol, 
      token_name: token_name || token_symbol,
      price_threshold: Number(price_threshold), 
      alert_type 
    });
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Update an alert by index
router.put('/alerts/:index', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const alertIndex = parseInt(req.params.index);
    
    if (isNaN(alertIndex) || alertIndex < 0) {
      return res.status(400).json({ error: 'Invalid alert index' });
    }
    
    const { token_id, token_symbol, token_name, price_threshold, alert_type, is_active } = req.body;
    
    const updateData: any = {};
    if (token_id !== undefined) updateData.token_id = token_id;
    if (token_symbol !== undefined) updateData.token_symbol = token_symbol;
    if (token_name !== undefined) updateData.token_name = token_name;
    if (price_threshold !== undefined) updateData.price_threshold = Number(price_threshold);
    if (alert_type !== undefined) {
      if (!['price_above', 'price_below'].includes(alert_type)) {
        return res.status(400).json({ 
          error: 'alert_type must be "price_above" or "price_below"' 
        });
      }
      updateData.alert_type = alert_type;
    }
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    
    const result = await updateAlert(userId, alertIndex, updateData);
    
    if (!result.success) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete an alert by index
router.delete('/alerts/:index', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const alertIndex = parseInt(req.params.index);
    
    if (isNaN(alertIndex) || alertIndex < 0) {
      return res.status(400).json({ error: 'Invalid alert index' });
    }
    
    const result = await deleteAlert(userId, alertIndex);
    
    if (!result.success) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// Delete an alert by token_id
router.delete('/alerts/token/:tokenId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const tokenId = req.params.tokenId;
    
    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID is required' });
    }
    
    const result = await deleteAlertByTokenId(userId, tokenId);
    
    if (!result.success) {
      return res.status(404).json({ error: 'Alert not found for this token' });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error deleting alert by token:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
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
