# Data Model: Tweet Posting

**Feature**: 002-users-can-post-tweets
**Date**: 2025-10-08
**Phase**: 1 (Design & Contracts)

## Entities

### Tweet
**Purpose**: Represents a user's posted message with text content
**Visibility**: Public (accessible to all users and anonymous visitors on profile pages)

| Field | Zod Schema | TypeScript Type | PostgreSQL Type | Constraints |
|-------|------------|-----------------|-----------------|-------------|
| id | z.string().uuid() | string | UUID PRIMARY KEY | Auto-generated (uuidv7) |
| userId | z.string().uuid() | string | UUID REFERENCES users(id) ON DELETE CASCADE | Foreign key to users table |
| content | z.string().trim().min(1).max(141) | string | VARCHAR(141) NOT NULL | 1-141 characters, whitespace trimmed |
| createdAt | z.date() | Date | TIMESTAMP DEFAULT NOW() | Auto-generated |
| updatedAt | z.date() | Date | TIMESTAMP DEFAULT NOW() | Auto-updated (for future editing) |

## Relationships

```
User (1) ←→ (*) Tweet [users.id = tweets.user_id]
```

- One User has **zero or many** Tweets (one-to-many relationship)
- One Tweet belongs to **exactly one** User (foreign key constraint)
- When User is deleted, all their Tweets are deleted (CASCADE DELETE)

## Type Safety Chain

### Zod Schema (src/schemas/tweet.schema.ts)

```typescript
import { z } from 'zod';

export const TweetSchema = z.object({
  content: z
    .string()
    .trim() // Remove leading/trailing whitespace
    .min(1, 'Tweet cannot be empty')
    .max(141, 'Tweet exceeds 141 characters'),
});

export type TweetInput = z.infer<typeof TweetSchema>;
```

### TypeScript Types (src/types/index.ts)

```typescript
// Derived from Zod schema
export type { TweetInput } from '../schemas/tweet.schema';

// Database entity
export interface Tweet {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended type with username (for display on profile)
export interface TweetWithUsername extends Tweet {
  username: string;
}
```

### PostgreSQL Schema (src/db/migrations/003_create_tweets.sql)

```sql
-- Migration: Create tweets table
-- Date: 2025-10-08
-- Feature: 002-users-can-post-tweets

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
```

**Note**: The `update_updated_at_column()` function already exists from migration 001 (users table).

## Validation Rules

