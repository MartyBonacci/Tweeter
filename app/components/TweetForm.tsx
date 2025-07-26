import { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';

export function TweetForm() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useUser();
  
  const charCount = content.length;
  const isOverLimit = charCount > 140;
  const remainingChars = 140 - charCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content.trim() && !isOverLimit) {
      setIsSubmitting(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to create tweets');
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch('/api/tweets/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`
          },
          body: new URLSearchParams({ content: content.trim() })
        });

        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else if (data.tweet) {
          setContent('');
          // Refresh the page to show new tweet
          window.location.reload();
        }
      } catch (err) {
        setError('Failed to create tweet');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= 140) {
      setContent(newContent);
    }
  };


  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-600">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
        
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="What's happening?"
              className="w-full resize-none border-0 focus:ring-0 text-lg placeholder-gray-500 p-0 min-h-[60px]"
              rows={3}
              disabled={isSubmitting}
            />
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <span 
                  className={`text-sm ${isOverLimit ? 'text-red-500' : remainingChars <= 20 ? 'text-orange-500' : 'text-gray-500'}`}
                >
                  {remainingChars}
                </span>
              </div>
              
              <button
                type="submit"
                disabled={!content.trim() || isOverLimit || isSubmitting}
                className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                {isSubmitting ? 'Posting...' : 'Tweet'}
              </button>
            </div>
          </form>
          
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}