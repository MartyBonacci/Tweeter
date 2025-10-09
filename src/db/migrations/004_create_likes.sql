-- Migration: Create likes table
-- Date: 2025-10-08
-- Feature: 003-users-can-like-tweets

-- Create likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Composite unique constraint: one like per user per tweet
  CONSTRAINT unique_user_tweet_like UNIQUE(user_id, tweet_id)
);

-- Index for fast lookups: "Did user X like tweet Y?"
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- Index for fast aggregation: "How many likes does tweet Y have?"
CREATE INDEX idx_likes_tweet_id ON likes(tweet_id);

-- Composite index for user's liked tweets: "What tweets did user X like?"
CREATE INDEX idx_likes_user_tweet ON likes(user_id, tweet_id);
