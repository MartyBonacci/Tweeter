-- Migration: Add email to users table
-- Date: 2025-10-08
-- Feature: Email and password confirmation for registration

-- Add email column (nullable for backward compatibility)
ALTER TABLE users
ADD COLUMN email VARCHAR(255) UNIQUE;

-- Add index for case-insensitive email lookups
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- Add check constraint for basic email format
ALTER TABLE users
ADD CONSTRAINT email_format_check CHECK (
  email IS NULL OR email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
);
