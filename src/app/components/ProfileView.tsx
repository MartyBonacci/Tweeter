import { Avatar, Card } from "flowbite-react";
import TweetList from "./TweetList";
import type { Tweet } from "../../types/index.js";

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: string;
  userId?: string;
}

interface ProfileViewProps {
  profile: ProfileData;
  tweets?: Tweet[];
}

export default function ProfileView({ profile, tweets }: ProfileViewProps) {
  const { username, displayName, bio, avatarUrl, createdAt } = profile;
  const joinDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center pb-10">
          <Avatar
            img={avatarUrl || undefined}
            size="xl"
            rounded
            className="mb-4"
          />
          <h5 className="mb-1 text-2xl font-bold text-gray-900">
            {displayName}
          </h5>
          <span className="text-sm text-gray-500">@{username}</span>

          {bio && (
            <p className="mt-4 text-center text-gray-700 max-w-md">{bio}</p>
          )}

          <div className="mt-6 text-sm text-gray-500">
            Joined {joinDate}
          </div>
        </div>
      </Card>

      {tweets && (
        <TweetList
          tweets={tweets}
          username={username}
          displayName={displayName}
          avatarUrl={avatarUrl}
        />
      )}
    </>
  );
}
