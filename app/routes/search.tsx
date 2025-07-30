import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import { Tweet } from '../components/Tweet';
import { SearchBox } from '../components/SearchBox';
import { Avatar } from '../components/Avatar';
import { useUser } from '../hooks/useUser';

interface SearchResult {
  query: string;
  users: Array<{
    id: string;
    username: string;
    displayName: string;
    bio?: string;
    avatar?: string;
    verified: boolean;
  }>;
  tweets: Array<{
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatar?: string;
    };
  }>;
  hashtags: Array<{
    tag: string;
    count: number;
    tweets: Array<{
      id: string;
      content: string;
      created_at: string;
      user: {
        id: string;
        username: string;
        displayName: string;
        avatar?: string;
      };
    }>;
  }>;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'tweets' | 'hashtags'>('all');
  
  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (!user) return;
    
    if (query.trim()) {
      performSearch(query);
    } else {
      setResults(null);
    }
  }, [query, user]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getResultCount = () => {
    if (!results) return 0;
    return results.users.length + results.tweets.length + results.hashtags.length;
  };

  const renderUsers = () => (
    <div className="space-y-4">
      {results?.users.map(user => (
        <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <Avatar 
              src={user.avatar}
              alt={user.displayName}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <Link 
                  to={`/users/${user.username}`}
                  className="text-lg font-bold text-gray-900 hover:text-blue-600"
                >
                  {user.displayName}
                </Link>
                {user.verified && (
                  <svg className="ml-2 w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-gray-500">@{user.username}</p>
              {user.bio && (
                <p className="text-gray-700 mt-2">{user.bio}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTweets = () => (
    <div className="bg-white border border-gray-200 rounded-lg">
      {results?.tweets.map(tweet => (
        <Tweet 
          key={tweet.id} 
          tweet={{
            ...tweet,
            likeCount: 0 // Would need to fetch like count
          }} 
        />
      ))}
    </div>
  );

  const renderHashtags = () => (
    <div className="space-y-4">
      {results?.hashtags.map(hashtag => (
        <div key={hashtag.tag} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">#</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-gray-900">#{hashtag.tag}</h3>
              <p className="text-gray-500">{hashtag.count} tweets</p>
            </div>
          </div>
          {hashtag.tweets.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              {hashtag.tweets.slice(0, 3).map(tweet => (
                <div key={tweet.id} className="mb-3 last:mb-0">
                  <div className="flex items-start space-x-3">
                    <Avatar 
                      src={tweet.user.avatar}
                      alt={tweet.user.displayName}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">{tweet.user.displayName}</span>
                        <span className="text-gray-500 text-sm">@{tweet.user.username}</span>
                      </div>
                      <p className="text-sm text-gray-900 mt-1">{tweet.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (!results) return null;

    switch (activeTab) {
      case 'users':
        return results.users.length > 0 ? renderUsers() : (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found for "{query}"</p>
          </div>
        );
      case 'tweets':
        return results.tweets.length > 0 ? renderTweets() : (
          <div className="text-center py-12">
            <p className="text-gray-500">No tweets found for "{query}"</p>
          </div>
        );
      case 'hashtags':
        return results.hashtags.length > 0 ? renderHashtags() : (
          <div className="text-center py-12">
            <p className="text-gray-500">No hashtags found for "{query}"</p>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {results.users.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">People</h3>
                {renderUsers()}
              </div>
            )}
            {results.tweets.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tweets</h3>
                {renderTweets()}
              </div>
            )}
            {results.hashtags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hashtags</h3>
                {renderHashtags()}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex max-w-7xl mx-auto">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
          <div className="max-w-2xl mx-auto">
            {/* Mobile Search */}
            <div className="md:hidden p-4 border-b border-gray-200 bg-white sticky top-16 z-40">
              <SearchBox />
            </div>
            
            {/* Search Results Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {query ? `Search results for "${query}"` : 'Search'}
                  </h1>
                  {results && (
                    <p className="text-sm text-gray-500 mt-1">
                      {getResultCount()} results
                    </p>
                  )}
                </div>
              </div>
              
              {/* Tabs */}
              {results && (
                <div className="flex space-x-8 mt-4">
                  {(['all', 'users', 'tweets', 'hashtags'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-2 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Results Content */}
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : !query ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Search Tweeter</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Find people, tweets, and hashtags
                  </p>
                </div>
              ) : results && getResultCount() === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.007-5.691-2.583M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try searching for something else
                  </p>
                </div>
              ) : (
                renderContent()
              )}
            </div>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}