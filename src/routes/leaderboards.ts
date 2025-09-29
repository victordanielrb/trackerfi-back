import { Router } from 'express';
import createLeaderboard from '../functions/leaderboard/createLeaderboard';
import getAllLeaderboards from '../functions/leaderboard/getAllLeaderboards';
import getLeaderboardById from '../functions/leaderboard/getLeaderboardById';
import updateLeaderboard from '../functions/leaderboard/updateLeaderboard';
import deleteLeaderboard from '../functions/leaderboard/deleteLeaderboard';
import { Leaderboard, LeaderboardRewardStatus } from '../interfaces/leaderboard';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Leaderboard:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         campaign_id:
 *           type: string
 *         user_id:
 *           type: string
 *         position:
 *           type: object
 *         total_points:
 *           type: number
 *         reward_amount_usd:
 *           type: number
 *         reward_status:
 *           type: string
 *           enum: [PENDING, PAID]
 *         payment_tx_hash:
 *           type: string
 *         payment_notes:
 *           type: string
 *         calculated_at:
 *           type: string
 *           format: date-time
 *         paid_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/leaderboards:
 *   get:
 *     summary: Get all leaderboard entries
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: query
 *         name: campaign_id
 *         schema:
 *           type: string
 *         description: Filter by campaign
 *       - in: query
 *         name: reward_status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID]
 *         description: Filter by reward status
 *     responses:
 *       200:
 *         description: List of leaderboard entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Leaderboard'
 */
router.get('/', async (req, res) => {
    try {
        const result = await getAllLeaderboards(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/leaderboards/{id}:
 *   get:
 *     summary: Get leaderboard entry by ID
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leaderboard entry found
 *       404:
 *         description: Leaderboard entry not found
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await getLeaderboardById(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/leaderboards:
 *   post:
 *     summary: Create a new leaderboard entry (Admin only)
 *     tags: [Leaderboards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaign_id
 *               - user_id
 *               - position
 *               - total_points
 *               - reward_amount_usd
 *             properties:
 *               campaign_id:
 *                 type: string
 *               user_id:
 *                 type: string
 *               position:
 *                 type: object
 *               total_points:
 *                 type: number
 *               reward_amount_usd:
 *                 type: number
 *               payment_notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leaderboard entry created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Entry already exists
 */
router.post('/', async (req, res) => {
    try {
        const result = await createLeaderboard(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/leaderboards/{id}:
 *   put:
 *     summary: Update leaderboard entry
 *     tags: [Leaderboards]
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
 *               position:
 *                 type: object
 *               total_points:
 *                 type: number
 *               reward_amount_usd:
 *                 type: number
 *               reward_status:
 *                 type: string
 *                 enum: [PENDING, PAID]
 *               payment_tx_hash:
 *                 type: string
 *               payment_notes:
 *                 type: string
 *               paid_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Leaderboard entry updated successfully
 *       404:
 *         description: Leaderboard entry not found
 */
router.put('/:id', async (req, res) => {
    try {
        const result = await updateLeaderboard(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/leaderboards/{id}:
 *   delete:
 *     summary: Delete leaderboard entry
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leaderboard entry deleted successfully
 *       400:
 *         description: Cannot delete entry with paid rewards
 *       404:
 *         description: Leaderboard entry not found
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await deleteLeaderboard(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
