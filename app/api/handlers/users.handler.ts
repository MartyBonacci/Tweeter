import type { ApiRequest, ApiResponse } from '../types';
import { findAllUsers } from '../../models/user';
import { findTweetsByUserId } from '../../models/tweet';
import { followUser, unfollowUser, isFollowing } from '../../models/follow';
import { AppError } from '../../utils/error.util';

/**
 * GET /api/users
 * List all users with optional search
 */
export async function handleGetUsers(req: ApiRequest): Promise<ApiResponse> {
  try {
    const limit = Math.min(Number(req.query.get('limit')) || 20, 100);
    const offset = Number(req.query.get('offset')) || 0;
    // TODO: Implement search functionality when user model supports it
    
    const users = await findAllUsers(limit, offset);
    
    return {
      status: 200,
      body: {
        users,
        pagination: {
          limit,
          offset,
          hasMore: users.length === limit,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      status: 500,
      body: { error: 'Failed to fetch users' },
    };
  }
}

/**
 * GET /api/users/:id/tweets
 * Get tweets by a specific user
 */
export async function handleGetUserTweets(req: ApiRequest): Promise<ApiResponse> {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      return {
        status: 400,
        body: { error: 'User ID is required' },
      };
    }
    
    const limit = Math.min(Number(req.query.get('limit')) || 20, 100);
    const offset = Number(req.query.get('offset')) || 0;
    
    const tweets = await findTweetsByUserId(userId, limit, offset);
    
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
    console.error('Error fetching user tweets:', error);
    return {
      status: 500,
      body: { error: 'Failed to fetch user tweets' },
    };
  }
}

/**
 * POST /api/users/:id/follow
 * Follow or unfollow a user
 */
export async function handleFollowUser(req: ApiRequest): Promise<ApiResponse> {
  try {
    const targetUserId = req.params.id;
    
    if (!targetUserId) {
      return {
        status: 400,
        body: { error: 'User ID is required' },
      };
    }
    
    if (!req.user) {
      return {
        status: 401,
        body: { error: 'Unauthorized' },
      };
    }
    
    // Can't follow yourself
    if (targetUserId === req.user.id) {
      return {
        status: 400,
        body: { error: 'Cannot follow yourself' },
      };
    }
    
    // Check if already following
    const alreadyFollowing = await isFollowing(req.user.id, targetUserId);
    
    if (alreadyFollowing) {
      await unfollowUser(req.user.id, targetUserId);
      return {
        status: 200,
        body: {
          message: 'User unfollowed successfully',
          following: false,
        },
      };
    } else {
      await followUser(req.user.id, targetUserId);
      return {
        status: 200,
        body: {
          message: 'User followed successfully',
          following: true,
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
    
    console.error('Error following/unfollowing user:', error);
    return {
      status: 500,
      body: { error: 'Failed to process follow action' },
    };
  }
}