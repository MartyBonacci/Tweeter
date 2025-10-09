# API Contracts: Tweet Posting

**Feature**: 002-users-can-post-tweets
**Base URL**: `/api`
**Format**: REST (JSON)

## Tweet Endpoints

### POST /api/tweets
**Purpose**: Create a new tweet (requires authentication)

**Headers**: `Cookie: connect.sid=...` (session cookie)

**Request**:
```typescript
{
  content: string;  // 1-141 chars, trimmed
}
```

**Success Response (201 Created)**:
```typescript
{
  tweet: {
    id: string;          // UUID (uuidv7)
    userId: string;      // UUID of authenticated user
    content: string;     // Tweet text content
    createdAt: string;   // ISO 8601 timestamp
    updatedAt: string;   // ISO 8601 timestamp
  };
}
```

**Error Responses**:
- 400 Bad Request: Invalid input (Zod validation errors)
  ```typescript
  {
    error: "Validation failed",
    errors: [
      { path: "content", message: "Tweet cannot be empty" }
    ]
  }
  ```
- 401 Unauthorized: Not logged in
  ```typescript
  {
    error: "Unauthorized"
  }
  ```
- 500 Internal Server Error: Database or server error
  ```typescript
  {
    error: "Failed to create tweet"
  }
  ```

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/tweets \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{"content":"Hello, Tweeter! This is my first tweet."}'
```

**Example Success Response**:
```json
{
  "tweet": {
    "id": "01936c8e-8b2a-7890-b123-456789abcdef",
    "userId": "01936c8e-1234-5678-9abc-def012345678",
    "content": "Hello, Tweeter! This is my first tweet.",
    "createdAt": "2025-10-08T14:30:00.000Z",
    "updatedAt": "2025-10-08T14:30:00.000Z"
  }
}
```

---

### GET /api/tweets/user/:userId
**Purpose**: Get all tweets by a specific user (public, no auth required)

**Parameters**: `userId` (UUID)

**Success Response (200 OK)**:
```typescript
{
  tweets: Array<{
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;
  count: number;  // Total tweet count
}
```

**Error Responses**:
- 404 Not Found: User doesn't exist
  ```typescript
  {
    error: "User not found"
  }
  ```
- 500 Internal Server Error: Database or server error
  ```typescript
  {
    error: "Failed to fetch tweets"
  }
  ```

**Example Request**:
```bash
curl http://localhost:3000/api/tweets/user/01936c8e-1234-5678-9abc-def012345678
```

**Example Success Response**:
```json
{
  "tweets": [
    {
      "id": "01936c8e-8b2a-7890-b123-456789abcdef",
      "userId": "01936c8e-1234-5678-9abc-def012345678",
      "content": "Hello, Tweeter! This is my first tweet.",
      "createdAt": "2025-10-08T14:30:00.000Z",
      "updatedAt": "2025-10-08T14:30:00.000Z"
    },
    {
      "id": "01936c8e-9999-8888-7777-666655554444",
      "userId": "01936c8e-1234-5678-9abc-def012345678",
      "content": "My second tweet!",
      "createdAt": "2025-10-08T15:45:00.000Z",
      "updatedAt": "2025-10-08T15:45:00.000Z"
    }
  ],
  "count": 2
}
```

**Notes**:
- Tweets are ordered by `createdAt DESC, id DESC` (newest first)
- Returns empty array if user has no tweets
- No pagination in MVP (loads all tweets)

---

### GET /api/profiles/:username/tweets (Alternative Endpoint - Optional)
**Purpose**: Get all tweets by username instead of userId

**Parameters**: `username` (case-insensitive)

**Success Response (200 OK)**:
```typescript
{
  tweets: Array<{
    id: string;
    userId: string;
    username: string;  // Included for convenience
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;
  count: number;
}
```

**Error Responses**:
- 404 Not Found: User doesn't exist
- 500 Internal Server Error: Database or server error

**Implementation Note**: This endpoint joins tweets with users table to fetch by username. Use this for profile page integration.

---

## Middleware

### Authentication Middleware (Existing from 001)
```typescript
// Validates session cookie, attaches userId to req.session
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

**Usage**: Applied to POST /api/tweets endpoint only (tweet viewing is public)

---

### Validation Middleware (Existing from 001)
```typescript
// Validates request body against Zod schema
import { TweetSchema } from '../../schemas/tweet.schema';

export function validate(schema: ZodSchema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        errors: error.errors
      });
    }
  };
}
```

**Usage**: Applied to POST /api/tweets with `TweetSchema`

---

## Route Registration

```typescript
// src/api/routes/tweets.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { TweetSchema } from '../../schemas/tweet.schema';

const router = Router();

// POST /api/tweets (requires auth)
router.post('/', requireAuth, validate(TweetSchema), createTweetHandler);

// GET /api/tweets/user/:userId (public)
router.get('/user/:userId', getTweetsByUserIdHandler);

export default router;
```

```typescript
// src/api/routes/index.ts
import tweetRoutes from './tweets';

router.use('/tweets', tweetRoutes);
```

---

## Request/Response Flow

### Posting a Tweet

```
Client (Authenticated)
    ↓
POST /api/tweets { content: "..." }
    ↓
requireAuth middleware (validates session)
    ↓
validate(TweetSchema) middleware (validates content)
    ↓
createTweetHandler (route handler)
    ↓
createTweet service (pure function)
    ↓
PostgreSQL INSERT
    ↓
201 Created { tweet: {...} }
```

### Viewing Tweets on Profile

```
Client (Any User)
    ↓
GET /api/tweets/user/:userId
    ↓
getTweetsByUserIdHandler (route handler)
    ↓
getTweetsByUserId service (pure function)
    ↓
PostgreSQL SELECT with ORDER BY
    ↓
200 OK { tweets: [...], count: N }
```

---

## Error Handling

### Validation Errors (400)
```typescript
// Empty tweet
POST /api/tweets { content: "" }
→ 400 { error: "Validation failed", errors: [{ path: "content", message: "Tweet cannot be empty" }] }

// Exceeds character limit
POST /api/tweets { content: "a".repeat(142) }
→ 400 { error: "Validation failed", errors: [{ path: "content", message: "Tweet exceeds 141 characters" }] }

// Whitespace only
POST /api/tweets { content: "   " }
→ 400 { error: "Validation failed", errors: [{ path: "content", message: "Tweet cannot be empty" }] }
```

### Authentication Errors (401)
```typescript
// No session cookie
POST /api/tweets { content: "Hello" }
→ 401 { error: "Unauthorized" }

// Invalid/expired session
POST /api/tweets { content: "Hello" } (with invalid cookie)
→ 401 { error: "Unauthorized" }
```

### Not Found Errors (404)
```typescript
// Non-existent user
GET /api/tweets/user/00000000-0000-0000-0000-000000000000
→ 404 { error: "User not found" }
```

### Server Errors (500)
```typescript
// Database connection failure
POST /api/tweets { content: "Hello" }
→ 500 { error: "Failed to create tweet" }

// Unexpected error
GET /api/tweets/user/:userId
→ 500 { error: "Failed to fetch tweets" }
```

---

## Testing Checklist

### Contract Tests (Supertest)

- [ ] POST /api/tweets with valid content returns 201
- [ ] POST /api/tweets with empty content returns 400
- [ ] POST /api/tweets with >141 chars returns 400
- [ ] POST /api/tweets with whitespace-only returns 400
- [ ] POST /api/tweets without auth returns 401
- [ ] POST /api/tweets with valid auth creates tweet in DB
- [ ] GET /api/tweets/user/:userId returns tweets in reverse chronological order
- [ ] GET /api/tweets/user/:userId for user with no tweets returns empty array
- [ ] GET /api/tweets/user/:userId for non-existent user returns 404
- [ ] GET /api/tweets/user/:userId includes correct tweet count

### Integration Tests

- [ ] Full flow: Register → Login → Post Tweet → View on Profile
- [ ] Anonymous visitor can view tweets on profile page
- [ ] Authenticated user can view their own tweets on profile
- [ ] Authenticated user can view other users' tweets on profile
- [ ] Multiple tweets display in correct order (newest first)

---

## Performance Requirements

**From spec success criteria:**
- **SC-001**: Tweet posting completes in < 1 second (POST /api/tweets)
- **SC-003**: Profile page with 100 tweets loads in < 2 seconds (includes GET /api/tweets/user/:userId)
- **SC-004**: 100% of valid tweets successfully stored in database

**API Targets**:
- POST /api/tweets: < 200ms (p95)
- GET /api/tweets/user/:userId: < 100ms (p95)

---

## Security Considerations

### Input Validation
- All tweet content validated with Zod on backend (even if validated on frontend)
- Whitespace trimmed before validation (prevents bypassing with spaces)
- Character limit enforced at multiple layers (Zod, PostgreSQL CHECK constraint)

### Authentication
- POST /api/tweets requires valid session cookie (httpOnly, secure, sameSite=strict)
- GET endpoints are public (no auth required) - tweets are public by design

### SQL Injection Prevention
- All queries use parameterized statements via `postgres` package
- No string concatenation in SQL queries
- Template literals ensure safe escaping

### XSS Prevention
- React automatically escapes text content when rendering
- No HTML allowed in tweet content (plain text only)
- Content-Type: application/json (not text/html)

---

## Future Enhancements (Out of Scope for MVP)

**Not Implemented Now**:
- Pagination (LIMIT/OFFSET for large tweet lists)
- Rate limiting (prevent spam posting)
- Tweet editing (PUT /api/tweets/:id)
- Tweet deletion (DELETE /api/tweets/:id)
- Tweet search (GET /api/tweets/search?q=...)
- Media upload (POST /api/tweets with multipart/form-data)
- Hashtag parsing (extract #hashtags from content)
- Mention parsing (extract @usernames from content)
- Reply threading (parent_tweet_id parameter)
- Retweets (POST /api/tweets/:id/retweet)

These features require specification, planning, and implementation in separate PRs.
