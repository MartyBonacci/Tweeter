import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Link } from 'react-router';
import { Avatar } from './Avatar';

interface SearchResult {
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
  }>;
}

interface SearchBoxProps {
  placeholder?: string;
  onResultSelect?: () => void;
  className?: string;
}

export const SearchBox = memo(function SearchBox({ 
  placeholder = "Search Tweeter", 
  onResultSelect,
  className = ""
}: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
        setSelectedIndex(-1);
      } else {
        setResults(null);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults(null);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
  }, [performSearch]);

  useEffect(() => {
    if (query.length > 0) {
      debouncedSearch(query);
    } else {
      setResults(null);
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !results) return;

    const totalResults = results.users.length + results.hashtags.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalResults);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalResults - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          // Handle selection based on index
          if (selectedIndex < results.users.length) {
            const user = results.users[selectedIndex];
            window.location.href = `/users/${user.username}`;
          } else {
            const hashtagIndex = selectedIndex - results.users.length;
            const hashtag = results.hashtags[hashtagIndex];
            setQuery(`#${hashtag.tag}`);
            setIsOpen(false);
          }
        } else if (query.trim()) {
          window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = () => {
    setIsOpen(false);
    onResultSelect?.();
  };

  const hasResults = results && (results.users.length > 0 || results.hashtags.length > 0);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && hasResults && setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
        />

        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {isOpen && hasResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.users.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                People
              </div>
              {results.users.map((user, index) => (
                <Link
                  key={user.id}
                  to={`/users/${user.username}`}
                  onClick={handleResultClick}
                  className={`flex items-center px-3 py-2 rounded-md hover:bg-gray-50 ${
                    selectedIndex === index ? 'bg-blue-50' : ''
                  }`}
                >
                  <Avatar 
                    src={user.avatar}
                    alt={user.displayName}
                    size="sm"
                    className="w-10 h-10"
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName}
                      </p>
                      {user.verified && (
                        <svg className="ml-1 w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                    {user.bio && (
                      <p className="text-xs text-gray-400 truncate mt-1">{user.bio}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results.hashtags.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Hashtags
              </div>
              {results.hashtags.map((hashtag, index) => (
                <button
                  key={hashtag.tag}
                  onClick={() => {
                    setQuery(`#${hashtag.tag}`);
                    setIsOpen(false);
                    // Navigate to search results
                    window.location.href = `/search?q=${encodeURIComponent(`#${hashtag.tag}`)}`;
                  }}
                  className={`w-full text-left flex items-center px-3 py-2 rounded-md hover:bg-gray-50 ${
                    selectedIndex === results.users.length + index ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">#</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">#{hashtag.tag}</p>
                    <p className="text-xs text-gray-500">{hashtag.count} tweets</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && !isLoading && (
            <div className="p-2 border-t border-gray-100">
              <Link
                to={`/search?q=${encodeURIComponent(query)}`}
                onClick={handleResultClick}
                className="flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search for "{query}"
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
});