import { Card, Avatar } from 'flowbite-react';
import { formatRelativeTime } from '~/utils/formatTimestamp';
import type { Tweet } from '../../types/index.js';

interface TweetItemProps {
  tweet: Tweet;
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
}

export default function TweetItem({
  tweet,
  displayName,
  username,
  avatarUrl,
}: TweetItemProps) {
  return (
    <article>
      <Card className="hover:bg-gray-50 transition-colors">
        <div className="flex gap-3">
          {avatarUrl !== undefined && (
            <Avatar
              img={avatarUrl || undefined}
              rounded
              size="md"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              {displayName && (
                <span className="font-bold text-gray-900 truncate">
                  {displayName}
                </span>
              )}
              {username && (
                <span className="text-sm text-gray-500 truncate">
                  @{username}
                </span>
              )}
              <span className="text-sm text-gray-500" aria-hidden="true">
                ·
              </span>
              <time
                dateTime={tweet.createdAt.toISOString()}
                className="text-sm text-gray-500 whitespace-nowrap"
                title={tweet.createdAt.toLocaleString('en-US', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              >
                {formatRelativeTime(tweet.createdAt)}
              </time>
            </div>
            <p className="text-gray-900 whitespace-pre-wrap break-words">
              {tweet.content}
            </p>
          </div>
        </div>
      </Card>
    </article>
  );
}
