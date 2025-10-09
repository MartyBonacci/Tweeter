import { Router } from 'express';
import authRoutes from './auth.js';
import profileRoutes from './profiles.js';
import tweetRoutes from './tweets.js';

const router = Router();

// Register auth routes
router.use('/auth', authRoutes);

// Register profile routes
router.use('/profiles', profileRoutes);

// Register tweet routes
router.use('/tweets', tweetRoutes);

export default router;
