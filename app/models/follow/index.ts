import { db } from '~/lib/db/connection';
import { follows } from '~/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { AppError } from '~/utils/error.util';

export async function followUser(followerId: string, followeeId: string): Promise<void> {
  try {
    await db.insert(follows).values({
      id: uuidv7(),
      followerId,
      followeeId,
      createdAt: new Date(),
    });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error?.code === '23505') {
      throw new AppError('Already following this user', 400);
    }
    throw error;
  }
}

export async function unfollowUser(followerId: string, followeeId: string): Promise<void> {
  const result = await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
  
  // @ts-ignore - drizzle doesn't type the result properly
  if (result.rowCount === 0) {
    throw new AppError('Not following this user', 400);
  }
}

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)))
    .limit(1);
  
  return result.length > 0;
}

export async function getFollowers(userId: string, limit = 20, offset = 0): Promise<string[]> {
  const result = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(eq(follows.followeeId, userId))
    .limit(limit)
    .offset(offset);
  
  return result.map(r => r.followerId);
}

export async function getFollowing(userId: string, limit = 20, offset = 0): Promise<string[]> {
  const result = await db
    .select({ followeeId: follows.followeeId })
    .from(follows)
    .where(eq(follows.followerId, userId))
    .limit(limit)
    .offset(offset);
  
  return result.map(r => r.followeeId);
}