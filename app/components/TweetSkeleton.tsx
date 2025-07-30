import { memo } from 'react';

export const TweetSkeleton = memo(function TweetSkeleton() {
  return (
    <div className="border-b border-gray-200 p-4 animate-pulse">
      <div className="flex space-x-3">
        {/* Avatar skeleton */}
        <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0"></div>
        
        <div className="flex-1 space-y-2">
          {/* User info skeleton */}
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
            <div className="h-4 bg-gray-300 rounded w-12"></div>
          </div>
          
          {/* Tweet content skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
          
          {/* Actions skeleton */}
          <div className="flex items-center space-x-6 mt-3">
            <div className="h-4 bg-gray-300 rounded w-8"></div>
            <div className="h-4 bg-gray-300 rounded w-8"></div>
            <div className="h-4 bg-gray-300 rounded w-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const TimelineSkeleton = memo(function TimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {Array.from({ length: count }, (_, i) => (
        <TweetSkeleton key={i} />
      ))}
    </div>
  );
});