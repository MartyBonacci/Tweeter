# Quickstart: Like Feature Implementation

**Feature**: 003-users-can-like-tweets
**Estimated Time**: 3-4 hours (with TDD)
**Prerequisites**: Features 001 and 002 (backend) must be complete

## Prerequisites

1. **Feature 001 Complete**: Users, authentication working ✅
2. **Feature 002 Complete**: Tweets backend working ✅ (frontend pending)
3. **Database**: PostgreSQL via Neon provisioned ✅
4. **Environment**: Node.js 18+, npm, .env configured ✅
5. **Tests Passing**: All tests from 001/002 passing (26 tests) ✅

## Step-by-Step Implementation Guide

### Phase 1: Database Migration (10 min)

```bash
# Create migration file
# SQL provided in data-model.md

# Run migration
npx tsx scripts/migrate-004.ts

# Verify
psql $DATABASE_URL -c "\dt likes"
psql $DATABASE_URL -c "\di idx_likes_*"
```

**Verification SQL**:
```sql
-- Test insert
INSERT INTO likes (id, user_id, tweet_id)
VALUES (uuid_generate_v4(), 'valid-user-id', 'valid-tweet-id');
-- Should succeed ✓

-- Test unique constraint
INSERT INTO likes (id, user_id, tweet_id)
VALUES (uuid_generate_v4(), 'valid-user-id', 'valid-tweet-id');
-- Should fail with UNIQUE constraint violation ✓
```

---

### Phase 2: Zod Schema (15 min)

**TDD Step 1**: Write tests FIRST

```typescript
// tests/unit/like.schema.test.ts
import { LikeSchema } from '../src/schemas/like.schema';

test('LikeSchema validates valid tweet ID', () => {
  expect(LikeSchema.parse({
    tweetId: '01936c8e-9999-8888-7777-666655554444'
  })).toBeTruthy();
});

test('LikeSchema rejects invalid UUID', () => {
  expect(() => LikeSchema.parse({ tweetId: 'not-a-uuid' })).toThrow();
});
```

**TDD Step 2**: Run tests → FAIL (Red phase)

**TDD Step 3**: Implement schema

```typescript
// src/schemas/like.schema.ts
import { z } from 'zod';

export const LikeSchema = z.object({
  tweetId: z.string().uuid('Invalid tweet ID format'),
});

export type LikeInput = z.infer<typeof LikeSchema>;
```

**TDD Step 4**: Tests pass → GREEN

---

### Phase 3: Types (10 min)

```typescript
// src/types/index.ts
export interface Like {
  id: string;
  userId: string;
  tweetId: string;
  createdAt: Date;
}

export interface LikeData {
  tweetId: string;
  count: number;
  userLiked: boolean;
}

export type { LikeInput } from '../schemas/like.schema.js';
```

---

### Phase 4: Service Layer (30 min)

**TDD**: Write service tests FIRST

```typescript
// tests/unit/like.service.test.ts
import { createLike, deleteLike, getLikeCount } from '../src/services/like.service';

test('createLike inserts like into database', async () => {
  const like = await createLike('user-id', 'tweet-id');
  expect(like.userId).toBe('user-id');
  expect(like.tweetId).toBe('tweet-id');
});

test('createLike is idempotent', async () => {
  const like1 = await createLike('user-id', 'tweet-id');
  const like2 = await createLike('user-id', 'tweet-id');
  expect(like1.id).toBe(like2.id); // Same like returned
});

test('getLikeCount returns accurate count', async () => {
  await createLike('user1', 'tweet-id');
  await createLike('user2', 'tweet-id');
  const count = await getLikeCount('tweet-id');
  expect(count).toBe(2);
});
```

**Implementation**: See data-model.md for full service functions

---

### Phase 5: Contract Tests (45 min)

**TDD CRITICAL**: Write ALL contract tests BEFORE implementing routes

```typescript
// tests/contract/likes.contract.test.ts
import request from 'supertest';
import { app } from '../../src/api/server.js';

describe('POST /api/tweets/:tweetId/like', () => {
  let sessionCookie: string[];
  let tweetId: string;

  beforeEach(async () => {
    // Register and post tweet
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'liketest' + Date.now(), password: 'password123' });
    sessionCookie = regRes.headers['set-cookie'];

    const tweetRes = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Test tweet for likes' });
    tweetId = tweetRes.body.tweet.id;
  });

  test('creates like and returns 201', async () => {
    const res = await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(201);
    expect(res.body.like).toHaveProperty('id');
    expect(res.body.like.tweetId).toBe(tweetId);
  });

  test('is idempotent (duplicate like returns existing)', async () => {
    const res1 = await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    const res2 = await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    expect(res1.body.like.id).toBe(res2.body.like.id);
  });

  test('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .post(`/api/tweets/${tweetId}/like`);

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/tweets/:tweetId/like', () => {
  test('removes like and returns 204', async () => {
    // Like first
    await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    // Unlike
    const res = await request(app)
      .delete(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(204);
  });

  test('is idempotent (unliking non-existent returns 204)', async () => {
    const res = await request(app)
      .delete(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(204);
  });
});

describe('GET /api/tweets/:tweetId/likes', () => {
  test('returns correct count and user like status', async () => {
    // Like the tweet
    await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    // Get likes
    const res = await request(app)
      .get(`/api/tweets/${tweetId}/likes`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.userLiked).toBe(true);
  });

  test('allows anonymous access', async () => {
    const res = await request(app)
      .get(`/api/tweets/${tweetId}/likes`);

    expect(res.status).toBe(200);
    expect(res.body.userLiked).toBe(false); // Anonymous
  });
});
```

