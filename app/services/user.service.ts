import { db } from '~/lib/db/connection';
import { users, follows } from '~/lib/db/schema';
import { eq, count as countFn } from 'drizzle-orm';
import { AppError, NotFoundError } from '~/utils/error.util';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  createdAt: Date;
  followersCount: number;
  followingCount: number;
}

export class UserService {
  static async findById(id: string): Promise<User | null> {
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.displayName,
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

  static async findByUsername(username: string): Promise<User | null> {
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.displayName,
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

  static async findAll(limit = 20, offset = 0): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.displayName,
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

  static async getFollowersCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: countFn() })
      .from(follows)
      .where(eq(follows.followeeId, userId));

    return result[0]?.count || 0;
  }

  static async getFollowingCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: countFn() })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return result[0]?.count || 0;
  }
}