### Content
- **Minimum**: 1 character (after trimming whitespace)
- **Maximum**: 141 characters (Tweeter's defining limit)
- **Trimming**: Leading and trailing whitespace removed before validation
- **Empty tweets**: Rejected (content must have at least 1 non-whitespace character)
- **Whitespace-only**: Rejected (e.g., "   " is invalid)
- **Plain text**: No HTML, markdown, or rich text formatting

### Character Counting
- **Method**: JavaScript `.length` property (UTF-16 code units)
- **Unicode**: Some emojis count as 2 characters (surrogate pairs)
- **Consistent**: Same counting method on frontend and backend

### User Association
- **Required**: Every tweet must have a userId (foreign key constraint)
- **Authenticated**: Only authenticated users can post tweets
- **Ownership**: Tweet ownership cannot be transferred (userId is immutable)

## State Transitions

### Tweet States
1. **Nonexistent** (initial): No tweet exists
2. **Posted**: Tweet created and saved in database with timestamp
3. **Visible**: Tweet appears on user's profile page in chronological order

**Note**: No editing or deletion states in MVP (future enhancement).

## Database Queries

### Key Queries (using postgres package for camelCase ↔ snake_case)

```typescript
import postgres from 'postgres';
import { uuidv7 } from 'uuidv7';

const sql = postgres(process.env.DATABASE_URL, {
  transform: postgres.camel, // Auto camelCase conversion
});

// Create tweet
const createTweet = async (userId: string, content: string) => {
  const tweetId = uuidv7();
  const [tweet] = await sql`
    INSERT INTO tweets (id, user_id, content)
    VALUES (${tweetId}, ${userId}, ${content})
    RETURNING *
  `;
  return tweet;
};

// Get all tweets by user (reverse chronological)
const getTweetsByUserId = async (userId: string) => {
  const tweets = await sql`
    SELECT * FROM tweets
    WHERE user_id = ${userId}
    ORDER BY created_at DESC, id DESC
  `;
  return tweets;
};

// Get all tweets by username (for profile page)
const getTweetsByUsername = async (username: string) => {
  const tweets = await sql`
    SELECT t.*, u.username
    FROM tweets t
    JOIN users u ON u.id = t.user_id
    WHERE LOWER(u.username) = LOWER(${username})
    ORDER BY t.created_at DESC, t.id DESC
  `;
  return tweets;
};

// Count tweets by user (optional, for stats)
const countTweetsByUserId = async (userId: string) => {
  const [result] = await sql`
    SELECT COUNT(*) as count
    FROM tweets
    WHERE user_id = ${userId}
  `;
  return result.count;
};
```

## Query Performance

### Indexes
- **idx_tweets_user_id**: Fast lookup of tweets by user (used on profile pages)
- **idx_tweets_created_at**: Fast sorting by timestamp (reverse chronological)
- **idx_tweets_user_created**: Composite index for optimal profile page queries

### Expected Performance
- **Single user's tweets** (up to 100): < 50ms
- **Profile page with tweets**: < 2 seconds total (includes rendering)
- **Tweet creation**: < 200ms (insert + index update)

### Optimization Plan (future)
1. **Pagination**: Add `LIMIT 20 OFFSET $n` when profiles exceed 50 tweets
2. **Caching**: Add Redis cache for hot profiles (frequent viewers)
3. **CDN**: Cache profile pages for public viewing

## Data Validation Flow

```
User Input (Frontend)
    ↓
Zod Validation (Client-side for UX)
    ↓
HTTP POST /api/tweets
    ↓
Zod Validation (Server-side for security)
    ↓
Service Layer (createTweet function)
    ↓
PostgreSQL (INSERT with constraints)
    ↓
Return Tweet Object
```

**Validation Points**:
1. **Frontend**: Real-time character counter, submit button disabled if >141 chars
2. **Backend**: Zod middleware validates request body before route handler
3. **Database**: CHECK constraint enforces 1-141 characters at database level

## Example Data

### Valid Tweet
```typescript
{
  id: "01936c8e-8b2a-7890-b123-456789abcdef",
  userId: "01936c8e-1234-5678-9abc-def012345678",
  content: "Hello, Tweeter! This is my first tweet. 🎉",
  createdAt: new Date("2025-10-08T14:30:00Z"),
  updatedAt: new Date("2025-10-08T14:30:00Z")
}
```

### Invalid Tweets (Rejected by Validation)
```typescript
// Empty tweet
{ content: "" } // Error: "Tweet cannot be empty"

// Whitespace only
{ content: "   " } // Error: "Tweet cannot be empty" (after trim)

// Exceeds limit
{ content: "a".repeat(142) } // Error: "Tweet exceeds 141 characters"

// Missing content
{} // Error: Required field missing
```

## Migration Steps

### Running Migration

```bash
# Run migration script
npm run migrate

# Or manually with psql
psql $DATABASE_URL < src/db/migrations/003_create_tweets.sql
```

### Rollback (if needed)

```sql
-- Drop tweets table and indexes
DROP TABLE tweets CASCADE;
-- Indexes and triggers drop automatically with CASCADE
```

### Verification

```sql
-- Verify table exists
\dt tweets

-- Verify indexes
\di idx_tweets_*

-- Verify foreign key constraint
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE conname LIKE '%tweets%';

-- Test insert (should succeed)
INSERT INTO tweets (id, user_id, content)
VALUES (uuid_generate_v4(), 'existing-user-id', 'Test tweet');

-- Test constraint (should fail)
INSERT INTO tweets (id, user_id, content)
VALUES (uuid_generate_v4(), 'existing-user-id', ''); -- Empty content
```

## Schema Evolution (Future)

**Planned Enhancements** (not in MVP):
- Add `parent_tweet_id` for replies/threading
- Add `retweet_of_id` for retweets
- Add `media_urls` JSONB array for images/videos
- Add `hashtags` JSONB array for hashtag indexing
- Add `mentions` JSONB array for @username references
- Add `edit_history` JSONB for edit tracking
- Add `deleted_at` for soft deletes

**Migration Strategy**:
- All future columns nullable (backward compatible)
- Indexes added incrementally as features launch
- No breaking changes to existing tweets

## Data Integrity

### Foreign Key Constraints
- **user_id → users(id)**: Ensures tweet author exists
- **ON DELETE CASCADE**: Automatically removes tweets when user deleted

### Check Constraints
- **content length**: 1-141 characters enforced at database level
- **content trim**: Leading/trailing whitespace removed before storage

### Indexes for Performance
- **User lookup**: Fast retrieval of all tweets by user
- **Chronological order**: Fast sorting for profile displays
- **Composite**: Optimized for common query pattern (user + order)

### Consistency Guarantees
- **Timestamps**: Auto-managed by database (no manual updates)
- **IDs**: UUIDv7 ensures uniqueness and sortability
- **Transactions**: All operations atomic (insert succeeds or rolls back)

---

**Type Safety Chain Status**: ✅ Complete
- Zod schema: `TweetSchema`
- TypeScript type: `TweetInput`, `Tweet`, `TweetWithUsername`
- PostgreSQL schema: `tweets` table with constraints and indexes

All three layers synchronized and validated.
