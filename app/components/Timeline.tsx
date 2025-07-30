import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useFetcher } from 'react-router';
import { Tweet } from './Tweet';
import { TweetForm } from './TweetForm';
import { TimelineSkeleton } from './TweetSkeleton';

interface TweetData {
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
    avatar?: string;
  };
  likeCount: number;
}

export const Timeline = memo(function Timeline() {
  const [tweets, setTweets] = useState<TweetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'for-you' | 'following'>('for-you');
  const fetcher = useFetcher();

  const fetchTweets = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const filterParam = filter === 'following' ? 'following' : 'all';
      
      const response = await fetch(`/api/tweets?filter=${filterParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please log in to view tweets');
          return;
        }
        throw new Error('Failed to fetch tweets');
      }
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTweets(data.tweets || []);
      }
    } catch (err) {
      setError('Failed to load tweets');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view tweets');
      setLoading(false);
      return;
    }
    fetchTweets();
  }, [filter]);

  useEffect(() => {
    if (fetcher.data?.tweet) {
      // When a new tweet is created, we'll just refetch the timeline
      // This ensures we get the complete tweet with user info
      fetchTweets();
    }
  }, [fetcher.data]);

  const memoizedTweets = useMemo(() => 
    tweets.map(({ tweet, user, likeCount }) => (
      <Tweet key={tweet.id} tweet={{
        id: tweet.id,
        content: tweet.content,
        created_at: tweet.created_at,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar || undefined
        },
        likeCount
      }} />
    )), [tweets]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <TweetForm />
        <TimelineSkeleton count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <TweetForm />
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchTweets}
            className="text-blue-500 hover:text-blue-600 font-semibold"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <TweetForm />
      
      {/* Timeline Filter Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setFilter('for-you')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              filter === 'for-you'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            For you
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              filter === 'following'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Following
          </button>
        </div>
      </div>
      
      {tweets.length === 0 ? (
        <div className="text-center py-12 border-b border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filter === 'following' ? 'No tweets from people you follow' : 'No tweets yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'following' 
              ? 'Follow more people to see their tweets' 
              : 'Be the first to tweet!'}
          </p>
        </div>
      ) : (
        memoizedTweets
      )}
    </div>
  );
});