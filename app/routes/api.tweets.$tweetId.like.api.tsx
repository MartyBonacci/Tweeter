import { data, type ActionFunctionArgs } from 'react-router';
import { requireAuth } from '../lib/middleware';
import { db } from '../db/drizzle';
import { likes, tweets } from '../db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const tweetId = params.tweetId;

  if (!tweetId) {
    return data({ error: 'Tweet ID is required' }, { status: 400 });
  }

  try {
    if (request.method === 'POST') {
      // Like tweet
      const [tweet] = await db
        .select({ id: tweets.id })
        .from(tweets)
        .where(eq(tweets.id, tweetId))
        .limit(1);

      if (!tweet) {
        return data({ error: 'Tweet not found' }, { status: 404 });
      }

      // Check if already liked
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(and(
          eq(likes.user_id, user.userId),
          eq(likes.tweet_id, tweetId)
        ))
        .limit(1);

      if (existingLike) {
        return data({ error: 'Already liked' }, { status: 400 });
      }

      await db.insert(likes).values({
        user_id: user.userId,
        tweet_id: tweetId,
      });

      // Get updated like count
      const [likeCount] = await db
        .select({ count: count() })
        .from(likes)
        .where(eq(likes.tweet_id, tweetId));

      return data({ 
        success: true, 
        action: 'liked',
        likeCount: Number(likeCount.count)
      });
    }

    if (request.method === 'DELETE') {
      // Unlike tweet
      await db
        .delete(likes)
        .where(and(
          eq(likes.user_id, user.userId),
          eq(likes.tweet_id, tweetId)
        ));

      // Get updated like count
      const [likeCount] = await db
        .select({ count: count() })
        .from(likes)
        .where(eq(likes.tweet_id, tweetId));

      return data({ 
        success: true, 
        action: 'unliked',
        likeCount: Number(likeCount.count)
      });
    }

    return data({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Error in like action:', error);
    return data({ error: 'Failed to process like action' }, { status: 500 });
  }
}

export async function loader({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const tweetId = params.tweetId;

  if (!tweetId) {
    return data({ error: 'Tweet ID is required' }, { status: 400 });
  }

  try {
    // Check if user has liked this tweet
    const [isLiked] = await db
      .select()
      .from(likes)
      .where(and(
        eq(likes.user_id, user.userId),
        eq(likes.tweet_id, tweetId)
      ))
      .limit(1);

    // Get total like count
    const [likeCount] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.tweet_id, tweetId));

    return data({ 
      isLiked: !!isLiked,
      likeCount: Number(likeCount.count)
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return data({ error: 'Failed to check like status' }, { status: 500 });
  }
}