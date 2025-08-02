import type { ActionFunctionArgs, LoaderFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { db } from '~/lib/db/connection';
import { follows, users } from '~/lib/db/schema';
import { requireAuth } from '~/lib/middleware/auth';
import { rateLimit } from '~/lib/middleware/rate-limit';
import { createId } from 'uuidv7';
import { eq, and } from 'drizzle-orm';

const followRateLimit = rateLimit({
  maxRequests: 50,
  windowMs: 15 * 60 * 1000,
});

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const userId = params.id;
    
    if (!userId) {
      return json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    const followers = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        createdAt: follows.createdAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followeeId, userId))
      .orderBy(desc(follows.createdAt));

    const following = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        createdAt: follows.createdAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followeeId, users.id))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt));

    return json({
      followers,
      following,
      counts: {
        followers: followers.length,
        following: following.length,
      },
    });
  } catch (error) {
    console.error('Error fetching follow data:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const action = followRateLimit(
  requireAuth(async ({ request, params }) => {
    try {
      const targetUserId = params.id;
      const currentUser = (request as any).user;
      
      if (!targetUserId || !currentUser?.id) {
        return json({ error: 'User ID is required' }, { status: 400 });
      }

      if (targetUserId === currentUser.id) {
        return json({ error: 'Cannot follow yourself' }, { status: 400 });
      }

      // Check if target user exists
      const targetUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (targetUser.length === 0) {
        return json({ error: 'User not found' }, { status: 404 });
      }

      const method = request.method;

      if (method === 'POST') {
        // Check if already following
        const existingFollow = await db
          .select()
          .from(follows)
          .where(and(eq(follows.followerId, currentUser.id), eq(follows.followeeId, targetUserId)))
          .limit(1);

        if (existingFollow.length > 0) {
          return json({ error: 'Already following this user' }, { status: 400 });
        }

        await db.insert(follows).values({
          id: createId(),
          followerId: currentUser.id,
          followeeId: targetUserId,
          createdAt: new Date(),
        });

        return json({ message: 'Successfully followed user' }, { status: 201 });

      } else if (method === 'DELETE') {
        const deleted = await db
          .delete(follows)
          .where(and(eq(follows.followerId, currentUser.id), eq(follows.followeeId, targetUserId)));

        if (deleted.count === 0) {
          return json({ error: 'Not following this user' }, { status: 400 });
        }

        return json({ message: 'Successfully unfollowed user' });
      }

      return json({ error: 'Method not allowed' }, { status: 405 });

    } catch (error) {
      console.error('Error handling follow action:', error);
      return json({ error: 'Internal server error' }, { status: 500 });
    }
  })
);