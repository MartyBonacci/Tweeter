# Data Model: Like Feature

**Feature**: 003-users-can-like-tweets
**Date**: 2025-10-08
**Phase**: 1 (Design & Contracts)

---

## Entities

### Like

**Purpose**: Represents a user's appreciation for a tweet

**Visibility**: Public (like counts visible to all, but individual liker identities private for MVP)

| Field | Zod Schema | TypeScript Type | PostgreSQL Type | Constraints |
|-------|------------|-----------------|-----------------|-------------|
| id | z.string().uuid() | string | UUID PRIMARY KEY | Auto-generated (uuidv7) |
| userId | z.string().uuid() | string | UUID REFERENCES users(id) ON DELETE CASCADE | Foreign key to users table |
| tweetId | z.string().uuid() | string | UUID REFERENCES tweets(id) ON DELETE CASCADE | Foreign key to tweets table |
| createdAt | z.date() | Date | TIMESTAMP DEFAULT NOW() | Auto-generated |

---

## Relationships

```
User (1) ←→ (*) Like ←→ (*) Tweet (1)
```

**Many-to-Many Relationship**:
- One User can have **many** Likes (one-to-many)
- One Tweet can have **many** Likes (one-to-many)
- One Like belongs to **exactly one** User AND **exactly one** Tweet
- Composite uniqueness: Each user can like a specific tweet only once

**Cascade Behavior**:
- When User is deleted → all their Likes are deleted (CASCADE DELETE)
- When Tweet is deleted → all its Likes are deleted (CASCADE DELETE)

---

## Type Safety Chain

### Zod Schema (src/schemas/like.schema.ts)

```typescript
import { z } from 'zod';

// Like input schema (for API requests)
export const LikeSchema = z.object({
  tweetId: z
    .string()
    .uuid('Invalid tweet ID format'),
});

export type LikeInput = z.infer<typeof LikeSchema>;
```

**Note**: `userId` comes from session, not request body, so not in schema.

---

### TypeScript Types (src/types/index.ts)

```typescript
// Database entity
export interface Like {
  id: string;
  userId: string;
  tweetId: string;
  createdAt: Date;
}

// Derived from Zod schema
export type { LikeInput } from '../schemas/like.schema.js';

// API response type (like count + user's like status)
export interface LikeData {
  tweetId: string;
  count: number;
  userLiked: boolean;
}

// Batch response type (for multiple tweets)
export type LikeDataBatch = LikeData[];
```

---

### PostgreSQL Schema (src/db/migrations/004_create_likes.sql)

```sql
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
```

**Note**: No update trigger needed (likes are immutable once created).

---

## Validation Rules

### Tweet ID

- **Required**: Cannot create like without tweet ID
- **Format**: Must be valid UUID (v4 or v7)
- **Existence**: Tweet must exist in database (foreign key enforced)
- **Validation Layer**: Zod validates format, PostgreSQL validates existence

### User ID

- **Required**: Cannot create like without user ID
- **Source**: Extracted from session cookie (not from request body)
- **Format**: Must be valid UUID
- **Existence**: User must exist in database (foreign key enforced)
- **Authentication**: User must be logged in (middleware enforced)

### Uniqueness

- **Composite Constraint**: `UNIQUE(user_id, tweet_id)`
- **Behavior**: Second like attempt for same user+tweet is ignored (idempotent)
- **Error Handling**: `ON CONFLICT DO NOTHING` silently ignores duplicates

---

## State Transitions

### Like States

1. **Nonexistent** (initial): No like exists for this user+tweet combination
2. **Created**: Like exists in database with timestamp
3. **Deleted**: Like removed from database (unlike action)

**Note**: Likes are immutable (no update state). Only create or delete.

**State Diagram**:
```
Nonexistent --[like]--> Created --[unlike]--> Nonexistent
     ^                                              |
     |______________________________________________|
                    (cycle repeats)
```

---