**Run tests** → Should FAIL (Red phase, routes don't exist yet)

---

### Phase 6: Express API Routes (1 hour)

```typescript
// src/api/routes/tweets.ts (extend existing)
import { createLike, deleteLike, getLikeCount, checkUserLiked } from '../../services/like.service.js';

// POST /api/tweets/:tweetId/like
router.post('/:tweetId/like', requireAuth, async (req, res, next) => {
  try {
    const { tweetId } = req.params;
    const userId = req.session.userId!;

    const like = await createLike(userId, tweetId);
    res.status(201).json({ like });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tweets/:tweetId/like
router.delete('/:tweetId/like', requireAuth, async (req, res, next) => {
  try {
    const { tweetId } = req.params;
    const userId = req.session.userId!;

    await deleteLike(userId, tweetId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/tweets/:tweetId/likes
router.get('/:tweetId/likes', async (req, res, next) => {
  try {
    const { tweetId } = req.params;
    const userId = req.session?.userId;

    const count = await getLikeCount(tweetId);
    const userLiked = userId ? await checkUserLiked(userId, tweetId) : false;

    res.status(200).json({ tweetId, count, userLiked });
  } catch (error) {
    next(error);
  }
});
```

**Run contract tests** → Should PASS (Green phase)

---

### Phase 7: Integration Tests (30 min)

```typescript
// tests/integration/like-flow.test.ts
test('full flow: register → post → like → unlike', async () => {
  // Register
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ username: 'flowtest' + Date.now(), password: 'password123' });

  const sessionCookie = regRes.headers['set-cookie'];

  // Post tweet
  const tweetRes = await request(app)
    .post('/api/tweets')
    .set('Cookie', sessionCookie)
    .send({ content: 'Test tweet' });

  const tweetId = tweetRes.body.tweet.id;

  // Like tweet
  const likeRes = await request(app)
    .post(`/api/tweets/${tweetId}/like`)
    .set('Cookie', sessionCookie);

  expect(likeRes.status).toBe(201);

  // Check like count
  let likesRes = await request(app).get(`/api/tweets/${tweetId}/likes`);
  expect(likesRes.body.count).toBe(1);
  expect(likesRes.body.userLiked).toBe(true);

  // Unlike tweet
  const unlikeRes = await request(app)
    .delete(`/api/tweets/${tweetId}/like`)
    .set('Cookie', sessionCookie);

  expect(unlikeRes.status).toBe(204);

  // Check like count again
  likesRes = await request(app).get(`/api/tweets/${tweetId}/likes`);
  expect(likesRes.body.count).toBe(0);
  expect(likesRes.body.userLiked).toBe(false);
});
```

---

### Phase 8: Frontend Component (1.5 hours)

**LikeButton Component**:

```typescript
// src/app/components/LikeButton.tsx
import { useState } from 'react';
import { useFetcher } from '@remix-run/react';

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
  const fetcher = useFetcher();

  const handleToggle = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like tweets');
      return;
    }

    // Optimistic UI update
    const wasLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setLoading(true);

    try {
      const method = liked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/tweets/${tweetId}/like`, {
        method,
        credentials: 'include',
      });

      if (!response.ok) {
        // Rollback on error
        setLiked(wasLiked);
        setCount(prevCount);
        alert('Failed to update like. Please try again.');
      }
    } catch (error) {
      // Rollback on error
      setLiked(wasLiked);
      setCount(prevCount);
      alert('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!isAuthenticated || loading}
      aria-label={liked ? 'Unlike this tweet' : 'Like this tweet'}
      aria-pressed={liked}
      className={`flex items-center gap-2 ${
        liked ? 'text-red-500' : 'text-gray-500'
      } hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {liked ? (
        <HeartFilledIcon className="w-5 h-5" />
      ) : (
        <HeartOutlineIcon className="w-5 h-5" />
      )}
      <span className="text-sm">{count} {count === 1 ? 'like' : 'likes'}</span>
    </button>
  );
}
```

**Icons** (use Heroicons or similar):
```typescript
// Outline heart (unliked)
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
</svg>

// Filled heart (liked)
<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
</svg>
```

---

### Phase 9: Testing & Validation (30 min)

```bash
# Run all tests
npm test

# Expected: 38+ tests passing (26 from 001/002 + 12+ new)

# Manual testing checklist:
# [ ] Like button appears on tweets
# [ ] Click like → count increments
# [ ] Click again → count decrements (toggle)
# [ ] Refresh page → like persists
# [ ] Anonymous user sees count but button disabled
# [ ] Keyboard navigation works (Tab + Enter)
```

---

## Checklist

- [ ] Migration ran successfully (likes table exists)
- [ ] Zod schema defined and tested
- [ ] TypeScript types exported
- [ ] Service functions implemented (createLike, deleteLike, getLikeCount, checkUserLiked)
- [ ] Contract tests written and passing (12+ tests)
- [ ] Integration tests written and passing
- [ ] API endpoints implement all contracts
- [ ] Like button component created
- [ ] Optimistic UI updates work
- [ ] Error rollback works
- [ ] Anonymous users see count but cannot like
- [ ] Keyboard accessible (Tab + Enter)
- [ ] All 001/002 tests still passing (no regressions)
- [ ] Constitution compliance verified

---

## Running the App

```bash
# Terminal 1: API server
npm run api:dev

# Terminal 2: Remix dev server
npm run dev

# Terminal 3: Run tests
npm test
```

---

## Next Steps

After implementation complete:
1. Run full test suite (38+ tests passing)
2. Manual QA testing
3. Commit with message: "feat: implement like feature (003)"
4. Next feature: `/speckit.specify "..."`

---

**Estimated Total Time**: 3-4 hours with TDD
**Expected Test Count**: 38+ tests (26 from 001/002 + 12+ new)
