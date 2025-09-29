import { Router } from 'express';
import addWallet from '../functions/wallets/addWallet';
import getAllWallets from '../functions/wallets/getAllWallets';
import getWalletById from '../functions/wallets/getWalletById';
import getUserWallets from '../functions/wallets/getUserWallets';
import updateWallet from '../functions/wallets/updateWallet';
import deleteWallet from '../functions/wallets/deleteWallet';
import { UserWallet } from '../interfaces/user';
import { Blockchain } from '../interfaces/general';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Wallet:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user_id:
 *           type: string
 *         blockchain:
 *           type: string
 *           enum: [SUI, EVM, SOLANA]
 *         wallet_address:
 *           type: string
 *         connected_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Get all wallets (Admin only)
 *     tags: [Wallets]
 *     responses:
 *       200:
 *         description: List of all wallets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Wallet'
 */
router.get('/', async (req, res) => {
    try {
        const result = await getAllWallets(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/wallets/{id}:
 *   get:
 *     summary: Get wallet by ID
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet found
 *       404:
 *         description: Wallet not found
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await getWalletById(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/wallets/user/{userId}:
 *   get:
 *     summary: Get wallets for a specific user
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user wallets
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const result = await getUserWallets(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/wallets:
 *   post:
 *     summary: Add a new wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - blockchain
 *               - wallet_address
 *             properties:
 *               user_id:
 *                 type: string
 *               blockchain:
 *                 type: string
 *                 enum: [SUI, EVM, SOLANA]
 *               wallet_address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wallet added successfully
 *       400:
 *         description: Invalid input or wallet validation failed
 *       403:
 *         description: Wallet ownership verification failed
 */
router.post('/', async (req, res) => {
    try {
        const result = await addWallet(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/wallets/{id}:
 *   put:
 *     summary: Update wallet
 *     tags: [Wallets]
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
 *             properties:
 *               wallet_address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet updated successfully
 *       404:
 *         description: Wallet not found
 */
router.put('/:id', async (req, res) => {
    try {
        const result = await updateWallet(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/wallets/{id}:
 *   delete:
 *     summary: Delete wallet
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet deleted successfully
 *       404:
 *         description: Wallet not found
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await deleteWallet(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
