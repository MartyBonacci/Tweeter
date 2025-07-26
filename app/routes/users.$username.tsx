import { useLoaderData, Link, type LoaderFunctionArgs, data } from 'react-router';
import { Tweet } from '../components/Tweet';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import { db } from '../db/drizzle';
import { users, tweets, follows } from '../db/schema';
import { eq, desc, count } from 'drizzle-orm';

interface UserProfileData {
  user: {
    id: string;
    username: string;
    displayName: string;
    bio?: string | null;
    avatar?: string | null;
    createdAt: string;
  };
  tweets: Array<{
    tweet: {
      id: string;
      content: string;
      created_at: string;
      user_id: string;
    };
    user: {
      id: string;
      username: string;
      displayName: string;
    };
    likeCount: number;
  }>;
  tweetCount: number;
  followingCount: number;
  followersCount: number;
}

export default function UserProfile() {
  const data = useLoaderData() as UserProfileData;
  const currentUser = useUser();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(data.followersCount);

  // Debug: Log user state
  console.log('Current user:', currentUser);
  console.log('Profile user:', data.user);
  console.log('Are they the same?', currentUser?.username === data.user.username);

  useEffect(() => {
    if (currentUser && data.user && currentUser.username !== data.user.username) {
      checkFollowStatus();
    }
  }, [currentUser, data.user]);

  const checkFollowStatus = async () => {
    if (!currentUser) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/users/${data.user.username}/follow`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.isFollowing !== undefined) {
        setIsFollowing(result.isFollowing);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || currentUser.username === data.user.username) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${data.user.username}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setIsFollowing(!isFollowing);
        setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (data && typeof data === 'object' && 'error' in data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex max-w-7xl mx-auto">
          <Sidebar />
          <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900">User Not Found</h1>
              <p className="text-gray-600 mt-2">The user you're looking for doesn't exist.</p>
              <Link to="/home" className="text-blue-500 hover:text-blue-600 mt-4 inline-block">
                Go back to home
              </Link>
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    );
  }

  const { user, tweets, tweetCount, followingCount, followersCount } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex max-w-7xl mx-auto">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
          {/* Profile Header */}
          <div className="border-b border-gray-200">
            <div className="px-4 py-3">
              <h1 className="text-xl font-bold">{user.displayName}</h1>
              <p className="text-gray-500 text-sm">{tweetCount} tweets</p>
            </div>
          </div>

          {/* Profile Info */}
          <div className="border-b border-gray-200">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-end space-x-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="h-20 w-20 rounded-full border-4 border-white"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gray-300 border-4 border-white flex items-center justify-center">
                        <span className="text-2xl font-semibold text-gray-600">
                          {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    {currentUser?.username === data.user.username ? (
                      <button className="ml-auto bg-white border border-gray-300 text-gray-900 px-4 py-1 rounded-full font-medium hover:bg-gray-50">
                        Edit profile
                      </button>
                    ) : currentUser ? (
                      <button
                        onClick={handleFollow}
                        disabled={isLoading}
                        className={`ml-auto px-4 py-1 rounded-full font-medium ${
                          isFollowing
                            ? 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
                            : 'bg-black text-white hover:bg-gray-800'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                      </button>
                    ) : null}
                  </div>
                  
                  <div className="mt-3">
                    <h2 className="text-xl font-bold">{user.displayName}</h2>
                    <p className="text-gray-500">@{user.username}</p>
                  </div>
                  
                  {user.bio && (
                    <p className="mt-2 text-gray-900">{user.bio}</p>
                  )}
                  
                  <div className="mt-3 flex space-x-6 text-gray-500">
                    <div>
                      <span className="font-bold text-gray-900">{tweetCount}</span>
                      <span className="ml-1">Tweets</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900">{followingCount}</span>
                      <span className="ml-1">Following</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900">{followerCount}</span>
                      <span className="ml-1">Followers</span>
                    </div>
                  </div>
                  
                  <p className="mt-3 text-gray-500 text-sm">
                    Joined {format(new Date(user.createdAt), 'MMMM yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tweets */}
          <div className="divide-y divide-gray-200">
            {tweets.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900">No tweets yet</h3>
                <p className="text-gray-500 mt-2">@{user.username} hasn't posted any tweets yet.</p>
              </div>
            ) : (
              tweets.map(({ tweet, user: tweetUser, likeCount }) => (
                <Tweet
                  key={tweet.id}
                  tweet={{
                    ...tweet,
                    user: tweetUser,
                    created_at: tweet.created_at,
                    likeCount,
                  }}
                />
              ))
            )}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

export async function loader({ params, request }: LoaderFunctionArgs) {
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

    return data({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
      tweets: userTweets,
      tweetCount: Number(tweetCount.count),
      followingCount: Number(followingCount.count),
      followersCount: Number(followersCount.count),
    });
  } catch (error) {
    console.error('Error loading user profile:', error);
    return data({ error: 'Failed to load user profile' }, { status: 500 });
  }
}

export function ErrorBoundary() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex max-w-7xl mx-auto">
        <Sidebar />
        <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Error Loading Profile</h1>
            <p className="text-gray-600 mt-2">Something went wrong loading this profile.</p>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}