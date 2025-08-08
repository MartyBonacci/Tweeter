import { db } from '~/lib/db/connection';
import { users, follows } from '~/lib/db/schema';
import { eq, count as countFn } from 'drizzle-orm';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  createdAt: Date;
  followersCount: number;
  followingCount: number;
}

export async function findUserById(id: string): Promise<User | null> {
  const user = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.displayName || '',
      createdAt: users.createdAt,
      followersCount: countFn(follows.id),
    })
    .from(users)
    .leftJoin(follows, eq(users.id, follows.followeeId))
    .where(eq(users.id, id))
    .groupBy(users.id)
    .limit(1);

  return user[0] || null;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const user = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.displayName || '',
      createdAt: users.createdAt,
      followersCount: countFn(follows.id),
    })
    .from(users)
    .leftJoin(follows, eq(users.id, follows.followeeId))
    .where(eq(users.username, username))
    .groupBy(users.id)
    .limit(1);

  return user[0] || null;
}

export async function findAllUsers(limit = 20, offset = 0): Promise<User[]> {
  return await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.displayName || '',
      createdAt: users.createdAt,
      followersCount: countFn(follows.id),
    })
    .from(users)
    .leftJoin(follows, eq(users.id, follows.followeeId))
    .groupBy(users.id)
    .orderBy(users.createdAt)
    .limit(limit)
    .offset(offset);
}

export async function getUserFollowersCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: countFn() })
    .from(follows)
    .where(eq(follows.followeeId, userId));

  return result[0]?.count || 0;
}

export async function getUserFollowingCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: countFn() })
    .from(follows)
    .where(eq(follows.followerId, userId));

  return result[0]?.count || 0;
}