import { data, type LoaderFunctionArgs } from 'react-router';
import { db } from '../db/drizzle';
import { users, tweets, follows, likes } from '../db/schema';
import { eq, desc, count, inArray } from 'drizzle-orm';

export async function loader({ params }: LoaderFunctionArgs) {
  const username = params.username;

  if (!username) {
    return data({ error: 'Username is required' }, { status: 400 });
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.display_name,
        bio: users.bio,
        avatar: users.avatar_url,
        createdAt: users.created_at,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return data({ error: 'User not found' }, { status: 404 });
    }

    const [tweetCount] = await db
      .select({ count: count() })
      .from(tweets)
      .where(eq(tweets.user_id, user.id));

    const [followingCount] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.follower_id, user.id));

    const [followersCount] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.following_id, user.id));

    const userTweets = await db
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
      .where(eq(tweets.user_id, user.id))
      .orderBy(desc(tweets.created_at))
      .limit(50);

    // Get like counts for each tweet
    const tweetIds = userTweets.map(t => t.tweet.id);
    const tweetLikes = await db
      .select({
        tweet_id: likes.tweet_id,
        likeCount: count(likes.user_id)
      })
      .from(likes)
      .where(inArray(likes.tweet_id, tweetIds))
      .groupBy(likes.tweet_id);

    const likesMap = new Map(tweetLikes.map(l => [l.tweet_id, l.likeCount]));

    const tweetsWithLikes = userTweets.map(({ tweet, user }) => ({
      tweet,
      user,
      likeCount: likesMap.get(tweet.id) || 0
    }));

    return data({
      user,
      tweets: tweetsWithLikes,
      tweetCount: tweetCount.count,
      followingCount: followingCount.count,
      followersCount: followersCount.count,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return data({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}