import type { LoaderFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { db } from '~/lib/db/connection';
import { users } from '~/lib/db/schema';
import { optionalAuth } from '~/lib/middleware/auth';
import { rateLimit } from '~/lib/middleware/rate-limit';
import { ilike, or } from 'drizzle-orm';

const getUsersRateLimit = rateLimit({
  maxRequests: 50,
  windowMs: 15 * 60 * 1000,
});

export const loader = getUsersRateLimit(
  optionalAuth(async ({ request }) => {
    try {
      const url = new URL(request.url);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const search = url.searchParams.get('search');

      let query = db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          bio: users.bio,
          createdAt: users.createdAt,
        })
        .from(users)
        .limit(limit)
        .offset(offset)
        .orderBy(users.createdAt);

      if (search) {
        query = query.where(
          or(
            ilike(users.username, `%${search}%`),
            ilike(users.name, `%${search}%`),
            ilike(users.bio, `%${search}%`)
          )
        );
      }

      const userList = await query;

      return json({
        users: userList,
        pagination: {
          limit,
          offset,
          hasMore: userList.length === limit,
        },
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return json({ error: 'Internal server error' }, { status: 500 });
    }
  })
);