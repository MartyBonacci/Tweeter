# Technical Implementation Plan: Users Can Like Tweets

**Feature**: 003-users-can-like-tweets
**Date**: 2025-10-08
**Phase**: 1 (Design & Contracts)

---

## Constitution Compliance Check

### Principle I: Functional Programming First ✅

**Pure Functions in Service Layer**:
```typescript
// src/services/like.service.ts
export async function createLike(userId: string, tweetId: string): Promise<Like>
export async function deleteLike(userId: string, tweetId: string): Promise<void>
export async function getLikeCount(tweetId: string): Promise<number>
export async function checkUserLiked(userId: string, tweetId: string): Promise<boolean>
export async function getLikesByTweetIds(tweetIds: string[], userId?: string): Promise<LikeData[]>
```

All functions are pure: deterministic input → output, no side effects beyond database operations.

**Immutability**: TypeScript `readonly` and `const` enforced throughout.

**Status**: ✅ Satisfied

---

### Principle II: API-First Architecture ✅

**REST Endpoints Defined Before Implementation**:

```
POST   /api/tweets/:tweetId/like   (Create like - idempotent)
DELETE /api/tweets/:tweetId/like   (Remove like - idempotent)
GET    /api/tweets/:tweetId/likes  (Get like count + user status)
```

**API Contract Verification**:
- Contracts defined in `contracts/api-endpoints.md`
- Request/response schemas documented before coding
- Contract tests written before implementation
- Frontend depends on API contracts, not implementation

**Status**: ✅ Satisfied

---

### Principle III: Test-First Development (TDD) ✅

**Mandatory Test-Driven Workflow**:

1. **Red Phase**: Write contract tests → verify they FAIL
2. **Green Phase**: Implement code → verify tests PASS
3. **Refactor Phase**: Improve code while keeping tests green

**Test Coverage Required**:
- Contract tests: 12+ tests for all API endpoints
- Integration tests: 6+ tests for full user flows
- Unit tests: 8+ tests for service layer functions
- Total: 26+ tests (minimum)

**Checkpoint Requirements**:
- ⚠️ Tests MUST fail before implementation (Red phase verification)
- ⚠️ Tests MUST pass after implementation (Green phase verification)
- ⚠️ NO implementation without tests

**Status**: ✅ Satisfied (enforced in tasks.md)

---

### Principle IV: Type Safety Chain ✅

**Zod → TypeScript → PostgreSQL Synchronization**:

```typescript
// 1. Zod Schema (validation)
export const LikeSchema = z.object({
  tweetId: z.string().uuid(),
});

// 2. TypeScript Types (application)
export interface Like {
  id: string;
  userId: string;
  tweetId: string;
  createdAt: Date;
}

export type LikeInput = z.infer<typeof LikeSchema>;

// 3. PostgreSQL Schema (storage)
CREATE TABLE likes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tweet_id UUID REFERENCES tweets(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tweet_id)
);
```

**Type Safety Guarantees**:
- Zod validates all API inputs
- TypeScript enforces types at compile time
- PostgreSQL enforces constraints at runtime
- No type mismatches possible

**Status**: ✅ Satisfied

---

### Principle V: Security for MVP ✅

**Authentication & Authorization**:
- Like/unlike endpoints require `requireAuth` middleware (session cookie validation)
- View like counts is public (no auth required)
- No additional authorization needed (users can like any tweet)

**SQL Injection Prevention**:
- Parameterized queries via `postgres` package template literals
- No string concatenation in SQL
- All UUIDs validated by Zod before database operations

**Data Integrity**:
- Foreign key constraints: `user_id REFERENCES users(id) ON DELETE CASCADE`
- Foreign key constraints: `tweet_id REFERENCES tweets(id) ON DELETE CASCADE`
- Unique constraint: `UNIQUE(user_id, tweet_id)` prevents duplicate likes
- Database transactions ensure atomicity

**Status**: ✅ Satisfied

---

