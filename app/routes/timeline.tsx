import { Link, useLoaderData } from "react-router";
import { db } from "~/lib/db/connection";
import { tweets, users } from "~/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "~/lib/session.server";

export async function loader({ request }: { request: Request }) {
  const user = await requireAuth(request);
  
  // Get timeline tweets (for now, all tweets)
  const timelineTweets = await db
    .select({
      id: tweets.id,
      content: tweets.content,
      createdAt: tweets.createdAt,
      user: {
        id: users.id,
        username: users.username,
        name: users.displayName,
      }
    })
    .from(tweets)
    .innerJoin(users, eq(tweets.userId, users.id))
    .orderBy(desc(tweets.createdAt))
    .limit(50);

  return { tweets: timelineTweets, user };
}

export default function TimelinePage() {
  const { tweets, user } = useLoaderData() as { tweets: any[], user: any };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome, {user.name}!</h1>
        <Link
          to="/tweets"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Create new tweet
        </Link>
      </div>

      <div className="space-y-4">
        {tweets.map((tweet) => (
          <div key={tweet.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {tweet.user.name[0]?.toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-medium text-gray-900">{tweet.user.name}</p>
                  <Link 
                    to={`/${tweet.user.username}`}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    @{tweet.user.username}
                  </Link>
                  <span className="text-sm text-gray-500">·</span>
                  <time className="text-sm text-gray-500">
                    {new Date(tweet.createdAt).toLocaleDateString()}
                  </time>
                </div>
                <p className="mt-1 text-sm text-gray-900">{tweet.content}</p>
                <div className="mt-2 flex space-x-4">
                  <Link 
                    to={`/tweets/${tweet.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {tweets.length === 0 && (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No tweets yet. Be the first to tweet!</p>
          </div>
        )}
      </div>
    </div>
  );
}