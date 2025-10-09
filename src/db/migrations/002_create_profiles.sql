-- Migration: Create profiles and session tables
-- Date: 2025-10-08
-- Feature: 001-users-can-register

-- Create profiles table for public user information
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  bio VARCHAR(141) DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for user_id lookups
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create session table for express-session with connect-pg-simple
CREATE TABLE session (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- Create index for session expiration cleanup
CREATE INDEX idx_session_expire ON session(expire);
