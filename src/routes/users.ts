import { Router, Request, Response } from 'express';
import { createUser } from '../functions/userRelated/createUser';
import { getUser } from '../functions/userRelated/getUser';
import { updateUser } from '../functions/userRelated/updateUser';
import { deleteUser } from '../functions/userRelated/deleteUser';

const router = Router();

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