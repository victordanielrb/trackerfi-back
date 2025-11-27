import { Router, Request, Response } from 'express';
import { createUser } from '../functions/userRelated/createUser';
import { getUser } from '../functions/userRelated/getUser';
import { updateUser } from '../functions/userRelated/updateUser';
import { deleteUser } from '../functions/userRelated/deleteUser';
import { authenticateToken } from '../functions/auth/jwtMiddleware';
import { 
  addTokenToFavorites, 
  removeTokenFromFavorites, 
  getUserFavorites, 
  isTokenFavorite 
} from '../functions/userRelated/manageFavorites';

const router = Router();

/**
 * GET /users/favorites
 * Get user's favorite tokens. Protected.
 */
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    
    const favorites = await getUserFavorites(userId);
    res.json({ favorites });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * POST /users/favorites/:tokenId
 * Add token to user's favorites. Protected.
 */
router.post('/favorites/:tokenId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { tokenId } = req.params;
    
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    
    const success = await addTokenToFavorites(userId, tokenId);
    if (success) {
      res.json({ success: true, message: 'Token added to favorites' });
    } else {
      res.status(400).json({ error: 'Failed to add token to favorites' });
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * DELETE /users/favorites/:tokenId
 * Remove token from user's favorites. Protected.
 */
router.delete('/favorites/:tokenId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { tokenId } = req.params;
    
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    
    const success = await removeTokenFromFavorites(userId, tokenId);
    if (success) {
      res.json({ success: true, message: 'Token removed from favorites' });
    } else {
      res.status(400).json({ error: 'Failed to remove token from favorites' });
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * GET /users/favorites/:tokenId/check
 * Check if token is in user's favorites. Protected.
 */
router.get('/favorites/:tokenId/check', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { tokenId } = req.params;
    
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    
    const isFavorite = await isTokenFavorite(userId, tokenId);
    res.json({ isFavorite });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// POST /users - Create a new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await createUser(req.body);
    res.status(201).json({
      status: 201,
      message: result
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
});

// GET /users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await getUser(id);
    if (result) {
      res.status(200).json({
        status: 200,
        message: result
      });
    } else {
      res.status(404).json({
        status: 404,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
});

// PUT /users/:id - Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await updateUser(id, req.body);
    res.status(200).json({
      status: 200,
      message: result ? 'User updated successfully' : 'User not found'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
});

// DELETE /users/:id - Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteUser(id);
    res.status(200).json({
      status: 200,
      message: result ? 'User deleted successfully' : 'User not found'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
});

export default router;