import { db } from '~/lib/db/connection';
import { likes, tweets } from '~/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { AppError, NotFoundError } from '~/utils/error.util';
import {uuidv7} from "uuidv7";

export interface Like {
  id: string;
  userId: string;
  tweetId: string;
  createdAt: Date;
}

export async function likeTweet(tweetId: string, userId: string): Promise<{ message: string }> {
  // Check if tweet exists
  const tweet = await db
    .select({ id: tweets.id })
    .from(tweets)
    .where(eq(tweets.id, tweetId))
    .limit(1);

  if (tweet.length === 0) {
    throw new NotFoundError('Tweet');
  }

  // Check if already liked
  const existingLike = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.tweetId, tweetId)))
    .limit(1);

  if (existingLike.length > 0) {
    throw new AppError('Already liked this tweet', 400);
  }

  await db.insert(likes).values({
    id: uuidv7(),
    userId,
    tweetId,
    createdAt: new Date(),
  });

  return { message: 'Successfully liked tweet' };
}

export async function unlikeTweet(tweetId: string, userId: string): Promise<{ message: string }> {
  const result = await db
    .delete(likes)
    .where(and(eq(likes.userId, userId), eq(likes.tweetId, tweetId)));

  if (result.count === 0) {
    throw new AppError('Not liked this tweet', 400);
  }

  return { message: 'Successfully unliked tweet' };
}

export async function hasUserLikedTweet(tweetId: string, userId: string): Promise<boolean> {
  const like = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.tweetId, tweetId)))
    .limit(1);

  return like.length > 0;
}

export async function getTweetLikesCount(tweetId: string): Promise<number> {
  const result = await db
    .select({ count: likes.id })
    .from(likes)
    .where(eq(likes.tweetId, tweetId));

  return result[0]?.count || 0;
}

export async function getUserLikedTweets(userId: string, limit = 50, offset = 0): Promise<Like[]> {
  return await db
    .select()
    .from(likes)
    .where(eq(likes.userId, userId))
    .orderBy(likes.createdAt)
    .limit(limit)
    .offset(offset);
}