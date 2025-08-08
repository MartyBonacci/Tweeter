import { Form, Link, useActionData, useLoaderData } from "react-router";
import { useEffect, useRef, useState } from "react";
import { requireAuth } from "~/lib/session.server";
import { getUserTimeline, createTweet } from "~/models/tweet";
import { tweetSchema } from "~/models/tweet/tweet.schema";

export async function loader({ request }: { request: Request }) {
  const user = await requireAuth(request);
  
  // Get timeline tweets using getUserTimeline
  const timelineTweets = await getUserTimeline(user.userId, 50, 0);

  return { tweets: timelineTweets, user };
}

export async function action({ request }: { request: Request }) {
    const user = await requireAuth(request);
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const validation = tweetSchema.safeParse(data);

    if (!validation.success) {
        return Response.json(
            {
                error: "Validation failed",
                errors: validation.error.flatten(),
                values: data
            },
            { status: 400 }
        );
    }

    const { content } = validation.data;

    try {
        const newTweet = await createTweet({
            userId: user.userId,
            content,
        });

        return Response.json({
            success: true,
            message: "Tweet posted successfully!",
            tweet: {
                id: newTweet.id,
                content: newTweet.content,
                createdAt: newTweet.createdAt,
            }
        });

    } catch (error) {
        console.error("Tweet creation error:", error);
        return Response.json(
            {
                error: "Failed to create tweet",
                errors: {},
                values: data
            },
            { status: 500 }
        );
    }
}

export default function TimelinePage() {
  const { tweets, user } = useLoaderData() as { tweets: any[], user: any };

    const actionData = useActionData() as any;
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (actionData?.errors?.fieldErrors?.content) {
            contentRef.current?.focus();
        }

        if (actionData?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [actionData]);

  return (
    <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            {showSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">✅ Tweet posted successfully!</p>
                </div>
            )}
            <Form method="post" className="space-y-4">
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                        What's happening?
                    </label>
                    <textarea
                        ref={contentRef}
                        id="content"
                        name="content"
                        rows={2}
                        maxLength={140}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Share your thoughts..."
                        defaultValue={actionData?.success ? "" : actionData?.values?.content || ""}
                        aria-invalid={actionData?.errors?.fieldErrors?.content ? "true" : "false"}
                        aria-describedby="content-error"
                    />
                    {actionData?.errors?.fieldErrors?.content && (
                        <p id="content-error" className="mt-1 text-sm text-red-600">
                            {actionData.errors.fieldErrors.content[0]}
                        </p>
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                        {140 - (actionData?.values?.content?.length || 0)} characters remaining
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Tweet
                    </button>
                </div>
            </Form>
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