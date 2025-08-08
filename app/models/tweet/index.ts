import { db } from '~/lib/db/connection';
import { tweets, users, likes } from '~/lib/db/schema';
import { eq, desc, count as countFn } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { AppError, NotFoundError } from '~/utils/error.util';
import type { TweetData, TweetUpdateData } from '~/models/tweet/tweet.schema';

export interface Tweet {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
  likeCount: number;
  isLiked?: boolean;
}

export interface CreateTweetData extends TweetData {
  userId: string;
}

export async function createTweet(data: CreateTweetData): Promise<Tweet> {
  const newTweet = await db
    .insert(tweets)
    .values({
      id: uuidv7(),
      userId: data.userId,
      content: data.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  const tweetWithUser = await findTweetById(newTweet[0].id);
  if (!tweetWithUser) {
    throw new AppError('Failed to create tweet');
  }

  return tweetWithUser;
}

export async function findTweetById(id: string): Promise<Tweet | null> {
  const tweet = await db
    .select({
      id: tweets.id,
      content: tweets.content,
      createdAt: tweets.createdAt,
      updatedAt: tweets.updatedAt,
      userId: tweets.userId,
      user: {
        id: users.id,
        username: users.username,
        name: users.displayName || '',
      },
      likeCount: countFn(likes.id),
    })
    .from(tweets)
    .innerJoin(users, eq(tweets.userId, users.id))
    .leftJoin(likes, eq(tweets.id, likes.tweetId))
    .where(eq(tweets.id, id))
    .groupBy(tweets.id, users.id)
    .limit(1);

  return tweet[0] || null;
}

export async function findTweetsByUserId(userId: string, limit = 20, offset = 0): Promise<Tweet[]> {
  return db
    .select({
      id: tweets.id,
      content: tweets.content,
      createdAt: tweets.createdAt,
      updatedAt: tweets.updatedAt,
      userId: tweets.userId,
      user: {
        id: users.id,
        username: users.username,
        name: users.displayName || '',
      },
      likeCount: countFn(likes.id),
    })
    .from(tweets)
    .innerJoin(users, eq(tweets.userId, users.id))
    .leftJoin(likes, eq(tweets.id, likes.tweetId))
    .where(eq(tweets.userId, userId))
    .groupBy(tweets.id, users.id)
    .orderBy(desc(tweets.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function findAllTweets(limit = 20, offset = 0): Promise<Tweet[]> {
  return db
    .select({
      id: tweets.id,
      content: tweets.content,
      createdAt: tweets.createdAt,
      updatedAt: tweets.updatedAt,
      userId: tweets.userId,
      user: {
        id: users.id,
        username: users.username,
        name: users.displayName || '',
      },
      likeCount: countFn(likes.id),
    })
    .from(tweets)
    .innerJoin(users, eq(tweets.userId, users.id))
    .leftJoin(likes, eq(tweets.id, likes.tweetId))
    .groupBy(tweets.id, users.id)
    .orderBy(desc(tweets.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateTweet(id: string, userId: string, data: TweetUpdateData): Promise<Tweet> {
  const tweet = await findTweetById(id);
  if (!tweet) {
    throw new NotFoundError('Tweet');
  }

  if (tweet.userId !== userId) {
    throw new AppError('Unauthorized to update this tweet', 403);
  }

  const updatedTweet = await db
    .update(tweets)
    .set({ content: data.content, updatedAt: new Date() })
    .where(eq(tweets.id, id))
    .returning();

  const tweetWithUser = await findTweetById(updatedTweet[0].id);
  if (!tweetWithUser) {
    throw new AppError('Failed to update tweet');
  }

  return tweetWithUser;
}

export async function deleteTweet(id: string, userId: string): Promise<void> {
  const tweet = await findTweetById(id);
  if (!tweet) {
    throw new NotFoundError('Tweet');
  }

  if (tweet.userId !== userId) {
    throw new AppError('Unauthorized to delete this tweet', 403);
  }

  await db.delete(tweets).where(eq(tweets.id, id));
}

export async function getUserTimeline(userId: string, limit = 20, offset = 0): Promise<Tweet[]> {
  // For now, return all tweets. In future, implement following-based timeline
  return await findAllTweets(limit, offset);
}

export async function getTweetLikeCount(tweetId: string): Promise<number> {
  const result = await db
    .select({ count: countFn() })
    .from(likes)
    .where(eq(likes.tweetId, tweetId));

  return result[0]?.count || 0;
}