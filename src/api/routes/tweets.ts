import { Router } from 'express';
import { TweetSchema } from '../../schemas/tweet.schema.js';
import {
  createTweet,
  getTweetsByUserId,
} from '../../services/tweet.service.js';
import {
  createLike,
  deleteLike,
  getLikeCount,
  checkUserLiked,
} from '../../services/like.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

/**
 * POST /api/tweets
 * Create a new tweet (requires authentication)
 */
router.post('/', requireAuth, validate(TweetSchema), async (req, res, next) => {
  try {
    const { content } = req.body;
    const userId = req.session.userId!;

    const tweet = await createTweet(userId, content);

    res.status(201).json({ tweet });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tweets/user/:userId
 * Get all tweets by user (public, no auth required)
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const tweets = await getTweetsByUserId(userId);

    res.status(200).json({
      tweets,
      count: tweets.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tweets/:tweetId/like
 * Like a tweet (requires authentication)
 */
router.post('/:tweetId/like', requireAuth, async (req, res, next) => {
  try {
    const { tweetId } = req.params;
    const userId = req.session.userId!;

    const like = await createLike(userId, tweetId);

    res.status(201).json({ like });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tweets/:tweetId/like
 * Unlike a tweet (requires authentication)
 */
router.delete('/:tweetId/like', requireAuth, async (req, res, next) => {
  try {
    const { tweetId } = req.params;
    const userId = req.session.userId!;

    await deleteLike(userId, tweetId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tweets/:tweetId/likes
 * Get like count and user's like status (public)
 */
router.get('/:tweetId/likes', async (req, res, next) => {
  try {
    const { tweetId } = req.params;
    const userId = req.session?.userId;

    const count = await getLikeCount(tweetId);
    const userLiked = userId ? await checkUserLiked(userId, tweetId) : false;

    res.status(200).json({ tweetId, count, userLiked });
  } catch (error) {
    next(error);
  }
});

export default router;