### Principle VI: Simplicity & YAGNI ✅

**What We're Building (MVP Only)**:
- ✅ Like button with toggle behavior
- ✅ Like count display on tweets
- ✅ Persist likes to database
- ✅ Three API endpoints (like, unlike, get likes)
- ✅ Basic UI with heart icon (filled/unfilled states)

**What We're NOT Building (Future Enhancements)**:
- ❌ Like notifications to tweet author
- ❌ "Who liked this" user list
- ❌ Liked tweets page on profile
- ❌ Like activity feed
- ❌ Animated like button effects
- ❌ Like analytics or trending
- ❌ Rate limiting (trust users for MVP)
- ❌ Denormalized like_count column (optimize later if needed)

**Decision**: Start simple, add complexity only when data shows it's needed.

**Status**: ✅ Satisfied

---

## Constitution Check Status: ✅ PASSED

All 6 constitutional principles satisfied. No violations detected.

---

## Project Structure (Extends 001 + 002)

### New Files to Create

```
src/
├── db/
│   └── migrations/
│       └── 004_create_likes.sql          # NEW: Likes table migration
├── schemas/
│   └── like.schema.ts                    # NEW: Zod validation for likes
├── services/
│   └── like.service.ts                   # NEW: Pure like functions
├── api/
│   └── routes/
│       └── likes.ts                      # NEW: Like API endpoints
└── app/
    └── components/
        └── LikeButton.tsx                # NEW: Like button component

tests/
├── contract/
│   └── likes.contract.test.ts            # NEW: API contract tests
└── integration/
    └── like-flow.test.ts                 # NEW: Full flow tests

specs/
└── 003-users-can-like-tweets/
    ├── spec.md                           # ✅ COMPLETE
    ├── plan.md                           # ← YOU ARE HERE
    ├── research.md                       # To be created
    ├── data-model.md                     # To be created
    ├── contracts/
    │   └── api-endpoints.md              # To be created
    ├── quickstart.md                     # To be created
    └── tasks.md                          # To be created
```

### Files to Modify

```
src/
├── types/index.ts                        # Add Like interface
├── schemas/index.ts                      # Export LikeSchema
├── api/routes/index.ts                   # Register like routes
└── app/components/
    ├── TweetItem.tsx                     # Add LikeButton component
    └── TweetList.tsx                     # Pass like data to TweetItem

scripts/
└── run-migrations.ts                     # Add migration 004
```

**Key Decision**: Minimal new structure - reuses all existing patterns from 001 and 002.

---

## Architecture Overview

### Database Layer

**New Table**: `likes`
- Primary key: `id` (UUIDv7)
- Foreign keys: `user_id`, `tweet_id` (CASCADE DELETE)
- Unique constraint: `(user_id, tweet_id)` prevents duplicates
- Indexes: `idx_likes_user_id`, `idx_likes_tweet_id` for fast lookups

**Relationships**:
```
User (1) ←→ (*) Like ←→ (*) Tweet (1)

One user can have many likes
One tweet can have many likes
One like belongs to one user and one tweet
```

---

### Service Layer (Pure Functions)

**like.service.ts**:
```typescript
// Create like (idempotent - returns existing if duplicate)
export async function createLike(userId: string, tweetId: string): Promise<Like>

// Delete like (idempotent - silent if doesn't exist)
export async function deleteLike(userId: string, tweetId: string): Promise<void>

// Get like count for a tweet
export async function getLikeCount(tweetId: string): Promise<number>

// Check if user has liked a tweet
export async function checkUserLiked(userId: string, tweetId: string): Promise<boolean>

// Batch: Get like data for multiple tweets (efficient for tweet lists)
export async function getLikesByTweetIds(
  tweetIds: string[],
  userId?: string
): Promise<Array<{ tweetId: string; count: number; userLiked: boolean }>>
```

**Design Principle**: All functions are pure (input → output), database operations are the only side effects.

---

### API Layer (RESTful Endpoints)

