import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import ProfileView from "~/components/ProfileView";
import { Alert } from "flowbite-react";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.profile) {
    return [{ title: "Profile Not Found - Tweeter" }];
  }
  return [
    { title: `${data.profile.displayName} (@${data.profile.username}) - Tweeter` },
    { name: "description", content: data.profile.bio },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const username = params.username;

  if (!username) {
    throw new Response("Not Found", { status: 404 });
  }

  try {
    const response = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/profiles/${username}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return json({ profile: null, tweets: [], error: "Profile not found" }, { status: 404 });
      }
      throw new Error("Failed to fetch profile");
    }

    const data = await response.json();
    const profile = data.profile;

    // Fetch tweets for this user
    let tweets = [];
    try {
      const tweetsResponse = await fetch(
        `http://localhost:${process.env.PORT || 3000}/api/tweets/user/${profile.userId}`
      );

      if (tweetsResponse.ok) {
        const tweetsData = await tweetsResponse.json();
        tweets = tweetsData.tweets || [];
      }
    } catch (tweetsError) {
      // If tweets fetch fails, continue with empty array (profile still loads)
      console.error('Failed to fetch tweets:', tweetsError);
    }

    return json({ profile, tweets, error: null });
  } catch (error) {
    return json(
      { profile: null, tweets: [], error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export default function ProfilePage() {
  const { profile, tweets, error } = useLoaderData<typeof loader>();

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <Alert color="failure">
            <span className="font-medium">Profile not found</span>
            <p className="mt-2">The user you're looking for doesn't exist.</p>
          </Alert>
          <div className="mt-4 text-center">
            <Link to="/" className="text-blue-600 hover:underline">
              Go back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <ProfileView profile={profile} tweets={tweets || []} />
    </div>
  );
}
