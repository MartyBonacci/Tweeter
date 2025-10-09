# Quickstart: Tweet Posting Implementation

**Feature**: 002-users-can-post-tweets
**Estimated Time**: 4-6 hours (with TDD)
**Prerequisites**: Feature 001-users-can-register must be complete

## Prerequisites

1. **Feature 001 Complete**: Users, profiles, authentication working
2. **Database**: PostgreSQL via Neon provisioned and accessible
3. **Environment**: Node.js 18+, npm installed, .env configured
4. **Tests Passing**: All tests from 001 passing (14 tests)

## Step-by-Step Implementation Guide

### Phase 1: Database Migration (15 min)

```bash
# Create migration file (already exists in specs)
# Copy SQL from data-model.md

# Run migration
npm run migrate

# Or manually
psql $DATABASE_URL < src/db/migrations/003_create_tweets.sql

# Verify
psql $DATABASE_URL -c "\dt tweets"
psql $DATABASE_URL -c "\di idx_tweets_*"
```

**Verification**:
```sql
-- Test insert
INSERT INTO tweets (id, user_id, content)
VALUES (uuid_generate_v4(), 'existing-user-id', 'Test tweet');

-- Should succeed ✓

-- Test constraint
INSERT INTO tweets (id, user_id, content)
VALUES (uuid_generate_v4(), 'existing-user-id', '');

-- Should fail with CHECK constraint violation ✓
```

---

### Phase 2: Zod Schema (20 min)

**TDD Step 1**: Write tests FIRST for schema validation

```typescript
// tests/unit/tweet.schema.test.ts
import { TweetSchema } from '../src/schemas/tweet.schema';

test('TweetSchema validates valid content', () => {
  expect(TweetSchema.parse({ content: 'Valid tweet' })).toBeTruthy();
});

test('TweetSchema rejects empty content', () => {
  expect(() => TweetSchema.parse({ content: '' })).toThrow();
});

test('TweetSchema rejects content exceeding 141 chars', () => {
  expect(() => TweetSchema.parse({ content: 'a'.repeat(142) })).toThrow();
});

test('TweetSchema trims whitespace', () => {
  const result = TweetSchema.parse({ content: '  test  ' });
  expect(result.content).toBe('test');
});

test('TweetSchema rejects whitespace-only', () => {
  expect(() => TweetSchema.parse({ content: '   ' })).toThrow();
});
```

**TDD Step 2**: Run tests (they should FAIL)
```bash
npm test # RED
```

**TDD Step 3**: Implement schema (see data-model.md)

```typescript
// src/schemas/tweet.schema.ts
import { z } from 'zod';

export const TweetSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Tweet cannot be empty')
    .max(141, 'Tweet exceeds 141 characters'),
});

export type TweetInput = z.infer<typeof TweetSchema>;
```

**TDD Step 4**: Tests pass
```bash
npm test # GREEN
```

---

### Phase 3: Pure Function Services (30 min)

**TDD**: Write service tests FIRST

```typescript
// tests/unit/tweet.service.test.ts
import { createTweet, getTweetsByUserId } from '../src/services/tweet.service';

test('createTweet returns tweet with all fields', async () => {
  const tweet = await createTweet('user-id', 'Test content');

  expect(tweet.id).toBeDefined();
  expect(tweet.userId).toBe('user-id');
  expect(tweet.content).toBe('Test content');
  expect(tweet.createdAt).toBeInstanceOf(Date);
});

test('getTweetsByUserId returns tweets in reverse chronological order', async () => {
  // Create tweets
  await createTweet('user-id', 'First');
  await createTweet('user-id', 'Second');

  const tweets = await getTweetsByUserId('user-id');

  expect(tweets[0].content).toBe('Second'); // Newest first
  expect(tweets[1].content).toBe('First');
});
```

**Implementation**:

```typescript
// src/services/tweet.service.ts
import { uuidv7 } from 'uuidv7';
import { sql } from './db.service.js';
import type { Tweet } from '../types/index.js';

/**
 * Create a new tweet
 * Pure function - returns created tweet
 */
export async function createTweet(
  userId: string,
  content: string
): Promise<Tweet> {
  const tweetId = uuidv7();

  const [tweet] = await sql<Tweet[]>`
    INSERT INTO tweets (id, user_id, content)
    VALUES (${tweetId}, ${userId}, ${content})
    RETURNING *
  `;

  return tweet;
}

/**
 * Get all tweets by user ID
 * Pure function - returns tweets in reverse chronological order
 */
export async function getTweetsByUserId(userId: string): Promise<Tweet[]> {
  const tweets = await sql<Tweet[]>`
    SELECT * FROM tweets
    WHERE user_id = ${userId}
    ORDER BY created_at DESC, id DESC
  `;

  return tweets;
}

/**
 * Get all tweets by username (for profile pages)
 * Pure function - returns tweets with username
 */
export async function getTweetsByUsername(
  username: string
): Promise<(Tweet & { username: string })[]> {
  const tweets = await sql<(Tweet & { username: string })[]>`
    SELECT t.*, u.username
    FROM tweets t
    JOIN users u ON u.id = t.user_id
    WHERE LOWER(u.username) = LOWER(${username})
    ORDER BY t.created_at DESC, t.id DESC
  `;

  return tweets;
}
```