## Database Queries

### Key Queries (using postgres package with camelCase)

```typescript
import postgres from 'postgres';
import { uuidv7 } from 'uuidv7';
import type { Like, LikeData } from '../types/index.js';

const sql = postgres(process.env.DATABASE_URL, {
  transform: postgres.camel, // Auto camelCase conversion
});

// ============================================
// CREATE: Like a tweet (idempotent)
// ============================================
export async function createLike(
  userId: string,
  tweetId: string
): Promise<Like> {
  const likeId = uuidv7();

  const [like] = await sql<Like[]>`
    INSERT INTO likes (id, user_id, tweet_id)
    VALUES (${likeId}, ${userId}, ${tweetId})
    ON CONFLICT (user_id, tweet_id) DO NOTHING
    RETURNING *
  `;

  // If conflict occurred (duplicate like), fetch existing
  if (!like) {
    const [existing] = await sql<Like[]>`
      SELECT * FROM likes
      WHERE user_id = ${userId} AND tweet_id = ${tweetId}
    `;
    return existing;
  }

  return like;
}

// ============================================
// DELETE: Unlike a tweet (idempotent)
// ============================================
export async function deleteLike(
  userId: string,
  tweetId: string
): Promise<void> {
  await sql`
    DELETE FROM likes
    WHERE user_id = ${userId} AND tweet_id = ${tweetId}
  `;
  // Silent if like doesn't exist (idempotent)
}

// ============================================
// READ: Get like count for a tweet
// ============================================
export async function getLikeCount(tweetId: string): Promise<number> {
  const [result] = await sql<{ count: number }[]>`
    SELECT COUNT(*) as count
    FROM likes
    WHERE tweet_id = ${tweetId}
  `;
  return result.count;
}

// ============================================
// CHECK: Did user like this tweet?
// ============================================
export async function checkUserLiked(
  userId: string,
  tweetId: string
): Promise<boolean> {
  const [result] = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM likes
      WHERE user_id = ${userId} AND tweet_id = ${tweetId}
    ) as exists
  `;
  return result.exists;
}

// ============================================
// BATCH: Get like data for multiple tweets
// ============================================
export async function getLikesByTweetIds(
  tweetIds: string[],
  userId?: string
): Promise<LikeData[]> {
  // Query likes for all tweet IDs
  const results = await sql<
    Array<{ tweetId: string; count: number; userLiked: number }>
  >`
    SELECT
      tweet_id,
      COUNT(*) as count,
      ${userId
        ? sql`MAX(CASE WHEN user_id = ${userId} THEN 1 ELSE 0 END)`
        : sql`0`
      } as user_liked
    FROM likes
    WHERE tweet_id IN ${sql(tweetIds)}
    GROUP BY tweet_id
  `;

  // Map results to include tweets with 0 likes
  return tweetIds.map((tweetId) => {
    const result = results.find((r) => r.tweetId === tweetId);
    return {
      tweetId,
      count: result?.count || 0,
      userLiked: result?.userLiked === 1,
    };
  });
}

