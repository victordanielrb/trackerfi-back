import { Router } from 'express';
import createSubmission from '../functions/submissions/createSubmission';
import getAllSubmissions from '../functions/submissions/getAllSubmissions';
import getSubmissionById from '../functions/submissions/getSubmissionById';
import getSubmissionByCampaignId from '../functions/submissions/getSubmissionByCampaignId';
import updateSubmission from '../functions/submissions/updateSubmission';
import deleteSubmission from '../functions/submissions/deleteSubmission';
import { Submission, SubmissionStatus } from '../interfaces/submission';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Submission:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         campaign_id:
 *           type: string
 *         user_id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         twitter_post_url:
 *           type: string
 *         media_files:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *               url:
 *                 type: string
 *               type:
 *                 type: string
 *         calculated_points:
 *           type: number
 *         status:
 *           type: string
 *           enum: [PENDING, ANALYZING, ANALYZED, APPROVED, REJECTED]
 *         submitted_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/submissions:
 *   get:
 *     summary: Get all submissions
 *     tags: [Submissions]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ANALYZING, ANALYZED, APPROVED, REJECTED]
 *         description: Filter submissions by status
 *       - in: query
 *         name: campaign_id
 *         schema:
 *           type: string
 *         description: Filter submissions by campaign
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter submissions by user
 *     responses:
 *       200:
 *         description: List of submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Submission'
 */
router.get('/', async (req, res) => {
    try {
        const result = await getAllSubmissions(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/submissions/{id}:
 *   get:
 *     summary: Get submission by ID
 *     tags: [Submissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission found
 *       404:
 *         description: Submission not found
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await getSubmissionById(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/submissions/campaign/{campaignId}:
 *   get:
 *     summary: Get submissions for a specific campaign
 *     tags: [Submissions]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ANALYZING, ANALYZED, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: List of submissions for the campaign
 */
router.get('/campaign/:campaignId', async (req, res) => {
    try {
        const result = await getSubmissionByCampaignId(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Create a new submission (Host only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaign_id
 *               - user_id
 *               - title
 *               - description
 *               - twitter_post_url
 *             properties:
 *               campaign_id:
 *                 type: string
 *               user_id:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               twitter_post_url:
 *                 type: string
 *               media_files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *     responses:
 *       201:
 *         description: Submission created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', async (req, res) => {
    try {
        const result = await createSubmission(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/submissions/{id}:
 *   put:
 *     summary: Update submission
 *     tags: [Submissions]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               twitter_post_url:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, ANALYZING, ANALYZED, APPROVED, REJECTED]
 *               admin_notes:
 *                 type: string
 *               calculated_points:
 *                 type: number
 *     responses:
 *       200:
 *         description: Submission updated successfully
 *       404:
 *         description: Submission not found
 */
router.put('/:id', async (req, res) => {
    try {
        const result = await updateSubmission(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/submissions/{id}:
 *   delete:
 *     summary: Delete submission
 *     tags: [Submissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission deleted successfully
 *       404:
 *         description: Submission not found
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await deleteSubmission(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
