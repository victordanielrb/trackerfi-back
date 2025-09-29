import { Router } from 'express';
import createCampaign from '../functions/campaigns/createCampaign';
import getAllCampaigns from '../functions/campaigns/getAllCampaigns';
import getCampaignById from '../functions/campaigns/getCampaignById';
import getCampaignsByCreator from '../functions/campaigns/getCampaignsByCreator';
import getCampaignsByHost from '../functions/campaigns/getCampaignsByHost';
import getCampaignsByParticipant from '../functions/campaigns/getCampaignsByParticipant';
import getCampaignsWithFilters from '../functions/campaigns/getCampaignsWithFilters';
import getCampaignsWithSubmissions from '../functions/campaigns/getCampaignsWithSubmissions';
import editCampaign from '../functions/campaigns/editCampaign';
import deleteCampaign from '../functions/campaigns/deleteCampaign';
import joinCampaign from '../functions/campaigns/joinCampaign';
import getLeaderboard from '../functions/campaigns/getLeaderboard';
import setCampaignLeaderboard from '../functions/campaigns/setCampaignLeaderboard';
import { Campaign, CampaignStatus } from '../interfaces/campaign';
import { UserType } from '../interfaces/user';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RewardTier:
 *       type: object
 *       properties:
 *         tier:
 *           type: number
 *         percentage:
 *           type: number
 *         description:
 *           type: string
 *         positions:
 *           type: string
 *     Campaign:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         host_id:
 *           type: string
 *           description: HOST creates campaigns
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         requirements:
 *           type: string
 *         evaluation_criteria:
 *           type: string
 *         total_prize_pool:
 *           type: number
 *         max_participants:
 *           type: number
 *         winner_count:
 *           type: number
 *         reward_tiers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RewardTier'
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, ACTIVE, COMPLETED, CANCELLED, REJECTED]
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: Campaign start date
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: Campaign end date
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: Submission deadline
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns (basic - use /filter for advanced filtering)
 *     tags: [Campaigns]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, ACTIVE, COMPLETED, CANCELLED, REJECTED]
 *         description: Filter campaigns by status
 *     responses:
 *       200:
 *         description: List of campaigns
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 */
router.get('/', async (req, res) => {
    try {
        const result = await getAllCampaigns(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/campaigns/filter:
 *   get:
 *     summary: Get campaigns with advanced filtering
 *     tags: [Campaigns]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, ACTIVE, COMPLETED, CANCELLED, REJECTED]
 *         description: Filter by campaign status
 *       - in: query
 *         name: host_id
 *         schema:
 *           type: string
 *         description: Filter by host ID (campaigns created by this host)
 *       - in: query
 *         name: participant_id
 *         schema:
 *           type: string
 *         description: Filter by participant ID (campaigns this creator participates in)
 *       - in: query
 *         name: blockchain
 *         schema:
 *           type: string
 *         description: Filter by target blockchain
 *       - in: query
 *         name: min_prize_pool
 *         schema:
 *           type: number
 *         description: Minimum prize pool amount
 *       - in: query
 *         name: max_prize_pool
 *         schema:
 *           type: number
 *         description: Maximum prize pool amount
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter campaigns starting from this date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter campaigns ending before this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, description, and requirements
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter only currently active campaigns
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of campaigns per page
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, start_date, end_date, total_prize_pool, title]
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Filtered list of campaigns with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Campaign'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: number
 *                     total_pages:
 *                       type: number
 *                     total_campaigns:
 *                       type: number
 *                     campaigns_per_page:
 *                       type: number
 *                     has_next_page:
 *                       type: boolean
 *                     has_prev_page:
 *                       type: boolean
 */
router.get('/filter', async (req, res) => {
    try {
        const result = await getCampaignsWithFilters(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign found
 *       404:
 *         description: Campaign not found
 */
router.get('/:id', async (req, res) => {
    try {
        return await getCampaignById(req, res);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/campaigns/host/{hostId}:
 *   get:
 *     summary: Get campaigns created by a specific host
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: hostId
 *         required: true
 *         schema:
 *           type: string
 *         description: Host ID (HOST user who creates campaigns)
 *     responses:
 *       200:
 *         description: List of campaigns created by the host
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: Host not found
 */
router.get('/host/:hostId', async (req, res) => {
    try {
        const result = await getCampaignsByHost(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/campaigns/participant/{creatorId}:
 *   get:
 *     summary: Get campaigns where a creator participates
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: creatorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Creator ID (CREATOR user who participates in campaigns)
 *     responses:
 *       200:
 *         description: List of campaigns where the creator participates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: Creator not found
 */
router.get('/participant/:creatorId', async (req, res) => {
    try {
        const result = await getCampaignsByParticipant(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/campaigns/submissions/{creatorId}:
 *   get:
 *     summary: Get campaigns where a creator has submitted work
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: creatorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Creator ID (CREATOR user who has made submissions)
 *     responses:
 *       200:
 *         description: List of campaigns where the creator has submitted work, with submission details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Campaign'
 *                       - type: object
 *                         properties:
 *                           submission_count:
 *                             type: number
 *                             description: Number of submissions by this creator
 *                           latest_submission:
 *                             type: string
 *                             format: date-time
 *                             description: Date of latest submission
 *                           submission_status:
 *                             type: string
 *                             enum: [PENDING, APPROVED, REJECTED, UNDER_REVIEW]
 *                             description: Status of creator's submission
 *                           submission_score:
 *                             type: number
 *                             description: Score of creator's submission
 *                           my_submissions:
 *                             type: array
 *                             description: Creator's submissions for this campaign
 *                 total_campaigns:
 *                   type: number
 *                 total_submissions:
 *                   type: number
 *       404:
 *         description: Creator not found
 */
router.get('/submissions/:creatorId', async (req, res) => {
    try {
        const result = await getCampaignsWithSubmissions(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/campaigns/{campaignId}/leaderboard:
 *   get:
 *     summary: Get campaign leaderboard
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign leaderboard
 */
router.get('/:id/leaderboard', async (req, res) => {
    try {
        const result = await getLeaderboard(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create a new campaign (Host only)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - host_id
 *               - title
 *               - description
 *               - requirements
 *               - total_prize_pool
 *               - winner_count
 *               - start_date
 *               - end_date
 *               - deadline
 *             properties:
 *               host_id:
 *                 type: string
 *                 description: HOST user ID who creates the campaign
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               requirements:
 *                 type: string
 *               evaluation_criteria:
 *                 type: string
 *               total_prize_pool:
 *                 type: number
 *               max_participants:
 *                 type: number
 *               winner_count:
 *                 type: number
 *               reward_tiers:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/RewardTier'
 *                 description: Custom reward tier distribution (optional, defaults will be used)
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Campaign start date
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: Campaign end date
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 description: Submission deadline
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', async (req, res) => {
    try {
        const result = await createCampaign(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/campaigns/{campaignId}/join:
 *   post:
 *     summary: Join a campaign (Creator only)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - wallet_address
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: CREATOR user ID who wants to participate
 *               wallet_address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully joined campaign
 *       400:
 *         description: Invalid input or campaign full
 *       404:
 *         description: Campaign not found
 */
router.post('/:id/join', async (req, res) => {
    try {
        const result = await joinCampaign(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/campaigns/{campaignId}/leaderboard:
 *   post:
 *     summary: Set campaign leaderboard
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: campaignId
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
 *         description: Leaderboard set successfully
 */
router.post('/:id/leaderboard', async (req, res) => {
    try {
        return await setCampaignLeaderboard(req, res);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/campaigns/{id}:
 *   put:
 *     summary: Update campaign
 *     tags: [Campaigns]
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
 *             $ref: '#/components/schemas/Campaign'
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       404:
 *         description: Campaign not found
 */
router.put('/:id', async (req, res) => {
    try {
        const result = await editCampaign(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/campaigns/{id}:
 *   delete:
 *     summary: Delete campaign
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 *       404:
 *         description: Campaign not found
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await deleteCampaign(req);
        res.status(result.status).json(result.message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
