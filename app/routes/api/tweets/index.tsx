import type { ActionFunctionArgs, LoaderFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { z } from 'zod';
import { db } from '~/lib/db/connection';
import { tweets, users } from '~/lib/db/schema';
import { requireAuth } from '~/lib/middleware/auth';
import { rateLimit } from '~/lib/middleware/rate-limit';
import { sanitizeInput } from '~/lib/middleware/security';
import { uuidv7 } from 'uuidv7';
import { desc, eq, and } from 'drizzle-orm';

const tweetSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content is required')
    .max(140, 'Tweet must be 140 characters or less'),
});

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
      ? await TweetService.findByUserId(userId, limit, offset)
      : await TweetService.findAll(limit, offset);

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

import { ResponseUtil } from '~/utils/response.util';
import { handleError } from '~/utils/error.util';
import { TweetService } from '~/services/tweet.service';
import { tweetSchema } from '~/validators/tweet.validator';

export const action = createTweetRateLimit(
  requireAuth(async ({ request }) => {
    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData);
      
      const validatedData = tweetSchema.parse({
        content: sanitizeInput(data.content || ''),
      });

      const user = (request as any).user;
      if (!user?.id) {
        return ResponseUtil.unauthorized();
      }

      const tweet = await TweetService.create({
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