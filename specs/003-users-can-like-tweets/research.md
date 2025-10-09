# Research: Like Feature Technical Decisions

**Feature**: 003-users-can-like-tweets
**Date**: 2025-10-08
**Phase**: 0 (Research & Technical Decisions)

---

## Decision 1: Database Schema Design

### Options Considered

**Option 1: Separate likes table** ✅ **SELECTED**
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tweet_id UUID REFERENCES tweets(id),
  created_at TIMESTAMP,
  UNIQUE(user_id, tweet_id)
);
```

**Option 2: Denormalized like_count column on tweets**
```sql
ALTER TABLE tweets ADD COLUMN like_count INTEGER DEFAULT 0;
-- No likes table, increment/decrement column directly
```

**Option 3: JSONB array of user IDs on tweets**
```sql
ALTER TABLE tweets ADD COLUMN liked_by_users JSONB DEFAULT '[]';
-- Store array: ["user-uuid-1", "user-uuid-2", ...]
```

### Rationale

**Option 1 (Selected)**:
- ✅ Normalized data (no redundancy)
- ✅ Easy to query: "Did user X like tweet Y?"
- ✅ Easy to query: "How many likes does tweet Y have?"
- ✅ Easy to query: "What tweets did user X like?"
- ✅ Referential integrity via foreign keys
- ✅ Scales to millions of likes
- ✅ Standard many-to-many pattern

**Option 2 (Rejected)**:
- ❌ No way to track which users liked (lose data)
- ❌ No way to prevent duplicate likes
- ❌ Race conditions when incrementing/decrementing
- ❌ Cannot query "What tweets did user X like?"

**Option 3 (Rejected)**:
- ❌ JSONB queries slower than indexed foreign keys
- ❌ Violates normalization (user data stored in multiple places)
- ❌ Array grows unbounded (performance degrades with popular tweets)
- ❌ Difficult to maintain referential integrity (manual cleanup on user delete)

**Decision**: Use separate `likes` table with composite UNIQUE constraint.

---

## Decision 2: Idempotency Strategy

### Options Considered

**Option 1: ON CONFLICT DO NOTHING (database-level)** ✅ **SELECTED**
```sql
INSERT INTO likes (id, user_id, tweet_id)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, tweet_id) DO NOTHING
RETURNING *;
```

**Option 2: Check-then-insert (application-level)**
```typescript
const existing = await checkUserLiked(userId, tweetId);
if (!existing) {
  await createLike(userId, tweetId);
}
```

**Option 3: Return 409 Conflict for duplicates**
```typescript
try {
  await createLike(userId, tweetId);
} catch (error) {
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({ error: 'Already liked' });
  }
}
```

### Rationale

**Option 1 (Selected)**:
- ✅ Truly idempotent (duplicate requests have no effect)
- ✅ No race conditions (database handles concurrency)
- ✅ Single database round trip
- ✅ Simpler client-side logic (no error handling for duplicates)

**Option 2 (Rejected)**:
- ❌ Race condition: Two concurrent requests can both pass the check
- ❌ Two database round trips (check + insert)
- ❌ Not truly idempotent

**Option 3 (Rejected)**:
- ❌ Client must handle 409 errors separately
- ❌ More complex API contract (different status codes)
- ❌ Not truly idempotent (returns different responses)

**Decision**: Use `ON CONFLICT DO NOTHING` for database-level idempotency.

**Implementation**:
```typescript
export async function createLike(userId: string, tweetId: string): Promise<Like> {
  const likeId = uuidv7();

  const [like] = await sql<Like[]>`
    INSERT INTO likes (id, user_id, tweet_id)
    VALUES (${likeId}, ${userId}, ${tweetId})
    ON CONFLICT (user_id, tweet_id) DO NOTHING
    RETURNING *
  `;

  // If conflict occurred, fetch existing like
  if (!like) {
    const [existing] = await sql<Like[]>`
      SELECT * FROM likes
      WHERE user_id = ${userId} AND tweet_id = ${tweetId}
    `;
    return existing;
  }

  return like;
}
```

---

## Decision 3: API Endpoint Structure

### Options Considered

**Option 1: Nested resource paths** ✅ **SELECTED**
```
POST   /api/tweets/:tweetId/like
DELETE /api/tweets/:tweetId/like
GET    /api/tweets/:tweetId/likes
```

**Option 2: Top-level likes resource**
```
POST   /api/likes { tweetId: "..." }
DELETE /api/likes/:likeId
GET    /api/likes?tweetId=...
```

**Option 3: Action-based paths**
```
POST   /api/tweets/:tweetId/actions/like
POST   /api/tweets/:tweetId/actions/unlike
GET    /api/tweets/:tweetId/like-count
```

### Rationale

**Option 1 (Selected)**:
- ✅ RESTful resource nesting (likes belong to tweets)
- ✅ Tweet ID in URL (clear, cacheable)
- ✅ Semantic: "like this tweet" / "unlike this tweet"
- ✅ Consistent with REST conventions

**Option 2 (Rejected)**:
- ❌ Less semantic (likes are not independent resources)
- ❌ DELETE requires fetching like ID first
- ❌ Query parameters less cacheable

**Option 3 (Rejected)**:
- ❌ Not RESTful (actions in URL)
- ❌ Separate unlike endpoint (toggle behavior less clear)
- ❌ Verbose

**Decision**: Use nested resource paths under `/api/tweets/:tweetId/like`.

---

## Decision 4: Like Count Storage

### Options Considered

**Option 1: COUNT(*) query on demand** ✅ **SELECTED**
```sql
SELECT COUNT(*) FROM likes WHERE tweet_id = $1;
```

**Option 2: Denormalized like_count column**
```sql
ALTER TABLE tweets ADD COLUMN like_count INTEGER DEFAULT 0;
UPDATE tweets SET like_count = like_count + 1 WHERE id = $1;
```

**Option 3: Redis cache**
```typescript
await redis.incr(`tweet:${tweetId}:likes`);
```

### Rationale

**Option 1 (Selected)**:
- ✅ Always accurate (source of truth is likes table)
- ✅ No synchronization issues
- ✅ No additional complexity
- ✅ Fast with proper indexes (< 100ms even with millions of likes)
- ✅ YAGNI (don't optimize prematurely)

**Option 2 (Rejected for MVP)**:
- ❌ Requires triggers or application logic to keep in sync
- ❌ Risk of desynchronization (bugs, race conditions)
- ❌ More complex to implement
- ✅ Consider later if COUNT(*) becomes bottleneck

**Option 3 (Rejected for MVP)**:
- ❌ Adds external dependency (Redis)
- ❌ Requires cache invalidation strategy
- ❌ Can desynchronize from database
- ✅ Consider later for high-traffic tweets

**Decision**: Use `COUNT(*)` for MVP. Optimize later if performance data shows need.

**Performance Target**: < 100ms for like count query with proper indexes.

---

## Decision 5: Optimistic UI vs Server Confirmation

### Options Considered

**Option 1: Optimistic UI updates** ✅ **SELECTED**
```typescript
// Update UI immediately
setLiked(true);
setCount(count + 1);