// ============================================
// USER LIKES: Get all tweets a user has liked
// ============================================
export async function getLikedTweetsByUserId(
  userId: string
): Promise<string[]> {
  const likes = await sql<{ tweetId: string }[]>`
    SELECT tweet_id
    FROM likes
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return likes.map((like) => like.tweetId);
}
```

---

## Query Performance

### Indexes

| Index Name | Columns | Purpose | Performance Benefit |
|------------|---------|---------|---------------------|
| `idx_likes_user_id` | `user_id` | Fast lookup of user's likes | O(log n) vs O(n) scan |
| `idx_likes_tweet_id` | `tweet_id` | Fast aggregation of tweet's like count | O(log n) vs O(n) scan |
| `idx_likes_user_tweet` | `(user_id, tweet_id)` | Fast check: "Did user like tweet?" | O(log n) composite lookup |
| `unique_user_tweet_like` | `(user_id, tweet_id)` | Unique constraint + query optimization | Prevents duplicates + fast checks |

**Note**: PostgreSQL automatically creates index for UNIQUE constraint, so `unique_user_tweet_like` serves dual purpose.

---

### Expected Performance

| Query | Complexity | Target Time | Notes |
|-------|-----------|-------------|-------|
| `createLike` | O(log n) | < 50ms | Single INSERT with index update |
| `deleteLike` | O(log n) | < 50ms | Single DELETE with index lookup |
| `getLikeCount` | O(log n) | < 50ms | COUNT(*) with index on tweet_id |
| `checkUserLiked` | O(1) | < 10ms | EXISTS query with composite index |
| `getLikesByTweetIds` (50 tweets) | O(m log n) | < 200ms | Batch query with IN clause |
| `getLikedTweetsByUserId` | O(k log n) | < 100ms | WHERE + ORDER BY with index |

**Legend**:
- n = total likes in database
- m = number of tweets queried (batch)
- k = number of likes by specific user

---

### Optimization Plan (Future)

**When to Optimize**:
1. **Denormalize like_count column**: If `COUNT(*)` queries exceed 100ms consistently
2. **Redis caching**: If database load exceeds 70% CPU during peak traffic
3. **Pagination**: If users have >1000 liked tweets (infinite scroll)

**Current Decision**: Start simple with direct queries. Profile first, optimize later.

---

## Data Validation Flow

```
User Clicks Like Button (Frontend)
    ↓
Optimistic UI Update (liked=true, count+1)
    ↓
POST /api/tweets/:tweetId/like
    ↓
requireAuth Middleware (validate session, extract userId)
    ↓
validate(LikeSchema) Middleware (validate tweetId format)
    ↓
Route Handler → createLike(userId, tweetId)
    ↓
Service Layer → SQL INSERT with ON CONFLICT
    ↓
PostgreSQL Validates:
  - userId REFERENCES users(id) (FK constraint)
  - tweetId REFERENCES tweets(id) (FK constraint)
  - UNIQUE(userId, tweetId) (duplicate check)
    ↓
Return 201 Created { like } OR fetch existing like
    ↓
Frontend: Success → keep optimistic update
          Error → rollback UI (liked=false, count-1)
```

**Validation Layers**:
1. **Frontend**: Disable button if not authenticated
2. **Middleware**: Validate session + UUID format
3. **Service**: Pure function logic
4. **Database**: Foreign keys + unique constraint

---

## Example Data

### Valid Like

```typescript
{
  id: "01936c8e-8b2a-7890-b123-456789abcdef",
  userId: "01936c8e-1234-5678-9abc-def012345678",
  tweetId: "01936c8e-9999-8888-7777-666655554444",
  createdAt: new Date("2025-10-08T14:30:00Z")
}
```

### LikeData Response (GET /api/tweets/:id/likes)

```typescript
// Authenticated user who has liked
{
  tweetId: "01936c8e-9999-8888-7777-666655554444",
  count: 42,
  userLiked: true
}

// Authenticated user who hasn't liked
{
  tweetId: "01936c8e-9999-8888-7777-666655554444",
  count: 42,
  userLiked: false
}

// Anonymous user
{
  tweetId: "01936c8e-9999-8888-7777-666655554444",
  count: 42,
  userLiked: false
}
```

### Batch Response (for tweet list)

```typescript
[
  { tweetId: "tweet-uuid-1", count: 10, userLiked: true },
  { tweetId: "tweet-uuid-2", count: 0, userLiked: false },
  { tweetId: "tweet-uuid-3", count: 5, userLiked: false },
  { tweetId: "tweet-uuid-4", count: 100, userLiked: true },
]
```

---

## Migration Steps

### Running Migration

```bash
# Run migration script
npm run migrate

# Or manually with Node
npx tsx scripts/run-migrations.ts

# Or create individual migration script
npx tsx scripts/migrate-004.ts
```

### Migration File (004_create_likes.sql)

Already documented above in PostgreSQL Schema section.

---

### Rollback (if needed)

```sql
-- Drop likes table and all associated objects
DROP TABLE likes CASCADE;

-- Indexes drop automatically with CASCADE
```

**Risk**: Destructive operation. All like data will be lost.

**Mitigation**: Backup database before migration, test in staging first.

---

### Verification

```sql
-- Verify table exists
\dt likes

-- Verify indexes
\di idx_likes_*

-- Verify constraints
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'likes'::regclass;

-- Expected constraints:
-- likes_pkey (PRIMARY KEY)
-- likes_user_id_fkey (FOREIGN KEY to users)
-- likes_tweet_id_fkey (FOREIGN KEY to tweets)
-- unique_user_tweet_like (UNIQUE constraint)

-- Test insert (should succeed)
INSERT INTO likes (id, user_id, tweet_id)
VALUES (uuid_generate_v4(), 'valid-user-id', 'valid-tweet-id');

-- Test duplicate (should be ignored due to ON CONFLICT)
INSERT INTO likes (id, user_id, tweet_id)
VALUES (uuid_generate_v4(), 'valid-user-id', 'valid-tweet-id')
ON CONFLICT (user_id, tweet_id) DO NOTHING;
-- Should return 0 rows affected

-- Test cascade delete (should work)
DELETE FROM tweets WHERE id = 'valid-tweet-id';
-- All likes for that tweet should also be deleted
SELECT COUNT(*) FROM likes WHERE tweet_id = 'valid-tweet-id';
-- Should return 0
```

---

## Schema Evolution (Future)

**Planned Enhancements** (not in MVP):
- Add `updated_at` column for unlike tracking (soft delete pattern)
- Add `source` column for tracking like origin (web, mobile app, API)
- Add `notification_sent` boolean for notification feature
- Create `liked_tweets_view` materialized view for performance
- Add `likes_count` column to tweets table (denormalization)

**Migration Strategy**:
- All future columns nullable (backward compatible)
- Indexes added incrementally as features launch
- No breaking changes to existing likes

---

## Data Integrity

### Foreign Key Constraints

**user_id → users(id)**:
- Ensures like author exists
- CASCADE DELETE: Removes all likes when user is deleted

**tweet_id → tweets(id)**:
- Ensures liked tweet exists
- CASCADE DELETE: Removes all likes when tweet is deleted

### Unique Constraint

**UNIQUE(user_id, tweet_id)**:
- Prevents duplicate likes
- Enables idempotent API behavior
- Automatic index for fast lookups

### Indexes for Performance

**idx_likes_user_id**:
- Fast retrieval: "Show me all tweets user X has liked"
- Used by: `getLikedTweetsByUserId` function

**idx_likes_tweet_id**:
- Fast aggregation: "Count likes for tweet Y"
- Used by: `getLikeCount`, `getLikesByTweetIds` functions

**idx_likes_user_tweet (Composite)**:
- Fast check: "Did user X like tweet Y?"
- Used by: `checkUserLiked`, `createLike` (ON CONFLICT check)

### Consistency Guarantees

**Atomicity**: Each like operation is atomic (INSERT/DELETE succeeds or rolls back entirely)

**Isolation**: Concurrent like requests don't interfere (database handles locking)

**Durability**: Once confirmed, likes persist even if server crashes

**Consistency**: Foreign keys + unique constraint maintain database integrity

---

## Type Safety Chain Status: ✅ Complete

- ✅ Zod schema: `LikeSchema`
- ✅ TypeScript types: `Like`, `LikeInput`, `LikeData`, `LikeDataBatch`
- ✅ PostgreSQL schema: `likes` table with constraints and indexes

All three layers synchronized and validated.

---

**Data Model Status**: ✅ COMPLETE

Ready for API contracts definition.