**POST /api/tweets/:tweetId/like**:
- Requires: Authentication (session cookie)
- Body: `{ tweetId }` (validated by Zod)
- Response: `201 Created { like: { id, userId, tweetId, createdAt } }`
- Idempotent: Returns existing like if already exists (no error)

**DELETE /api/tweets/:tweetId/like**:
- Requires: Authentication (session cookie)
- Response: `204 No Content`
- Idempotent: Returns 204 even if like doesn't exist (no error)

**GET /api/tweets/:tweetId/likes**:
- Requires: None (public endpoint)
- Response: `200 OK { count: number, userLiked: boolean }`
- Anonymous users: `userLiked` always `false`

**Route Registration**:
```typescript
// src/api/routes/index.ts
router.use('/tweets', tweetRoutes); // Existing
router.use('/likes', likeRoutes);   // NEW (alternative: nest under tweets)
```

**Decision**: Nest like routes under `/api/tweets/:tweetId/like` (RESTful resource nesting).

---

### Frontend Layer (React + Remix)

**LikeButton Component**:
```typescript
interface LikeButtonProps {
  tweetId: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
}

export function LikeButton({ tweetId, initialCount, initialLiked, isAuthenticated }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Optimistic UI: Update immediately, rollback on error
  // POST or DELETE based on current state
  // Accessibility: ARIA labels, keyboard support
}
```

**States**:
1. **Unliked**: Outline heart icon (gray), count visible
2. **Liked**: Filled heart icon (red), count visible
3. **Loading**: Disabled button, spinner or opacity
4. **Error**: Revert to previous state, show toast notification

**Integration**:
- Add `<LikeButton />` to `TweetItem.tsx` component
- Fetch like data in loaders (batch query for efficiency)
- Pass initial state as props (SSR-friendly)

---

## Data Flow

### Like Flow (User clicks like button)

```
1. User clicks LikeButton (unliked state)
   ↓
2. Optimistic UI update (set liked=true, count+1)
   ↓
3. POST /api/tweets/:tweetId/like
   ↓
4. requireAuth middleware (validate session)
   ↓
5. validate(LikeSchema) middleware (validate tweetId)
   ↓
6. Route handler calls createLike(userId, tweetId)
   ↓
7. Service function inserts into likes table (ON CONFLICT DO NOTHING)
   ↓
8. Return 201 Created { like }
   ↓
9. Frontend receives success → keep optimistic update
   OR
   Frontend receives error → rollback UI (set liked=false, count-1)
```

---

### Unlike Flow (User clicks like button again)

```
1. User clicks LikeButton (liked state)
   ↓
2. Optimistic UI update (set liked=false, count-1)
   ↓
3. DELETE /api/tweets/:tweetId/like
   ↓
4. requireAuth middleware (validate session)
   ↓
5. Route handler calls deleteLike(userId, tweetId)
   ↓
6. Service function deletes from likes table (silent if not exists)
   ↓
7. Return 204 No Content
   ↓
8. Frontend receives success → keep optimistic update
   OR
   Frontend receives error → rollback UI (set liked=true, count+1)
```

---

### View Like Count Flow (Anonymous user views tweet)

```
1. Page loads with tweet list
   ↓
2. Loader fetches tweets + like data (batch query)
   ↓
3. GET /api/tweets/:tweetId/likes (or batch endpoint)
   ↓
4. Service function: COUNT(*) + check user's like status
   ↓
5. Return { count: N, userLiked: false } (anonymous)
   ↓
6. Render TweetItem with LikeButton (disabled for anonymous)
```

---

## Performance Optimization

### Database Indexes

**Required Indexes**:
```sql
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_tweet_id ON likes(tweet_id);
```

**Rationale**:
- Fast lookup: "Did user X like tweet Y?" (CHECK query)
- Fast aggregation: "How many likes does tweet Y have?" (COUNT query)
- Fast cleanup: "Delete all likes by user X" (CASCADE DELETE)