**Update types**:

```typescript
// src/types/index.ts
export interface Tweet {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type { TweetInput } from '../schemas/tweet.schema.js';
```

---

### Phase 4: API Contract Tests (45 min)

**TDD CRITICAL**: Write ALL contract tests BEFORE implementing routes

```typescript
// tests/contract/tweets.contract.test.ts
import request from 'supertest';
import { app } from '../../src/api/server.js';

describe('POST /api/tweets', () => {
  let sessionCookie: string[];

  beforeEach(async () => {
    // Register and get session cookie
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'tweettest' + Date.now(),
        password: 'password123',
      });
    sessionCookie = res.headers['set-cookie'];
  });

  test('creates tweet and returns 201', async () => {
    const res = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'My first tweet!' });

    expect(res.status).toBe(201);
    expect(res.body.tweet).toHaveProperty('id');
    expect(res.body.tweet).toHaveProperty('userId');
    expect(res.body.tweet.content).toBe('My first tweet!');
    expect(res.body.tweet).toHaveProperty('createdAt');
  });

  test('rejects empty tweet with 400', async () => {
    const res = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });

  test('rejects tweet exceeding 141 chars with 400', async () => {
    const res = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'a'.repeat(142) });

    expect(res.status).toBe(400);
  });

  test('rejects whitespace-only tweet with 400', async () => {
    const res = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: '   ' });

    expect(res.status).toBe(400);
  });

  test('rejects unauthenticated request with 401', async () => {
    const res = await request(app)
      .post('/api/tweets')
      .send({ content: 'Unauthorized tweet' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/tweets/user/:userId', () => {
  test('returns tweets in reverse chronological order', async () => {
    // Register user and get userId
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'viewtest' + Date.now(),
        password: 'password123',
      });

    const sessionCookie = regRes.headers['set-cookie'];
    const userId = regRes.body.user.id;

    // Post tweets
    await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'First tweet' });

    await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Second tweet' });

    // View tweets
    const res = await request(app).get(`/api/tweets/user/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body.tweets).toHaveLength(2);
    expect(res.body.tweets[0].content).toBe('Second tweet'); // Newest first
    expect(res.body.tweets[1].content).toBe('First tweet');
    expect(res.body.count).toBe(2);
  });

  test('returns empty array for user with no tweets', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'notweets' + Date.now(),
        password: 'password123',
      });

    const userId = regRes.body.user.id;

    const res = await request(app).get(`/api/tweets/user/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body.tweets).toHaveLength(0);
    expect(res.body.count).toBe(0);
  });
});
```

**Run tests** → Should FAIL (no routes implemented yet)

---

### Phase 5: Express API Routes (1 hour)

Implement routes to make contract tests pass (see contracts/api-endpoints.md)

```typescript
// src/api/routes/tweets.ts
import { Router } from 'express';
import { TweetSchema } from '../../schemas/tweet.schema.js';
import { createTweet, getTweetsByUserId } from '../../services/tweet.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

/**
 * POST /api/tweets
 * Create a new tweet (requires authentication)
 */
router.post('/', requireAuth, validate(TweetSchema), async (req, res, next) => {
  try {
    const { content } = req.body;
    const userId = req.session.userId!;

    const tweet = await createTweet(userId, content);

    res.status(201).json({ tweet });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tweets/user/:userId
 * Get all tweets by user (public, no auth required)
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const tweets = await getTweetsByUserId(userId);

    res.status(200).json({
      tweets,
      count: tweets.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

**Register routes**:

```typescript
// src/api/routes/index.ts
import tweetRoutes from './tweets.js';

router.use('/tweets', tweetRoutes);
```

**Run contract tests** → Should PASS (GREEN)

---

### Phase 6: Integration Tests (45 min)

**TDD**: Write integration tests for full user flows

```typescript
// tests/integration/tweet-posting-flow.test.ts
test('full flow: register → post tweet → view on profile', async () => {
  // 1. Register
  const regRes = await request(app).post('/api/auth/register')
    .send({ username: 'flowtest' + Date.now(), password: 'password123' });

  const sessionCookie = regRes.headers['set-cookie'];
  const userId = regRes.body.user.id;

  // 2. Post tweet
  const tweetRes = await request(app).post('/api/tweets')
    .set('Cookie', sessionCookie)
    .send({ content: 'My first tweet from integration test!' });

  expect(tweetRes.status).toBe(201);

  // 3. View tweets on profile
  const viewRes = await request(app).get(`/api/tweets/user/${userId}`);

  expect(viewRes.status).toBe(200);
  expect(viewRes.body.tweets).toHaveLength(1);
  expect(viewRes.body.tweets[0].content).toBe('My first tweet from integration test!');
});

test('anonymous visitor can view tweets', async () => {
  // Create user and tweet
  const regRes = await request(app).post('/api/auth/register')
    .send({ username: 'public' + Date.now(), password: 'password123' });

  const sessionCookie = regRes.headers['set-cookie'];
  const userId = regRes.body.user.id;

  await request(app).post('/api/tweets')
    .set('Cookie', sessionCookie)
    .send({ content: 'Public tweet' });

  // View as anonymous (no session cookie)
  const viewRes = await request(app).get(`/api/tweets/user/${userId}`);

  expect(viewRes.status).toBe(200);
  expect(viewRes.body.tweets[0].content).toBe('Public tweet');
});
```

---

### Phase 7: Remix Frontend (2 hours)

Implement UI components using Tailwind + Flowbite (see project structure in plan.md)

**Key components**:
- TweetComposer.tsx (with real-time 141-char counter)
- TweetList.tsx (displays tweets in reverse chronological order)
- TweetItem.tsx (single tweet display)
- Update ProfileView.tsx to include TweetList

**Example TweetComposer**:

```typescript
// src/app/components/TweetComposer.tsx
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Button, Label, Textarea, Alert } from "flowbite-react";
import { useState } from "react";

