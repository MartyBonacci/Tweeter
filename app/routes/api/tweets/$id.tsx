import type { LoaderFunctionArgs, ActionFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { z } from 'zod';
import { db } from '~/lib/db/connection';
import { tweets, users } from '~/lib/db/schema';
import { requireAuth } from '~/lib/middleware/auth';
import { sanitizeInput } from '~/lib/middleware/security';
import { eq, and } from 'drizzle-orm';

const updateTweetSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content is required')
    .max(140, 'Tweet must be 140 characters or less'),
});

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const tweetId = params.id;
    
    if (!tweetId) {
      return json({ error: 'Tweet ID is required' }, { status: 400 });
    }

    const tweet = await db
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
      .where(eq(tweets.id, tweetId))
      .limit(1);

    if (tweet.length === 0) {
      return json({ error: 'Tweet not found' }, { status: 404 });
    }

    return json({ tweet: tweet[0] });
  } catch (error) {
    console.error('Error fetching tweet:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const action = requireAuth(async ({ request, params }) => {
  try {
    const tweetId = params.id;
    
    if (!tweetId) {
      return json({ error: 'Tweet ID is required' }, { status: 400 });
    }

    const user = (request as any).user;
    
    if (!user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const method = request.method;

    if (method === 'PUT') {
      const formData = await request.formData();
      const data = Object.fromEntries(formData);
      
      const validatedData = updateTweetSchema.parse({
        content: sanitizeInput(data.content || ''),
      });

      // Verify ownership
      const existingTweet = await db
        .select()
        .from(tweets)
        .where(and(eq(tweets.id, tweetId), eq(tweets.userId, user.id)))
        .limit(1);

      if (existingTweet.length === 0) {
        return json({ error: 'Tweet not found or unauthorized' }, { status: 404 });
      }

      const updatedTweet = await db
        .update(tweets)
        .set({
          content: validatedData.content,
          updatedAt: new Date(),
        })
        .where(and(eq(tweets.id, tweetId), eq(tweets.userId, user.id)))
        .returning({
          id: tweets.id,
          content: tweets.content,
          createdAt: tweets.createdAt,
          updatedAt: tweets.updatedAt,
        });

      return json({
        tweet: updatedTweet[0],
        message: 'Tweet updated successfully',
      });

    } else if (method === 'DELETE') {
      // Verify ownership
      const existingTweet = await db
        .select()
        .from(tweets)
        .where(and(eq(tweets.id, tweetId), eq(tweets.userId, user.id)))
        .limit(1);

      if (existingTweet.length === 0) {
        return json({ error: 'Tweet not found or unauthorized' }, { status: 404 });
      }

      await db
        .delete(tweets)
        .where(and(eq(tweets.id, tweetId), eq(tweets.userId, user.id)));

      return json({ message: 'Tweet deleted successfully' });
    }

    return json({ error: 'Method not allowed' }, { status: 405 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error handling tweet:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
});