**Query Performance Targets**:
- createLike: < 50ms (single INSERT)
- deleteLike: < 50ms (single DELETE)
- getLikeCount: < 50ms (single COUNT with index)
- checkUserLiked: < 50ms (single SELECT with composite lookup)
- getLikesByTweetIds (batch): < 200ms for 50 tweets

---

### API Optimization

**Batch Queries for Tweet Lists**:
```typescript
// Instead of N queries (one per tweet):
for (const tweet of tweets) {
  const count = await getLikeCount(tweet.id);
  const liked = await checkUserLiked(userId, tweet.id);
}

// Use single batch query:
const likeData = await getLikesByTweetIds(tweets.map(t => t.id), userId);
// Returns all like data in one round trip
```

**Caching (Future Optimization)**:
- Not implemented in MVP (premature optimization)
- Consider Redis caching if like count queries become bottleneck
- Denormalize `like_count` column on tweets table if COUNT(*) is slow

---

### Frontend Optimization

**Optimistic UI Updates**:
- Instant feedback (no waiting for API response)
- Reduces perceived latency from 500ms to 0ms
- Rollback on error maintains correctness

**Debouncing NOT Needed**:
- Like/unlike is a toggle action (not continuous input)
- Rapid clicking handled by setting loading state
- Final state persists after last click

---

## Error Handling

### API Error Responses

**400 Bad Request**: Invalid tweet ID format (not a UUID)
```json
{ "error": "Validation failed", "errors": [{ "path": "tweetId", "message": "Invalid UUID" }] }
```

**401 Unauthorized**: User not authenticated
```json
{ "error": "Unauthorized" }
```

**404 Not Found**: Tweet doesn't exist
```json
{ "error": "Tweet not found" }
```

**500 Internal Server Error**: Database or server error
```json
{ "error": "Failed to create like" }
```

---

### Frontend Error Handling

**Network Errors**:
- Display toast notification: "Failed to like tweet. Please try again."
- Rollback optimistic UI update
- Provide retry button

**Authentication Errors (401)**:
- Redirect to login page
- Show message: "Please log in to like tweets"

**Tweet Deleted (404)**:
- Disable like button
- Show message: "This tweet has been deleted"

---

## Testing Strategy

### Contract Tests (API Layer)

**POST /api/tweets/:tweetId/like**:
- ✅ Creates like and returns 201 when authenticated
- ✅ Returns 401 when unauthenticated
- ✅ Returns 404 when tweet doesn't exist
- ✅ Is idempotent (duplicate like returns existing, not error)
- ✅ Increments like count correctly

**DELETE /api/tweets/:tweetId/like**:
- ✅ Removes like and returns 204 when authenticated
- ✅ Returns 401 when unauthenticated
- ✅ Is idempotent (unliking non-existent like returns 204, not error)
- ✅ Decrements like count correctly

**GET /api/tweets/:tweetId/likes**:
- ✅ Returns correct count and userLiked=true when user liked
- ✅ Returns correct count and userLiked=false when user didn't like
- ✅ Returns userLiked=false for anonymous users
- ✅ Allows anonymous access (no auth required)

---

### Integration Tests (Full Flows)

- ✅ Register → Post tweet → Like tweet → Verify count increments
- ✅ Like tweet → Unlike tweet → Verify count decrements
- ✅ User A likes tweet → User B sees updated count
- ✅ Anonymous user views tweet → Sees like count but cannot like
- ✅ Like persists across page refresh
- ✅ Multiple users like same tweet → Count is accurate

---

### Unit Tests (Service Layer)

- ✅ createLike inserts record into database
- ✅ createLike handles duplicate (ON CONFLICT)
- ✅ deleteLike removes record from database
- ✅ deleteLike is silent when like doesn't exist
- ✅ getLikeCount returns accurate count
- ✅ checkUserLiked returns correct boolean
- ✅ getLikesByTweetIds returns batch data efficiently

---

## Migration Strategy

### Database Migration (004_create_likes.sql)

