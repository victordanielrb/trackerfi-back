import express from 'express';
import { authenticateToken } from '../functions/auth/jwtMiddleware';
import addExchange from '../functions/userExchange/addExchange';
import getUserExchanges from '../functions/userExchange/getUserExchanges';
import updateExchange from '../functions/userExchange/updateExchange';
import deleteExchange from '../functions/userExchange/deleteExchange';
import getExchangeForEdit from '../functions/userExchange/getExchangeForEdit';
import getUserFuturesPositions from '../functions/userExchange/getUserFuturesPositions';

const router = express.Router();

// Middleware to verify JWT token for all exchange routes
router.use(authenticateToken);

// POST /api/exchanges - Add new exchange
router.post('/', async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User ID not found in token' 
      });
    }

    const { name, api_key, api_secret } = req.body;
    
    if (!name || !api_key || !api_secret) {
      return res.status(400).json({
        success: false,
        message: 'Exchange name, API key, and API secret are required'
      });
    }

    const result = await addExchange(userId, { name, api_key, api_secret });
    
    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error adding exchange:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/exchanges - Get all user exchanges
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User ID not found in token' 
      });
    }

    const result = await getUserExchanges(userId);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error getting user exchanges:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/exchanges/futures - Get user futures positions from all exchanges
router.get('/futures', async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User ID not found in token' 
      });
    }

    const result = await getUserFuturesPositions(userId);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error getting futures positions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/exchanges/:exchangeId/edit - Get exchange for editing (with decrypted credentials)
router.get('/:exchangeId/edit', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User ID not found in token' 
      });
    }

    // Verify the exchange belongs to the authenticated user
    if (!exchangeId.startsWith(userId + '-')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this exchange'
      });
    }

    const result = await getExchangeForEdit(exchangeId);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error getting exchange for edit:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/exchanges/:exchangeId - Update exchange
router.put('/:exchangeId', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { api_key, api_secret } = req.body;

    if (!api_key && !api_secret) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (api_key or api_secret) must be provided'
      });
    }

    const result = await updateExchange(exchangeId, { api_key, api_secret });
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error updating exchange:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/exchanges/:exchangeId - Delete exchange
router.delete('/:exchangeId', async (req, res) => {
  try {
    const { exchangeId } = req.params;

    const result = await deleteExchange(exchangeId);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error deleting exchange:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;