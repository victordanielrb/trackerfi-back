import { Router } from 'express';
import createUser from '../functions/users/createUser';
import createHostUser from '../functions/users/createHostUser';
import createCreatorUser from '../functions/users/createCreatorUser';
import authenticateHostUser from '../functions/users/authenticateHostUser';
import getAllUsers from '../functions/users/getAllUsers';
import getUserById from '../functions/users/getUserById';
import getUserProfile from '../functions/users/getUserProfile';
import getUsersByType from '../functions/users/getUsersByType';
import editUser from '../functions/users/editUser';
import disableUser from '../functions/users/disableUser';
import authenticateWithTwitter from '../functions/users/authenticateWithTwitter';
import { UserType, UserStatus, BaseUser, HostUser, CreatorUser } from '../interfaces/user';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         username:
 *           type: string
 *         user_type:
 *           type: string
 *           enum: [CREATOR, HOST, ADMIN]
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', async (req, res) => {
    try {
        const result = await getAllUsers(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await getUserById(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users/profile/{userId}:
 *   get:
 *     summary: Get detailed user profile with statistics
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile with statistics
 *       404:
 *         description: User not found
 */
router.get('/profile/:userId', async (req, res) => {
    try {
        const result = await getUserProfile(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users/type/{userType}:
 *   get:
 *     summary: Get users by type
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CREATOR, HOST, ADMIN]
 *     responses:
 *       200:
 *         description: List of users by type
 *       400:
 *         description: Invalid user type
 */
router.get('/type/:userType', async (req, res) => {
    try {
        const result = await getUsersByType(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (routes to appropriate function based on user_type)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_type:
 *                 type: string
 *                 enum: [HOST, CREATOR]
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
    try {
        const result = await createUser(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users/host:
 *   post:
 *     summary: Create a new host user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password_hash:
 *                 type: string
 *     responses:
 *       201:
 *         description: Host user created successfully
 */
router.post('/host', async (req, res) => {
    try {
        const result = await createHostUser(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users/creator:
 *   post:
 *     summary: Create a new creator user (Twitter user)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               twitter_id:
 *                 type: string
 *               twitter_username:
 *                 type: string
 *               twitter_access_token:
 *                 type: string
 *     responses:
 *       201:
 *         description: Creator user created successfully
 */
router.post('/creator', async (req, res) => {
    try {
        const result = await createCreatorUser(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users/auth/twitter:
 *   post:
 *     summary: Authenticate with Twitter (OAuth)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               twitter_id:
 *                 type: string
 *               twitter_username:
 *                 type: string
 *               twitter_access_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *       201:
 *         description: New user created and authenticated
 */
router.post('/auth/twitter', async (req, res) => {
    try {
        const result = await authenticateWithTwitter(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id', async (req, res) => {
    try {
        const result = await editUser(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Disable/Delete user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User disabled successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id', async (req, res) => {
    try {
        return await disableUser(req, res);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users/auth/host:
 *   post:
 *     summary: Authenticate host user with email and password
 *     tags: [Users, Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Host user email address
 *               password:
 *                 type: string
 *                 description: User password
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/BaseUser'
 *                 message:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account not active
 */
router.post('/auth/host', async (req, res) => {
    try {
        const result = await authenticateHostUser(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
