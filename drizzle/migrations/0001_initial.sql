-- Create users table
CREATE TABLE IF NOT EXISTS tweeter_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tweets table
CREATE TABLE IF NOT EXISTS tweeter_tweets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tweeter_users(id) ON DELETE CASCADE,
    content VARCHAR(140) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create follows table
CREATE TABLE IF NOT EXISTS tweeter_follows (
    follower_id UUID NOT NULL REFERENCES tweeter_users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES tweeter_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- Create likes table
CREATE TABLE IF NOT EXISTS tweeter_likes (
    user_id UUID NOT NULL REFERENCES tweeter_users(id) ON DELETE CASCADE,
    tweet_id UUID NOT NULL REFERENCES tweeter_tweets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, tweet_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON tweeter_tweets(user_id);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweeter_tweets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON tweeter_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON tweeter_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON tweeter_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_tweet ON tweeter_likes(tweet_id);