// Then make API call
fetch('/api/tweets/:id/like', { method: 'POST' })
  .catch(() => {
    // Rollback on error
    setLiked(false);
    setCount(count);
  });
```

**Option 2: Wait for server confirmation**
```typescript
// Show loading state
setLoading(true);

// Make API call
const response = await fetch('/api/tweets/:id/like', { method: 'POST' });

// Update UI after success
setLiked(true);
setCount(count + 1);
setLoading(false);
```

**Option 3: Hybrid (optimistic + confirmation)**
```typescript
// Update UI immediately (optimistic)
setLiked(true);
setCount(count + 1);

// Fetch real count from server
const response = await fetch('/api/tweets/:id/likes');
setCount(response.count); // Sync with server
```

### Rationale

**Option 1 (Selected)**:
- ✅ Instant feedback (0ms perceived latency)
- ✅ Better user experience
- ✅ Handles network delays gracefully
- ✅ Rollback on error maintains correctness

**Option 2 (Rejected)**:
- ❌ 500ms wait for feedback (poor UX)
- ❌ Feels slow/unresponsive
- ✅ Simpler (no rollback logic)

**Option 3 (Rejected for MVP)**:
- ❌ Extra API call (wasteful)
- ❌ More complex (optimistic + sync logic)
- ✅ Consider if count desynchronization becomes issue

**Decision**: Use optimistic UI updates with rollback on error.

**Trade-off**: Slight complexity in rollback logic vs significantly better UX.

---

## Decision 6: Like Button Icon & Visual States

### Options Considered

**Option 1: Heart icon (outline/filled)** ✅ **SELECTED**
- Unliked: ♡ (outline heart, gray)
- Liked: ❤️ (filled heart, red)

**Option 2: Thumbs up icon**
- Unliked: 👍 (outline)
- Liked: 👍 (filled, blue)

**Option 3: Star icon**
- Unliked: ☆ (outline star, gray)
- Liked: ★ (filled star, yellow)

### Rationale

**Option 1 (Selected)**:
- ✅ Industry standard (Twitter, Instagram, Facebook use hearts)
- ✅ Universal recognition (users understand instantly)
- ✅ Emotional association (heart = love/appreciation)
- ✅ Clear visual distinction (outline vs filled)

**Option 2 (Rejected)**:
- ❌ Less common for "like" functionality
- ❌ Thumbs up can imply approval/agreement vs appreciation

**Option 3 (Rejected)**:
- ❌ Stars often mean "favorite" or "bookmark" (different semantic meaning)
- ❌ Less emotional connection

**Decision**: Use heart icon (♡/❤️) with outline → filled transition.

**Color Scheme**:
- Unliked: `text-gray-500` (Tailwind)
- Liked: `text-red-500` (Tailwind)
- Hover: `text-red-400` (Tailwind)
- Disabled: `text-gray-300` (Tailwind)

---

## Decision 7: Batch Querying for Tweet Lists

### Options Considered

**Option 1: N+1 queries (one per tweet)** ❌ **REJECTED**
```typescript
for (const tweet of tweets) {
  tweet.likeCount = await getLikeCount(tweet.id);
  tweet.userLiked = await checkUserLiked(userId, tweet.id);
}
```

**Option 2: Single batch query with IN clause** ✅ **SELECTED**
```typescript
const likeData = await getLikesByTweetIds(tweets.map(t => t.id), userId);
// Single query:
// SELECT tweet_id, COUNT(*) as count,
//        MAX(CASE WHEN user_id = $userId THEN 1 ELSE 0 END) as user_liked
// FROM likes
// WHERE tweet_id IN ($1, $2, ..., $N)
// GROUP BY tweet_id
```

**Option 3: Join query**
```typescript
const tweetsWithLikes = await sql`
  SELECT t.*, COUNT(l.id) as like_count,
         MAX(CASE WHEN l.user_id = ${userId} THEN 1 ELSE 0 END) as user_liked
  FROM tweets t
  LEFT JOIN likes l ON l.tweet_id = t.id
  WHERE t.id IN (${tweetIds})
  GROUP BY t.id
`;
```

### Rationale

**Option 1 (Rejected)**:
- ❌ N+1 query problem (50 tweets = 100 queries!)
- ❌ Extremely slow (5000ms+ for 50 tweets)
- ❌ Database connection exhaustion risk

**Option 2 (Selected)**:
- ✅ Single database round trip
- ✅ Fast (< 200ms for 50 tweets)
- ✅ Reusable service function
- ✅ Separation of concerns (likes service doesn't need tweet logic)

**Option 3 (Rejected)**:
- ❌ Couples likes logic with tweets logic
- ❌ Harder to test independently
- ✅ Slightly more efficient (single query vs two)
- ✅ Consider if performance becomes critical

**Decision**: Use batch query with `IN` clause for efficiency.

**Implementation**:
```typescript
export async function getLikesByTweetIds(
  tweetIds: string[],
  userId?: string
): Promise<Array<{ tweetId: string; count: number; userLiked: boolean }>> {
  const results = await sql`
    SELECT
      tweet_id,
      COUNT(*) as count,
      ${userId ? sql`MAX(CASE WHEN user_id = ${userId} THEN 1 ELSE 0 END)` : sql`0`} as user_liked
    FROM likes
    WHERE tweet_id IN ${sql(tweetIds)}
    GROUP BY tweet_id
  `;

  // Map results to include tweets with 0 likes
  return tweetIds.map(tweetId => {
    const result = results.find(r => r.tweetId === tweetId);
    return {
      tweetId,
      count: result?.count || 0,
      userLiked: result?.userLiked === 1,
    };
  });
}
```

---

## Decision 8: Anonymous User Handling

### Options Considered

**Option 1: Show like count, disable button** ✅ **SELECTED**
```typescript
<LikeButton
  tweetId={tweet.id}
  count={tweet.likeCount}
  userLiked={false}
  disabled={!isAuthenticated}
  onClick={isAuthenticated ? handleLike : () => alert('Log in to like')}
