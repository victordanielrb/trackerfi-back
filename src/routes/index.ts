import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import campaignRoutes from './campaigns';
import submissionRoutes from './submissions';
import walletRoutes from './wallets';
import leaderboardRoutes from './leaderboards';

const router = Router();

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/submissions', submissionRoutes);
router.use('/wallets', walletRoutes);
router.use('/leaderboards', leaderboardRoutes);

export default router;
