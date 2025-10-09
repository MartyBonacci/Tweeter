-- Migration: Create tweets table
-- Date: 2025-10-08
-- Feature: 002-users-can-post-tweets

-- Create tweets table
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content VARCHAR(141) NOT NULL CHECK (LENGTH(TRIM(content)) >= 1 AND LENGTH(content) <= 141),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for querying tweets by user (used on profile pages)
CREATE INDEX idx_tweets_user_id ON tweets(user_id);

-- Index for sorting tweets chronologically (newest first)
CREATE INDEX idx_tweets_created_at ON tweets(created_at DESC);

-- Composite index for common query pattern (user's tweets in order)
CREATE INDEX idx_tweets_user_created ON tweets(user_id, created_at DESC);

-- Update trigger for updated_at
CREATE TRIGGER update_tweets_updated_at BEFORE UPDATE ON tweets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
