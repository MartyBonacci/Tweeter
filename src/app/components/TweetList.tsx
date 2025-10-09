import TweetItem from './TweetItem';
import type { Tweet } from '../../types/index.js';

interface TweetListProps {
  tweets: Tweet[];
  emptyMessage?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export default function TweetList({
  tweets,
  emptyMessage,
  username,
  displayName,
  avatarUrl,
}: TweetListProps) {
  const defaultEmptyMessage = username
    ? `@${username} hasn't posted any tweets yet`
    : 'No tweets yet';

  if (tweets.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8">
        <div className="text-center text-gray-500 py-12 px-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-lg">{emptyMessage || defaultEmptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="space-y-4">
        {tweets.map((tweet) => (
          <TweetItem
            key={tweet.id}
            tweet={tweet}
            displayName={displayName}
            username={username}
            avatarUrl={avatarUrl}
          />
        ))}
      </div>
    </div>
  );
}
