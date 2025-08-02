import type { ActionFunctionArgs, LoaderFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { z } from 'zod';
import { db } from '~/lib/db/connection';
import { tweets, users } from '~/lib/db/schema';
import { requireAuth } from '~/lib/middleware/auth';
import { rateLimit } from '~/lib/middleware/rate-limit';
import { sanitizeInput } from '~/lib/middleware/security';
import { createId } from 'uuidv7';
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

    const tweetsQuery = db
      .select({
        id: tweets.id,
        content: tweets.content,
        createdAt: tweets.createdAt,
        updatedAt: tweets.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.displayName,
        },
      })
      .from(tweets)
      .innerJoin(users, eq(tweets.userId, users.id))
      .orderBy(desc(tweets.createdAt))
      .limit(limit)
      .offset(offset);

    if (userId) {
      tweetsQuery.where(eq(tweets.userId, userId));
    }

    const allTweets = await tweetsQuery;

    return json({
      tweets: allTweets,
      pagination: {
        limit,
        offset,
        hasMore: allTweets.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching tweets:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const action = createTweetRateLimit(
  requireAuth(async ({ request }) => {
    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData);
      
      const validatedData = tweetSchema.parse({
        content: sanitizeInput(data.content || ''),
      });

      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
      
      // In a real app, we'd extract user from JWT token
      // For now, we'll use the authenticated user from the request
      const user = (request as any).user;
      
      if (!user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
      }

      const newTweet = await db.insert(tweets).values({
        id: createId(),
        userId: user.id,
        content: validatedData.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning({
        id: tweets.id,
        content: tweets.content,
        createdAt: tweets.createdAt,
        updatedAt: tweets.updatedAt,
      });

      return json({
        tweet: newTweet[0],
        message: 'Tweet created successfully',
      }, { status: 201 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      
      console.error('Error creating tweet:', error);
      return json({ error: 'Internal server error' }, { status: 500 });
    }
  })
);