/>
```

**Option 2: Hide like button entirely**
```typescript
{isAuthenticated && (
  <LikeButton ... />
)}
<span>{tweet.likeCount} likes</span>
```

**Option 3: Redirect to login on click**
```typescript
<LikeButton
  onClick={() => router.push('/login?redirect=' + currentUrl)}
/>
```

### Rationale

**Option 1 (Selected)**:
- ✅ Transparent (anonymous users see social proof)
- ✅ Clear affordance (button exists but disabled)
- ✅ Encourages sign-up (users see feature but can't use it)
- ✅ Consistent UI (button always present)

**Option 2 (Rejected)**:
- ❌ Inconsistent UI (button appears/disappears)
- ❌ Harder to discover feature
- ❌ Like count placement unclear

**Option 3 (Rejected for MVP)**:
- ❌ Surprising behavior (click = redirect)
- ❌ More complex (requires redirect state management)
- ✅ Consider for future enhancement

**Decision**: Show disabled like button for anonymous users with tooltip/message.

**UX Details**:
- Button: Outline heart icon (gray)
- State: `disabled` attribute set
- Cursor: `cursor-not-allowed`
- Tooltip: "Log in to like tweets" (on hover)
- ARIA: `aria-label="Like this tweet (login required)"`

---

## Decision 9: Error Handling Strategy

### Options Considered

**Option 1: Toast notifications** ✅ **SELECTED**
```typescript
try {
  await likeService.createLike(tweetId);
} catch (error) {
  toast.error('Failed to like tweet. Please try again.');
  rollback();
}
```

**Option 2: Inline error messages**
```typescript
<LikeButton error={error} />
// Shows error below button: "Failed to like tweet"
```

**Option 3: Silent failure (retry automatically)**
```typescript
try {
  await likeService.createLike(tweetId);
} catch (error) {
  // Retry 3 times automatically
  await retry(() => likeService.createLike(tweetId), { retries: 3 });
}
```

### Rationale

**Option 1 (Selected)**:
- ✅ Non-blocking (doesn't disrupt UI)
- ✅ Temporary (auto-dismisses after 3 seconds)
- ✅ Clear feedback (user knows what happened)
- ✅ Standard pattern (users expect toasts)

**Option 2 (Rejected)**:
- ❌ Clutters UI (error message below every tweet)
- ❌ Doesn't auto-dismiss (requires manual clear)
- ❌ Takes up space

**Option 3 (Rejected)**:
- ❌ Silent failures confuse users
- ❌ Retries may fail repeatedly (wastes resources)
- ❌ No user feedback

**Decision**: Use toast notifications with rollback for errors.

**Error Categories**:
- **Network errors**: "Failed to like tweet. Check your connection."
- **Authentication errors (401)**: "Please log in to like tweets." + redirect to login
- **Not found errors (404)**: "This tweet no longer exists." + disable button
- **Server errors (500)**: "Something went wrong. Please try again."

---

## Decision 10: Keyboard Accessibility

### Options Considered

**Option 1: Native button element** ✅ **SELECTED**
```typescript
<button
  onClick={handleLike}
  aria-label={liked ? 'Unlike this tweet' : 'Like this tweet'}
  aria-pressed={liked}