export default function TweetComposer() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
  };

  const charColorClass =
    charCount > 141
      ? "text-red-600"
      : charCount > 120
      ? "text-yellow-600"
      : "text-gray-500";

  return (
    <Form method="post" className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label htmlFor="content" value="What's happening?" />
          <span className={`text-sm font-medium ${charColorClass}`}>
            {charCount} / 141
          </span>
        </div>
        <Textarea
          id="content"
          name="content"
          placeholder="Share your thoughts..."
          rows={4}
          maxLength={141}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || charCount === 0 || charCount > 141}
        isProcessing={isSubmitting}
      >
        {isSubmitting ? "Posting..." : "Post Tweet"}
      </Button>
    </Form>
  );
}
```

---

### Phase 8: Testing & Refactoring (30 min)

**Run full test suite**:
```bash
npm test
```

**All tests must PASS before proceeding!**

Expected: 14 tests from 001 + ~10 new tests = 24 tests passing

**Refactor** while keeping tests green:
- Extract duplicate code
- Improve function names
- Add comments for complex logic

---

## Checklist

- [ ] Database migration run successfully (tweets table exists)
- [ ] All Zod schemas defined and tested (TweetSchema)
- [ ] All contract tests written and passing (POST /api/tweets, GET /api/tweets/user/:userId)
- [ ] All integration tests written and passing (full posting flow)
- [ ] API endpoints implement all contracts
- [ ] Tweet creation works (authenticated users can post)
- [ ] Tweet viewing works (public access on profile pages)
- [ ] Character counter updates in real-time (< 50ms)
- [ ] Tweets display in reverse chronological order
- [ ] Empty tweets rejected
- [ ] Tweets > 141 chars rejected
- [ ] Whitespace-only tweets rejected
- [ ] Unauthenticated posting blocked
- [ ] Frontend forms have real-time validation
- [ ] Constitution compliance verified (all 6 principles)

---

## Running the App

### Development
```bash
# Terminal 1: API server
npm run api:dev

# Terminal 2: Remix dev server
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/contract/tweets.contract.test.ts
```

---

## Next Steps

After this feature is complete:
1. Run full test suite (should have 24+ tests passing)
2. Merge to main (after all tests pass)
3. Next feature: `/speckit.specify "Users can like tweets..."`

---

## Troubleshooting

### Tests Failing
- Verify database migration ran successfully
- Check that 001-users-can-register tests still pass
- Ensure .env has correct DATABASE_URL

### Character Counter Not Updating
- Check that `onChange` handler is attached to textarea
- Verify state updates properly (React DevTools)
- Ensure no debouncing is slowing updates

### Tweets Not Displaying
- Verify tweets exist in database: `SELECT * FROM tweets;`
- Check API response: `curl http://localhost:3000/api/tweets/user/:userId`
- Verify JOIN query works correctly with users table

---

**Estimated Total Time**: 4-6 hours with TDD (breaking down as shown above)
