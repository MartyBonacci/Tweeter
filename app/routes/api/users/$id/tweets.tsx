import type { LoaderFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { db } from '~/lib/db/connection';
import { tweets, users } from '~/lib/db/schema';
import { rateLimit } from '~/lib/middleware/rate-limit';
import { eq, desc } from 'drizzle-orm';

const getUserTweetsRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
});

export const loader = getUserTweetsRateLimit(
  async ({ params, request }) => {
    try {
      const userId = params.id;
      
      if (!userId) {
        return json({ error: 'User ID is required' }, { status: 400 });
      }

      const url = new URL(request.url);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      const offset = parseInt(url.searchParams.get('offset') || '0');

      // First, check if user exists
      const userExists = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userExists.length === 0) {
        return json({ error: 'User not found' }, { status: 404 });
      }

      const userTweets = await db
        .select({
          id: tweets.id,
          content: tweets.content,
          createdAt: tweets.createdAt,
          updatedAt: tweets.updatedAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
          },
        })
        .from(tweets)
        .innerJoin(users, eq(tweets.userId, users.id))
        .where(eq(tweets.userId, userId))
        .orderBy(desc(tweets.createdAt))
        .limit(limit)
        .offset(offset);

      return json({
        tweets: userTweets,
        pagination: {
          limit,
          offset,
          hasMore: userTweets.length === limit,
        },
      });
    } catch (error) {
      console.error('Error fetching user tweets:', error);
      return json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);