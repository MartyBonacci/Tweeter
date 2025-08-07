import type { ActionFunctionArgs, LoaderFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { db } from '~/lib/db/connection';
import { likes, tweets, users } from '~/lib/db/schema';
import { requireAuth } from '~/lib/middleware/auth';
import { rateLimit } from '~/lib/middleware/rate-limit';
import { uuidv7 } from 'uuidv7';
import { eq, and, desc } from 'drizzle-orm';

const likeRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
});

import { ResponseUtil } from '~/utils/response.util';
import { handleError } from '~/utils/error.util';
import { TweetService } from '~/services/tweet.service';
import { LikeService } from '~/services/like.service';

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const tweetId = params.id;
    
    if (!tweetId) {
      return ResponseUtil.error('Tweet ID is required', 400);
    }

    // Check if tweet exists
    const tweet = await TweetService.findById(tweetId);
    if (!tweet) {
      return ResponseUtil.notFound('Tweet');
    }

    const count = await LikeService.getLikesCount(tweetId);

    return ResponseUtil.success({
      count,
      tweet: {
        id: tweet.id,
        content: tweet.content,
        user: tweet.user,
      },
    });
  } catch (error) {
    const appError = handleError(error);
    return ResponseUtil.error(appError.message, appError.statusCode);
  }
}

export const action = likeRateLimit(
  requireAuth(async ({ request, params }) => {
    try {
      const tweetId = params.id;
      const user = (request as any).user;
      
      if (!tweetId || !user?.id) {
        return ResponseUtil.error('Tweet ID is required', 400);
      }

      const method = request.method;

      if (method === 'POST') {
        const result = await LikeService.like(tweetId, user.id);
        return ResponseUtil.created(result);

      } else if (method === 'DELETE') {
        const result = await LikeService.unlike(tweetId, user.id);
        return ResponseUtil.success(result);
      }

      return ResponseUtil.error('Method not allowed', 405);

    } catch (error) {
      const appError = handleError(error);
      return ResponseUtil.error(appError.message, appError.statusCode);
    }
  })
);