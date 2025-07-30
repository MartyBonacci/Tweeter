import { type LoaderFunctionArgs } from "react-router";
import { db } from '../db/drizzle';
import { users, tweets } from '../db/schema';
import { or, ilike, sql, eq } from 'drizzle-orm';
import { verifyToken } from '../lib/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userPayload;
    
    try {
      userPayload = verifyToken(token);
    } catch (error) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const type = url.searchParams.get('type') || 'all'; // 'users', 'tweets', 'hashtags', 'all'
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

    if (!query || query.trim().length === 0) {
      return Response.json({ error: 'Search query is required' }, { status: 400 });
    }

    const searchTerm = query.trim();
    const results: any = {
      query: searchTerm,
      users: [],
      tweets: [],
      hashtags: []
    };

    // Search users by username or display name
    if (type === 'all' || type === 'users') {
      const userResults = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.display_name,
          bio: users.bio,
          avatar: users.avatar_url,
          verified: users.email_verified
        })
        .from(users)
        .where(
          or(
            ilike(users.username, `%${searchTerm}%`),
            ilike(users.display_name, `%${searchTerm}%`)
          )
        )
        .limit(limit);

      results.users = userResults.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        bio: user.bio,
        avatar: user.avatar,
        verified: user.verified
      }));
    }

    // Search tweets by content
    if (type === 'all' || type === 'tweets') {
      const tweetResults = await db
        .select({
          tweet: {
            id: tweets.id,
            content: tweets.content,
            created_at: tweets.created_at,
            user_id: tweets.user_id
          },
          user: {
            id: users.id,
            username: users.username,
            displayName: users.display_name,
            avatar: users.avatar_url
          }
        })
        .from(tweets)
        .innerJoin(users, eq(tweets.user_id, users.id))
        .where(ilike(tweets.content, `%${searchTerm}%`))
        .orderBy(sql`${tweets.created_at} DESC`)
        .limit(limit);

      results.tweets = tweetResults.map(({ tweet, user }) => ({
        id: tweet.id,
        content: tweet.content,
        created_at: tweet.created_at,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          avatar: user.avatar
        }
      }));
    }

    // Extract hashtags from search query and find related tweets
    if (type === 'all' || type === 'hashtags') {
      // If search term starts with #, search for hashtags in tweets
      if (searchTerm.startsWith('#')) {
        const hashtag = searchTerm.substring(1);
        const hashtagResults = await db
          .select({
            tweet: {
              id: tweets.id,
              content: tweets.content,
              created_at: tweets.created_at,
              user_id: tweets.user_id
            },
            user: {
              id: users.id,
              username: users.username,
              displayName: users.display_name,
              avatar: users.avatar_url
            }
          })
          .from(tweets)
          .innerJoin(users, eq(tweets.user_id, users.id))
          .where(ilike(tweets.content, `%#${hashtag}%`))
          .orderBy(sql`${tweets.created_at} DESC`)
          .limit(limit);

        results.hashtags = [{
          tag: hashtag,
          count: hashtagResults.length,
          tweets: hashtagResults.map(({ tweet, user }) => ({
            id: tweet.id,
            content: tweet.content,
            created_at: tweet.created_at,
            user: {
              id: user.id,
              username: user.username,
              displayName: user.displayName || user.username,
              avatar: user.avatar
            }
          }))
        }];
      } else {
        // Find hashtags in tweets that contain the search term
        const hashtagTweets = await db
          .select({
            content: tweets.content
          })
          .from(tweets)
          .where(ilike(tweets.content, `%${searchTerm}%`))
          .limit(100); // Get more tweets to extract hashtags from

        const hashtagCounts: { [key: string]: number } = {};
        
        hashtagTweets.forEach(tweet => {
          const hashtags = tweet.content.match(/#\w+/g);
          if (hashtags) {
            hashtags.forEach(tag => {
              const cleanTag = tag.substring(1).toLowerCase();
              if (cleanTag.includes(searchTerm.toLowerCase())) {
                hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
              }
            });
          }
        });

        results.hashtags = Object.entries(hashtagCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([tag, count]) => ({
            tag,
            count,
            tweets: [] // Would need another query to get actual tweets
          }));
      }
    }

    return Response.json(results);

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: 'Search failed' }, { status: 500 });
  }
}