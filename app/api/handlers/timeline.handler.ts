import type { ApiRequest, ApiResponse } from '../types';
import { getUserTimeline } from '../../models/tweet';

/**
 * GET /api/timeline
 * Get the authenticated user's timeline
 */
export async function handleGetTimeline(req: ApiRequest): Promise<ApiResponse> {
  try {
    if (!req.user) {
      return {
        status: 401,
        body: { error: 'Unauthorized' },
      };
    }
    
    const limit = Math.min(Number(req.query.get('limit')) || 20, 100);
    const offset = Number(req.query.get('offset')) || 0;
    
    // Get timeline tweets (currently returns all tweets, but could be filtered by following in the future)
    const tweets = await getUserTimeline(req.user.id, limit, offset);
    
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
    console.error('Error fetching timeline:', error);
    return {
      status: 500,
      body: { error: 'Failed to fetch timeline' },
    };
  }
}