import { uuidv7 } from 'uuidv7';
import { sql } from './db.service.js';
import type { Like, LikeData } from '../types/index.js';

/**
 * Create a new like (idempotent - returns existing if duplicate)
 * Pure function - returns created or existing like
 */
export async function createLike(
  userId: string,
  tweetId: string
): Promise<Like> {
  const likeId = uuidv7();

  const [like] = await sql<Like[]>`
    INSERT INTO likes (id, user_id, tweet_id)
    VALUES (${likeId}, ${userId}, ${tweetId})
    ON CONFLICT (user_id, tweet_id) DO NOTHING
    RETURNING *
  `;

  // If conflict occurred (duplicate like), fetch existing
  if (!like) {
    const [existing] = await sql<Like[]>`
      SELECT * FROM likes
      WHERE user_id = ${userId} AND tweet_id = ${tweetId}
    `;
    return existing;
  }

  return like;
}

/**
 * Delete a like (idempotent - silent if doesn't exist)
 * Pure function - void return
 */
export async function deleteLike(
  userId: string,
  tweetId: string
): Promise<void> {
  await sql`
    DELETE FROM likes
    WHERE user_id = ${userId} AND tweet_id = ${tweetId}
  `;
  // Silent if like doesn't exist (idempotent)
}

/**
 * Get like count for a tweet
 * Pure function - returns count
 */
export async function getLikeCount(tweetId: string): Promise<number> {
  const [result] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int as count
    FROM likes
    WHERE tweet_id = ${tweetId}
  `;
  return result.count;
}

/**
 * Check if user has liked a tweet
 * Pure function - returns boolean
 */
export async function checkUserLiked(
  userId: string,
  tweetId: string
): Promise<boolean> {
  const [result] = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM likes
      WHERE user_id = ${userId} AND tweet_id = ${tweetId}
    ) as exists
  `;
  return result.exists;
}

/**
 * Get like data for multiple tweets (batch query)
 * Pure function - returns array of like data
 */
export async function getLikesByTweetIds(
  tweetIds: string[],
  userId?: string
): Promise<LikeData[]> {
  if (tweetIds.length === 0) {
    return [];
  }

  // Query likes for all tweet IDs
  const results = await sql<
    Array<{ tweetId: string; count: number; userLiked: number }>
  >`
    SELECT
      tweet_id,
      COUNT(*)::int as count,
      ${userId
        ? sql`MAX(CASE WHEN user_id = ${userId} THEN 1 ELSE 0 END)`
        : sql`0`
      }::int as user_liked
    FROM likes
    WHERE tweet_id IN ${sql(tweetIds)}
    GROUP BY tweet_id
  `;

  // Map results to include tweets with 0 likes
  return tweetIds.map((tweetId) => {
    const result = results.find((r) => r.tweetId === tweetId);
    return {
      tweetId,
      count: result?.count || 0,
      userLiked: result?.userLiked === 1,
    };
  });
}
