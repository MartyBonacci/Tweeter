import type { ActionFunctionArgs, LoaderFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { db } from '~/lib/db/connection';
import { likes, tweets, users } from '~/lib/db/schema';
import { requireAuth } from '~/lib/middleware/auth';
import { rateLimit } from '~/lib/middleware/rate-limit';
import { createId } from 'uuidv7';
import { eq, and, desc } from 'drizzle-orm';

const likeRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
});

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const tweetId = params.id;
    
    if (!tweetId) {
      return json({ error: 'Tweet ID is required' }, { status: 400 });
    }

    // Check if tweet exists
    const tweetExists = await db
      .select({ id: tweets.id })
      .from(tweets)
      .where(eq(tweets.id, tweetId))
      .limit(1);

    if (tweetExists.length === 0) {
      return json({ error: 'Tweet not found' }, { status: 404 });
    }

    const likers = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        createdAt: likes.createdAt,
      })
      .from(likes)
      .innerJoin(users, eq(likes.userId, users.id))
      .where(eq(likes.tweetId, tweetId))
      .orderBy(desc(likes.createdAt));

    return json({
      likers,
      count: likers.length,
    });
  } catch (error) {
    console.error('Error fetching tweet likes:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const action = likeRateLimit(
  requireAuth(async ({ request, params }) => {
    try {
      const tweetId = params.id;
      const currentUser = (request as any).user;
      
      if (!tweetId || !currentUser?.id) {
        return json({ error: 'Tweet ID is required' }, { status: 400 });
      }

      // Check if tweet exists
      const tweetExists = await db
        .select({ id: tweets.id })
        .from(tweets)
        .where(eq(tweets.id, tweetId))
        .limit(1);

      if (tweetExists.length === 0) {
        return json({ error: 'Tweet not found' }, { status: 404 });
      }

      const method = request.method;

      if (method === 'POST') {
        // Check if already liked
        const existingLike = await db
          .select()
          .from(likes)
          .where(and(eq(likes.userId, currentUser.id), eq(likes.tweetId, tweetId)))
          .limit(1);

        if (existingLike.length > 0) {
          return json({ error: 'Already liked this tweet' }, { status: 400 });
        }

        await db.insert(likes).values({
          id: createId(),
          userId: currentUser.id,
          tweetId: tweetId,
          createdAt: new Date(),
        });

        return json({ message: 'Successfully liked tweet' }, { status: 201 });

      } else if (method === 'DELETE') {
        const deleted = await db
          .delete(likes)
          .where(and(eq(likes.userId, currentUser.id), eq(likes.tweetId, tweetId)));

        if (deleted.count === 0) {
          return json({ error: 'Not liked this tweet' }, { status: 400 });
        }

        return json({ message: 'Successfully unliked tweet' });
      }

      return json({ error: 'Method not allowed' }, { status: 405 });

    } catch (error) {
      console.error('Error handling like action:', error);
      return json({ error: 'Internal server error' }, { status: 500 });
    }
  })
);