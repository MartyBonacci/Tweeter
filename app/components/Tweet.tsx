import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import React from 'react';

interface TweetProps {
  tweet: {
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatar?: string;
    };
    likeCount: number;
  };
}

export const Tweet = React.memo(function Tweet({ tweet }: TweetProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.likeCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkLikeStatus();
  }, [tweet.id]);

  const checkLikeStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/tweets/${tweet.id}/like`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/tweets/${tweet.id}/like`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(!isLiked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          {tweet.user.avatar ? (
            <img
              src={tweet.user.avatar}
              alt={tweet.user.displayName}
              className="h-12 w-12 rounded-full"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-600">
                {tweet.user.displayName?.charAt(0).toUpperCase() || tweet.user.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-1">
            <Link
              to={`/users/${tweet.user.username}`}
              className="font-semibold text-gray-900 hover:underline"
            >
              {tweet.user.displayName || tweet.user.username}
            </Link>
            <Link
              to={`/users/${tweet.user.username}`}
              className="text-gray-500 hover:underline"
            >
              @{tweet.user.username}
            </Link>
            <span className="text-gray-500">·</span>
            <time className="text-gray-500" dateTime={tweet.created_at}>
              {formatDistanceToNow(new Date(tweet.created_at), { addSuffix: true })}
            </time>
          </div>
          
          <div className="mt-1 text-gray-900 whitespace-pre-wrap">
            {formatContent(tweet.content)}
          </div>
          
          <div className="mt-3 flex items-center space-x-8">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">0</span>
            </button>
            
            <button 
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">{likeCount || ''}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});