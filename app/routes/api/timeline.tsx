import type { LoaderFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { db } from '~/lib/db/connection';
import { tweets, users, follows } from '~/lib/db/schema';
import { requireAuth } from '~/lib/middleware/auth';
import { rateLimit } from '~/lib/middleware/rate-limit';
import { desc, eq, inArray } from 'drizzle-orm';

const timelineRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
});

export const loader = timelineRateLimit(
  requireAuth(async ({ request }) => {
    try {
      const url = new URL(request.url);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const currentUser = (request as any).user;

      // Get IDs of users the current user is following
      const followingUsers = await db
        .select({ followeeId: follows.followeeId })
        .from(follows)
        .where(eq(follows.followerId, currentUser.id));

      const followingUserIds = [
        currentUser.id, // Include current user's own tweets
        ...followingUsers.map(f => f.followeeId)
      ];

      if (followingUserIds.length === 0) {
        return json({
          tweets: [],
          pagination: {
            limit,
            offset,
            hasMore: false,
          },
        });
      }

      const timelineTweets = await db
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
        .where(inArray(tweets.userId, followingUserIds))
        .orderBy(desc(tweets.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const totalCount = await db
        .select({ count: db.count() })
        .from(tweets)
        .where(inArray(tweets.userId, followingUserIds));

      return json({
        tweets: timelineTweets,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < totalCount[0].count,
          total: totalCount[0].count,
        },
      });

    } catch (error) {
      console.error('Error fetching timeline:', error);
      return json({ error: 'Internal server error' }, { status: 500 });
    }
  })
);