import { data, type LoaderFunctionArgs } from 'react-router';
import { requireAuth } from '../lib/middleware';
import { db } from '../db/drizzle';
import { tweets } from '../db/schema/tweets';
import { users } from '../db/schema/users';
import { follows } from '../db/schema/follows';
import { likes } from '../db/schema/likes';
import { desc, eq, inArray, count } from 'drizzle-orm';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  
  const url = new URL(request.url);
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT)),
    MAX_LIMIT
  );
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const filter = url.searchParams.get('filter') || 'all';

  try {
    if (filter === 'following') {
      // Get tweets from users that the current user follows
      const followingUsers = await db
        .select({ followingId: follows.following_id })
        .from(follows)
        .where(eq(follows.follower_id, user.userId));

      const followingIds = followingUsers.map(f => f.followingId);
      
      if (followingIds.length === 0) {
        return data({ tweets: [] });
      }

      const tweetsWithUsers = await db
        .select({
          tweet: tweets,
          user: {
            id: users.id,
            username: users.username,
            displayName: users.display_name,
          },
        })
        .from(tweets)
        .innerJoin(users, eq(tweets.user_id, users.id))
        .where(inArray(tweets.user_id, followingIds))
        .orderBy(desc(tweets.created_at))
        .limit(limit)
        .offset(offset);

      // Get like counts for each tweet
      const tweetIds = tweetsWithUsers.map(t => t.tweet.id);
      const tweetLikes = await db
        .select({
          tweet_id: likes.tweet_id,
          likeCount: count(likes.user_id)
        })
        .from(likes)
        .where(inArray(likes.tweet_id, tweetIds))
        .groupBy(likes.tweet_id);

      const likesMap = new Map(tweetLikes.map(l => [l.tweet_id, l.likeCount]));

      const tweetsWithLikes = tweetsWithUsers.map(({ tweet, user }) => ({
        tweet,
        user,
        likeCount: likesMap.get(tweet.id) || 0
      }));

      return data({ tweets: tweetsWithLikes });
    } else {
      // Get all tweets (default behavior)
      const tweetsWithUsers = await db
        .select({
          tweet: tweets,
          user: {
            id: users.id,
            username: users.username,
            displayName: users.display_name,
          },
        })
        .from(tweets)
        .innerJoin(users, eq(tweets.user_id, users.id))
        .orderBy(desc(tweets.created_at))
        .limit(limit)
        .offset(offset);

      // Get like counts for each tweet
      const tweetIds = tweetsWithUsers.map(t => t.tweet.id);
      const tweetLikes = await db
        .select({
          tweet_id: likes.tweet_id,
          likeCount: count(likes.user_id)
        })
        .from(likes)
        .where(inArray(likes.tweet_id, tweetIds))
        .groupBy(likes.tweet_id);

      const likesMap = new Map(tweetLikes.map(l => [l.tweet_id, l.likeCount]));

      const tweetsWithLikes = tweetsWithUsers.map(({ tweet, user }) => ({
        tweet,
        user,
        likeCount: likesMap.get(tweet.id) || 0
      }));

      return data({ tweets: tweetsWithLikes });
    }
  } catch (error) {
    console.error('Error fetching tweets:', error);
    return data({ error: 'Failed to fetch tweets' }, { status: 500 });
  }
}