```sql
-- Create likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tweet_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_tweet_id ON likes(tweet_id);
```

**Verification Steps**:
1. Check table exists: `\dt likes`
2. Check indexes: `\di idx_likes_*`
3. Check constraints: `SELECT conname FROM pg_constraint WHERE conrelid='likes'::regclass`
4. Test insert: `INSERT INTO likes (id, user_id, tweet_id) VALUES (...)`

**Rollback Plan**:
```sql
DROP TABLE likes CASCADE;
```

No data loss concerns (new feature, no existing data).

---

## Implementation Order

### Phase 1: Foundation (Database + Types)
1. Create migration 004_create_likes.sql
2. Update types/index.ts (add Like interface)
3. Create schemas/like.schema.ts (Zod validation)
4. Run migration and verify

### Phase 2: TDD - Write Tests FIRST
5. Write contract tests (likes.contract.test.ts)
6. Write integration tests (like-flow.test.ts)
7. **RUN TESTS → VERIFY THEY FAIL** (Red phase)

### Phase 3: Implement Backend
8. Create services/like.service.ts (pure functions)
9. Create api/routes/likes.ts (Express routes)
10. Register routes in api/routes/index.ts
11. **RUN TESTS → VERIFY THEY PASS** (Green phase)

### Phase 4: Implement Frontend
12. Create components/LikeButton.tsx
13. Update TweetItem.tsx (integrate LikeButton)
14. Update loaders to fetch like data
15. Test UI manually

### Phase 5: Polish & Validation
16. Accessibility testing (keyboard, screen reader)
17. Error handling and edge cases
18. Performance testing (100 concurrent requests)
19. Full regression testing (all 001/002/003 tests pass)

---

## Dependencies & Prerequisites

### Required from Feature 001
- ✅ User authentication system
- ✅ Session middleware
- ✅ `requireAuth` middleware
- ✅ User database table

### Required from Feature 002
- ✅ Tweets database table
- ✅ Tweet API endpoints
- ⚠️ TweetItem component (needs to be created for 002 frontend)
- ⚠️ TweetList component (needs to be created for 002 frontend)

**Note**: Feature 002 backend is complete, but frontend is pending. We can build 003 frontend alongside 002 frontend.

---

## Risk Assessment

### Low Risk ✅
- Database schema (standard many-to-many pattern)
- API implementation (follows 001/002 patterns)
- Type safety chain (well-established)

### Medium Risk ⚠️
- Race conditions (rapid like/unlike toggling)
  - **Mitigation**: Database UNIQUE constraint + idempotent endpoints
- Optimistic UI error handling
  - **Mitigation**: Rollback logic + toast notifications
- Batch query performance with many tweets
  - **Mitigation**: Database indexes + testing with 100 tweets

### High Risk ❌
- None identified

---

## Complexity Tracking

**Complexity**: Low-Medium (3/10)

**Why Low-Medium?**:
- Simple CRUD operations (Create, Read, Delete)
- Standard many-to-many relationship
- Follows existing patterns from 001/002
- No complex business logic

**Estimated Time**: 3-4 hours with TDD

**Lines of Code Estimate**:
- Migration: ~30 lines
- Service: ~80 lines
- API routes: ~60 lines
- Frontend component: ~120 lines
- Tests: ~200 lines
- **Total**: ~490 lines

---

## Success Metrics

**Implementation Complete When**:
- ✅ All 26+ tests passing (contract + integration + unit)
- ✅ User can like/unlike tweets with immediate visual feedback
- ✅ Like counts persist across page refreshes
- ✅ Multiple users can like same tweet without conflicts
- ✅ Anonymous users can view like counts
- ✅ Performance targets met (< 500ms for like operations)
- ✅ All 001/002 tests still passing (no regressions)

---

## Next Steps

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Follow TDD workflow: Tests first → Red → Implementation → Green → Refactor
3. Commit after each phase completion

---

**Planning Status**: ✅ COMPLETE

Ready for task breakdown and implementation.