>
  {liked ? <HeartFilledIcon /> : <HeartOutlineIcon />}
</button>
```

**Option 2: Div with role="button"**
```typescript
<div
  role="button"
  tabIndex={0}
  onClick={handleLike}
  onKeyPress={(e) => e.key === 'Enter' && handleLike()}
>
  ...
</div>
```

**Option 3: Link element**
```typescript
<a
  href="#"
  onClick={(e) => { e.preventDefault(); handleLike(); }}
>
  ...
</a>
```

### Rationale

**Option 1 (Selected)**:
- ✅ Native keyboard support (Space/Enter)
- ✅ Native focus management (Tab navigation)
- ✅ Semantic HTML (button = action)
- ✅ Screen reader support (announced as button)
- ✅ No custom keypress handling needed

**Option 2 (Rejected)**:
- ❌ Requires custom keypress handling
- ❌ More complex (DIY accessibility)
- ❌ Easy to forget edge cases (Space key, etc.)

**Option 3 (Rejected)**:
- ❌ Wrong semantic (link = navigation, not action)
- ❌ Requires preventDefault (hacky)

**Decision**: Use native `<button>` element with ARIA attributes.

**Accessibility Checklist**:
- ✅ `<button>` element (native keyboard support)
- ✅ `aria-label` (describes action)
- ✅ `aria-pressed` (indicates toggle state)
- ✅ Visible focus indicator (`:focus` styles)
- ✅ Minimum 44x44px tap target (mobile-friendly)
- ✅ Color contrast (WCAG AA compliant)
- ✅ Disabled state (`disabled` attribute, not just visual)

---

## Summary of Key Decisions

| Decision | Selected Approach | Rationale |
|----------|------------------|-----------|
| Database Schema | Separate `likes` table | Normalized, scalable, easy to query |
| Idempotency | `ON CONFLICT DO NOTHING` | Database-level, no race conditions |
| API Structure | Nested `/api/tweets/:id/like` | RESTful, semantic |
| Like Count | `COUNT(*)` query | Simple, accurate, fast with indexes |
| UI Updates | Optimistic with rollback | Instant feedback, better UX |
| Like Icon | Heart (♡/❤️) | Industry standard, universal |
| Batch Queries | Single `IN` query | Avoids N+1 problem, fast |
| Anonymous Users | Show disabled button | Transparent, encourages sign-up |
| Error Handling | Toast notifications | Non-blocking, clear feedback |
| Accessibility | Native `<button>` | Best keyboard/screen reader support |

All decisions prioritize **simplicity**, **performance**, and **user experience** while maintaining constitutional compliance.

---

**Research Status**: ✅ COMPLETE

Ready for data model definition and API contracts.
