import { Router, Request, Response } from 'express';
import addWallet from '../functions/wallets/addWallet';
import deleteWallet from '../functions/wallets/deleteWallet';
import getAllWallets from '../functions/wallets/getAllWallets';
import getUserWallets from '../functions/wallets/getUserWallets';
import getWalletById from '../functions/wallets/getWalletById';
import updateWallet from '../functions/wallets/updateWallet';
import getTokensFromWallet from '../functions/tokenRelated/getTokensFromWallet';
import { verifyToken } from '../functions/auth/jwtUtil';

const router = Router();

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: Response, next: any) => {
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

// GET /api/wallets - Get all wallets (admin only)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await getAllWallets();
    
    if (result.status === 200) {
      // Handle both string and object message types
      const responseData = typeof result.message === 'object' && result.message.wallets 
        ? result.message.wallets 
        : [];
        
      res.status(200).json({
        success: true,
        data: responseData
      });
    } else {
      res.status(result.status).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Get all wallets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/wallets/user/:userId - Get user's wallets
router.get('/user/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await getUserWallets(req);
    
    if (result.status === 200) {
      // Handle both string and object message types
      const responseData = typeof result.message === 'object' && result.message.wallets 
        ? result.message.wallets 
        : [];
        
      res.status(200).json({
        success: true,
        data: responseData
      });
    } else {
      res.status(result.status).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Get user wallets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/wallets/:walletId - Get wallet by ID
router.get('/:walletId', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Create a mock request object with the walletId in params.id
    const mockReq = { params: { id: req.params.walletId } } as any;
    const result = await getWalletById(mockReq);
    
    if (result.status === 200) {
      res.status(200).json({
        success: true,
        data: result.message
      });
    } else {
      res.status(result.status).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Get wallet by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/wallets - Add new wallet
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user_id, blockchain, wallet_address } = req.body;
    
    if (!user_id || !blockchain || !wallet_address) {
      return res.status(400).json({
        success: false,
        message: 'User ID, blockchain, and wallet address are required'
      });
    }

    const result = await addWallet(user_id, blockchain, wallet_address);
    
    if (result.status === 201) {
      res.status(201).json({
        success: true,
        data: result.message
      });
    } else {
      res.status(result.status).json({
        success: false,
        message: result.message.error || result.message
      });
    }
  } catch (error) {
    console.error('Add wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/wallets/:walletId - Update wallet
router.put('/:walletId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { walletId } = req.params;
    const { wallet_address, blockchain } = req.body;
    
    if (!wallet_address && !blockchain) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (wallet_address or blockchain) is required for update'
      });
    }

    // Create a mock request object
    const mockReq = { params: { id: walletId }, body: req.body } as any;
    const result = await updateWallet(mockReq);
    
    if (result.status === 200) {
      res.status(200).json({
        success: true,
        data: result.message
      });
    } else {
      res.status(result.status).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Update wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/wallets/:walletId - Delete wallet
router.delete('/:walletId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await deleteWallet(req.params.walletId);
    
    if (result.status === 200) {
      res.status(200).json({
        success: true,
        data: result.message
      });
    } else {
      res.status(result.status).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Delete wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/wallets/:walletId/tokens - Get tokens from wallet
router.get('/:walletId/tokens', authenticateToken, async (req: Request, res: Response) => {
  try {
    // First get the wallet to get the address
    const mockReq = { params: { id: req.params.walletId } } as any;
    const walletResult = await getWalletById(mockReq);
    
    if (walletResult.status !== 200) {
      return res.status(walletResult.status).json({
        success: false,
        message: walletResult.message
      });
    }

    const wallet = walletResult.message as any;
    const tokens = await getTokensFromWallet(wallet.wallet_address);
    
    res.status(200).json({
      success: true,
      data: {
        wallet_address: wallet.wallet_address,
        blockchain: wallet.blockchain,
        tokens: tokens
      }
    });
  } catch (error) {
    console.error('Get wallet tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;