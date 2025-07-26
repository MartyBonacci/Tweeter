import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { requireAuth } from '../lib/middleware';
import { db } from '../db/drizzle';
import { users, follows } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const username = params.username;

  if (!username) {
    return data({ error: 'Username is required' }, { status: 400 });
  }

  try {
    if (request.method === 'POST') {
      // Follow user
      const [targetUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!targetUser) {
        return data({ error: 'User not found' }, { status: 404 });
      }

      if (targetUser.id === user.userId) {
        return data({ error: 'Cannot follow yourself' }, { status: 400 });
      }

      // Check if already following
      const [existingFollow] = await db
        .select()
        .from(follows)
        .where(and(
          eq(follows.follower_id, user.userId),
          eq(follows.following_id, targetUser.id)
        ))
        .limit(1);

      if (existingFollow) {
        return data({ error: 'Already following' }, { status: 400 });
      }

      await db.insert(follows).values({
        follower_id: user.userId,
        following_id: targetUser.id,
      });

      return data({ success: true, action: 'followed' });
    }

    if (request.method === 'DELETE') {
      // Unfollow user
      const [targetUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!targetUser) {
        return data({ error: 'User not found' }, { status: 404 });
      }

      await db
        .delete(follows)
        .where(and(
          eq(follows.follower_id, user.userId),
          eq(follows.following_id, targetUser.id)
        ));

      return data({ success: true, action: 'unfollowed' });
    }

    return data({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Error in follow action:', error);
    return data({ error: 'Failed to process follow action' }, { status: 500 });
  }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const username = params.username;

  if (!username) {
    return data({ error: 'Username is required' }, { status: 400 });
  }

  try {
    const [targetUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!targetUser) {
      return data({ error: 'User not found' }, { status: 404 });
    }

    const [isFollowing] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.follower_id, user.userId),
        eq(follows.following_id, targetUser.id)
      ))
      .limit(1);

    return data({ isFollowing: !!isFollowing });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return data({ error: 'Failed to check follow status' }, { status: 500 });
  }
}