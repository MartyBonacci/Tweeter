import type { ApiRequest, ApiResponse } from '../types';
import { 
  findAllTweets, 
  findTweetsByUserId, 
  findTweetById, 
  createTweet, 
  updateTweet, 
  deleteTweet,
  getUserTimeline 
} from '../../models/tweet';
import { tweetSchema, tweetUpdateSchema } from '../../models/tweet/tweet.schema';
import { likeTweet, unlikeTweet, hasUserLikedTweet } from '../../models/like';
import { AppError } from '../../utils/error.util';

/**
 * GET /api/tweets
 * List all tweets with optional filtering
 */
export async function handleGetTweets(req: ApiRequest): Promise<ApiResponse> {
  try {
    const limit = Math.min(Number(req.query.get('limit')) || 20, 100);
    const offset = Number(req.query.get('offset')) || 0;
    const userId = req.query.get('userId');

    const tweets = userId
      ? await findTweetsByUserId(userId, limit, offset)
      : await findAllTweets(limit, offset);

    return {
      status: 200,
      body: {
        tweets,
        pagination: {
          limit,
          offset,
          hasMore: tweets.length === limit,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching tweets:', error);
    return {
      status: 500,
      body: { error: 'Failed to fetch tweets' },
    };
  }
}

/**
 * POST /api/tweets
 * Create a new tweet
 */
export async function handleCreateTweet(req: ApiRequest): Promise<ApiResponse> {
  try {
    // Validate input
    const validatedData = tweetSchema.parse(req.body);
    
    // User is guaranteed by auth middleware
    if (!req.user) {
      return {
        status: 401,
        body: { error: 'Unauthorized' },
      };
    }

    const tweet = await createTweet({
      ...validatedData,
      userId: req.user.id,
    });

    return {
      status: 201,
      body: {
        tweet,
        message: 'Tweet created successfully',
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        status: 400,
        body: { error: 'Invalid tweet data', details: error },
      };
    }
    
    console.error('Error creating tweet:', error);
    return {
      status: 500,
      body: { error: 'Failed to create tweet' },
    };
  }
}

/**
 * GET /api/tweets/:id
 * Get a single tweet by ID
 */
export async function handleGetTweetById(req: ApiRequest): Promise<ApiResponse> {
  try {
    const tweetId = req.params.id;
    
    if (!tweetId) {
      return {
        status: 400,
        body: { error: 'Tweet ID is required' },
      };
    }

    const tweet = await findTweetById(tweetId);

    if (!tweet) {
      return {
        status: 404,
        body: { error: 'Tweet not found' },
      };
    }

    return {
      status: 200,
      body: { tweet },
    };
  } catch (error) {
    console.error('Error fetching tweet:', error);
    return {
      status: 500,
      body: { error: 'Failed to fetch tweet' },
    };
  }
}

/**
 * PUT /api/tweets/:id
 * Update a tweet
 */
export async function handleUpdateTweet(req: ApiRequest): Promise<ApiResponse> {
  try {
    const tweetId = req.params.id;
    
    if (!tweetId) {
      return {
        status: 400,
        body: { error: 'Tweet ID is required' },
      };
    }

    if (!req.user) {
      return {
        status: 401,
        body: { error: 'Unauthorized' },
      };
    }

    // Validate input
    const validatedData = tweetUpdateSchema.parse(req.body);

    const updatedTweet = await updateTweet(tweetId, req.user.id, validatedData);

    return {
      status: 200,
      body: {
        tweet: updatedTweet,
        message: 'Tweet updated successfully',
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        status: error.statusCode || 400,
        body: { error: error.message },
      };
    }
    
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        status: 400,
        body: { error: 'Invalid tweet data', details: error },
      };
    }
    
    console.error('Error updating tweet:', error);
    return {
      status: 500,
      body: { error: 'Failed to update tweet' },
    };
  }
}

/**
 * DELETE /api/tweets/:id
 * Delete a tweet
 */
export async function handleDeleteTweet(req: ApiRequest): Promise<ApiResponse> {
  try {
    const tweetId = req.params.id;
    
    if (!tweetId) {
      return {
        status: 400,
        body: { error: 'Tweet ID is required' },
      };
    }

    if (!req.user) {
      return {
        status: 401,
        body: { error: 'Unauthorized' },
      };
    }

    await deleteTweet(tweetId, req.user.id);

    return {
      status: 200,
      body: { message: 'Tweet deleted successfully' },
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        status: error.statusCode || 400,
        body: { error: error.message },
      };
    }
    
    console.error('Error deleting tweet:', error);
    return {
      status: 500,
      body: { error: 'Failed to delete tweet' },
    };
  }
}

/**
 * POST /api/tweets/:id/like
 * Like or unlike a tweet
 */
export async function handleLikeTweet(req: ApiRequest): Promise<ApiResponse> {
  try {
    const tweetId = req.params.id;
    
    if (!tweetId) {
      return {
        status: 400,
        body: { error: 'Tweet ID is required' },
      };
    }

    if (!req.user) {
      return {
        status: 401,
        body: { error: 'Unauthorized' },
      };
    }

    // Check if already liked
    const isLiked = await hasUserLikedTweet(req.user.id, tweetId);
    
    if (isLiked) {
      await unlikeTweet(req.user.id, tweetId);
      return {
        status: 200,
        body: { 
          message: 'Tweet unliked successfully',
          liked: false 
        },
      };
    } else {
      await likeTweet(req.user.id, tweetId);
      return {
        status: 200,
        body: { 
          message: 'Tweet liked successfully',
          liked: true 
        },
      };
    }
  } catch (error) {
    if (error instanceof AppError) {
      return {
        status: error.statusCode || 400,
        body: { error: error.message },
      };
    }
    
    console.error('Error liking/unliking tweet:', error);
    return {
      status: 500,
      body: { error: 'Failed to process like action' },
    };
  }
}