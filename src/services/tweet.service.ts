import { uuidv7 } from 'uuidv7';
import { sql } from './db.service.js';
import type { Tweet } from '../types/index.js';

/**
 * Create a new tweet
 * Pure function - returns created tweet
 */
export async function createTweet(
  userId: string,
  content: string
): Promise<Tweet> {
  const tweetId = uuidv7();

  const [tweet] = await sql<Tweet[]>`
    INSERT INTO tweets (id, user_id, content)
    VALUES (${tweetId}, ${userId}, ${content})
    RETURNING *
  `;

  return tweet;
}

/**
 * Get all tweets by user ID
 * Pure function - returns tweets in reverse chronological order
 */
export async function getTweetsByUserId(userId: string): Promise<Tweet[]> {
  const tweets = await sql<Tweet[]>`
    SELECT * FROM tweets
    WHERE user_id = ${userId}
    ORDER BY created_at DESC, id DESC
  `;

  return tweets;
}

/**
 * Get all tweets by username (for profile pages)
 * Pure function - returns tweets with username
 */
export async function getTweetsByUsername(
  username: string
): Promise<(Tweet & { username: string })[]> {
  const tweets = await sql<(Tweet & { username: string })[]>`
    SELECT t.*, u.username
    FROM tweets t
    JOIN users u ON u.id = t.user_id
    WHERE LOWER(u.username) = LOWER(${username})
    ORDER BY t.created_at DESC, t.id DESC
  `;

  return tweets;
}
