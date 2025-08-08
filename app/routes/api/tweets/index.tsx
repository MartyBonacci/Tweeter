import type { ActionFunctionArgs, LoaderFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import type { AuthenticatedRequest } from '~/lib/middleware/auth';
import { requireAuth } from '~/lib/middleware/auth';
import { rateLimit } from '~/lib/middleware/rate-limit';
import { sanitizeInput } from '~/lib/middleware/security';
import { ResponseUtil } from '~/utils/response.util';
import { handleError } from '~/utils/error.util';
import { findTweetsByUserId, findAllTweets, createTweet } from '~/models/tweet/tweet.model';
import { tweetSchema } from '~/models/tweet/tweet.validator';

// Rate limiting: 10 tweets per 15 minutes
const createTweetRateLimit = rateLimit({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (request) => {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    return `tweet_create_${token}`;
  },
});

// Rate limiting: 100 requests per 15 minutes
const listTweetsRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const userId = url.searchParams.get('userId');

    const tweets = userId
      ? await findTweetsByUserId(userId, limit, offset)
      : await findAllTweets(limit, offset);

    return ResponseUtil.success({
      tweets,
      pagination: {
        limit,
        offset,
        hasMore: tweets.length === limit,
      },
    });
  } catch (error) {
    const appError = handleError(error);
    return ResponseUtil.error(appError.message, appError.statusCode);
  }
}

export const action = createTweetRateLimit(
  requireAuth(async ({ request }: ActionFunctionArgs & { request: AuthenticatedRequest }) => {
    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData);
      
      const validatedData = tweetSchema.parse({
        content: sanitizeInput(data.content || ''),
      });

      const user = request.user!; // Safe because requireAuth ensures user exists

      const tweet = await createTweet({
        ...validatedData,
        userId: user.id,
      });

      return ResponseUtil.created({
        tweet,
        message: 'Tweet created successfully',
      });

    } catch (error) {
      const appError = handleError(error);
      return ResponseUtil.error(appError.message, appError.statusCode, appError.details);
    }
  })
);