# API Contracts: Like Feature

**Feature**: 003-users-can-like-tweets
**Base URL**: `/api`
**Format**: REST (JSON)

---

## Like Endpoints

### POST /api/tweets/:tweetId/like

**Purpose**: Like a tweet (idempotent - creates like or returns existing)

**Authentication**: Required (session cookie)

**Headers**: `Cookie: connect.sid=...`

**URL Parameters**:
- `tweetId` (UUID): ID of tweet to like

**Request Body**: None

**Success Response (201 Created)**:
```typescript
{
  like: {
    id: string;          // UUID (uuidv7)
    userId: string;      // UUID of authenticated user
    tweetId: string;     // UUID of liked tweet
    createdAt: string;   // ISO 8601 timestamp
  };
}
```

**Error Responses**:

- **400 Bad Request**: Invalid tweet ID format
  ```typescript
  {
    error: "Validation failed",
    errors: [
      { path: "tweetId", message: "Invalid UUID format" }
    ]
  }
  ```

- **401 Unauthorized**: Not logged in
  ```typescript
  {
    error: "Unauthorized"
  }
  ```

- **404 Not Found**: Tweet doesn't exist
  ```typescript
  {
    error: "Tweet not found"
  }
  ```

- **500 Internal Server Error**: Database or server error
  ```typescript
  {
    error: "Failed to create like"
  }
  ```

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/tweets/01936c8e-9999-8888-7777-666655554444/like \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..."
```

**Example Success Response**:
```json
{
  "like": {
    "id": "01936c8e-8b2a-7890-b123-456789abcdef",
    "userId": "01936c8e-1234-5678-9abc-def012345678",
    "tweetId": "01936c8e-9999-8888-7777-666655554444",
    "createdAt": "2025-10-08T14:30:00.000Z"
  }
}
```

**Idempotency**:
- Calling this endpoint multiple times with same `userId` + `tweetId` returns the same like
- No error thrown for duplicate likes (HTTP 201 returned for both new and existing)
- Database uses `ON CONFLICT DO NOTHING` to handle duplicates

---

### DELETE /api/tweets/:tweetId/like

**Purpose**: Unlike a tweet (idempotent - removes like if exists, silent if doesn't)

**Authentication**: Required (session cookie)

**Headers**: `Cookie: connect.sid=...`

**URL Parameters**:
- `tweetId` (UUID): ID of tweet to unlike

**Request Body**: None

**Success Response (204 No Content)**:
```
(Empty response body)
```

**Error Responses**:

- **400 Bad Request**: Invalid tweet ID format
  ```typescript
  {
    error: "Validation failed",
    errors: [
      { path: "tweetId", message: "Invalid UUID format" }
    ]
  }
  ```

- **401 Unauthorized**: Not logged in
  ```typescript
  {
    error: "Unauthorized"
  }
  ```

- **500 Internal Server Error**: Database or server error
  ```typescript
  {
    error: "Failed to delete like"
  }
  ```

**Example Request**:
```bash
curl -X DELETE http://localhost:3000/api/tweets/01936c8e-9999-8888-7777-666655554444/like \
  -H "Cookie: connect.sid=..."
```

**Example Success Response**:
```
HTTP/1.1 204 No Content
(Empty body)
```

**Idempotency**:
- Calling this endpoint multiple times returns 204 even if like doesn't exist
- No 404 error if like doesn't exist (silent success)
- Enables toggle behavior without client-side state tracking

**Note**: 404 is NOT returned for non-existent likes. Only 404 if tweet itself doesn't exist.

---

### GET /api/tweets/:tweetId/likes

**Purpose**: Get like count and user's like status for a tweet (public endpoint)

**Authentication**: Optional (works for both authenticated and anonymous users)

**Headers**: `Cookie: connect.sid=...` (optional)

**URL Parameters**:
- `tweetId` (UUID): ID of tweet to get likes for

**Success Response (200 OK)**:
```typescript
{
  tweetId: string;     // UUID of tweet
  count: number;       // Total like count
  userLiked: boolean;  // True if authenticated user has liked (false for anonymous)
}
```

**Error Responses**:

- **400 Bad Request**: Invalid tweet ID format
  ```typescript
  {
    error: "Validation failed",
    errors: [
      { path: "tweetId", message: "Invalid UUID format" }
    ]
  }
  ```

- **404 Not Found**: Tweet doesn't exist
  ```typescript
  {
    error: "Tweet not found"
  }
  ```

- **500 Internal Server Error**: Database or server error
  ```typescript
  {
    error: "Failed to fetch likes"
  }
  ```

**Example Request (Authenticated)**:
```bash
curl http://localhost:3000/api/tweets/01936c8e-9999-8888-7777-666655554444/likes \
  -H "Cookie: connect.sid=..."
```

**Example Success Response (User has liked)**:
```json
{
  "tweetId": "01936c8e-9999-8888-7777-666655554444",
  "count": 42,
  "userLiked": true
}
```

**Example Request (Anonymous)**:
```bash
curl http://localhost:3000/api/tweets/01936c8e-9999-8888-7777-666655554444/likes
```

**Example Success Response (Anonymous)**:
```json
{
  "tweetId": "01936c8e-9999-8888-7777-666655554444",
  "count": 42,
  "userLiked": false
}
```

**Notes**:
- Returns `userLiked: false` for anonymous users (no session cookie)
- Returns `count: 0` for tweets with no likes
- Public endpoint - no authentication required

---

## Batch Endpoint (Optional - For Optimization)

### POST /api/likes/batch

**Purpose**: Get like data for multiple tweets in a single request (efficient for tweet lists)

**Authentication**: Optional

**Headers**: `Cookie: connect.sid=...` (optional)

**Request Body**:
```typescript
{
  tweetIds: string[];  // Array of tweet UUIDs
}
```

**Success Response (200 OK)**:
```typescript
{
  likes: Array<{
    tweetId: string;
    count: number;
    userLiked: boolean;
  }>;
}
```

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/likes/batch \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "tweetIds": [
      "01936c8e-9999-8888-7777-666655554444",
      "01936c8e-aaaa-bbbb-cccc-ddddeeeefffff",
      "01936c8e-1111-2222-3333-444455556666"
    ]
  }'
```

**Example Success Response**:
```json
{
  "likes": [
    { "tweetId": "01936c8e-9999-8888-7777-666655554444", "count": 42, "userLiked": true },
    { "tweetId": "01936c8e-aaaa-bbbb-cccc-ddddeeeefffff", "count": 0, "userLiked": false },
    { "tweetId": "01936c8e-1111-2222-3333-444455556666", "count": 15, "userLiked": false }
  ]
}
```

**Notes**:
- **Optional endpoint** - implement only if needed for performance
- Reduces N+1 query problem when loading tweet lists
- Returns data for all requested tweets (0 count for tweets with no likes)
- Missing tweets (404) are omitted from response (not an error)

---

## Middleware

### Authentication Middleware (Existing from 001)

```typescript
// Validates session cookie, attaches userId to req.session
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next()
}
```

**Usage**:
- Applied to `POST /api/tweets/:tweetId/like` (like endpoint)
- Applied to `DELETE /api/tweets/:tweetId/like` (unlike endpoint)
- NOT applied to `GET /api/tweets/:tweetId/likes` (public view)

---

### Validation Middleware (Existing from 001)

```typescript
// Validates request parameters against Zod schema
import { z } from 'zod';

const TweetIdSchema = z.object({
  tweetId: z.string().uuid('Invalid tweet ID format'),
});

export function validateTweetId(req, res, next) {
  try {
    req.params = TweetIdSchema.parse(req.params);
    next();
  } catch (error) {
    res.status(400).json({
      error: 'Validation failed',
      errors: error.errors,
    });
  }
}
```

**Usage**: Applied to all three endpoints (like, unlike, get likes)

---

## Route Registration

```typescript
// src/api/routes/tweets.ts (extend existing file)
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateTweetId } from '../middleware/validate.middleware.js';
import {
  createLike,
  deleteLike,
  getLikes,
} from '../../services/like.service.js';

const router = Router();

// Existing tweet routes...
// POST /api/tweets
// GET /api/tweets/user/:userId

// NEW: Like routes (nested under tweets)
router.post(
  '/:tweetId/like',
  requireAuth,
  validateTweetId,
  likeTweetHandler
);

router.delete(
  '/:tweetId/like',
  requireAuth,
  validateTweetId,
  unlikeTweetHandler
);

router.get(
  '/:tweetId/likes',
  validateTweetId,
  getLikesHandler
);

export default router;
```

**Alternative Route Structure** (separate likes router):
```typescript
// src/api/routes/index.ts
router.use('/tweets', tweetRoutes);
router.use('/likes', likeRoutes); // NEW
```

**Decision**: Nest like routes under `/api/tweets/:tweetId/like` (RESTful resource nesting).

---

## Request/Response Flow

### Liking a Tweet

```
Client (Authenticated)
    ↓
POST /api/tweets/:tweetId/like
    ↓
requireAuth middleware (validates session)
    ↓
validateTweetId middleware (validates UUID format)
    ↓
likeTweetHandler (route handler)
    ↓
createLike service (pure function)
    ↓
PostgreSQL INSERT with ON CONFLICT DO NOTHING
    ↓
201 Created { like: {...} }
```

---

### Unliking a Tweet

```
Client (Authenticated)
    ↓
DELETE /api/tweets/:tweetId/like
    ↓
requireAuth middleware (validates session)
    ↓
validateTweetId middleware (validates UUID format)
    ↓
unlikeTweetHandler (route handler)
    ↓
deleteLike service (pure function)
    ↓
PostgreSQL DELETE
    ↓
204 No Content
```

---

### Viewing Like Count (Anonymous)

```
Client (Any User)
    ↓
GET /api/tweets/:tweetId/likes
    ↓
validateTweetId middleware (validates UUID format)
    ↓
getLikesHandler (route handler)
    ↓
getLikeCount + checkUserLiked services (pure functions)
    ↓
PostgreSQL COUNT(*) + EXISTS query
    ↓
200 OK { tweetId, count, userLiked }
```

---

## Error Handling

### Validation Errors (400)

```typescript
// Invalid UUID format
POST /api/tweets/not-a-uuid/like
→ 400 {
  error: "Validation failed",
  errors: [{ path: "tweetId", message: "Invalid UUID format" }]
}

// Empty tweet ID
POST /api/tweets//like
→ 400 { error: "Validation failed", ... }
```

---

### Authentication Errors (401)

```typescript
// No session cookie
POST /api/tweets/:tweetId/like
→ 401 { error: "Unauthorized" }

// Invalid/expired session
POST /api/tweets/:tweetId/like (with invalid cookie)
→ 401 { error: "Unauthorized" }
```

---

### Not Found Errors (404)

```typescript
// Tweet doesn't exist
POST /api/tweets/00000000-0000-0000-0000-000000000000/like
→ 404 { error: "Tweet not found" }

// Note: Unlike non-existent like does NOT return 404
DELETE /api/tweets/:tweetId/like (for non-liked tweet)
→ 204 No Content (silent success)
```

---

### Server Errors (500)

```typescript
// Database connection failure
POST /api/tweets/:tweetId/like
→ 500 { error: "Failed to create like" }

// Unexpected error
GET /api/tweets/:tweetId/likes
→ 500 { error: "Failed to fetch likes" }
```

---

## Testing Checklist

### Contract Tests (Supertest)

**POST /api/tweets/:tweetId/like**:
- [ ] Creates like and returns 201 when authenticated
- [ ] Returns 401 when unauthenticated
- [ ] Returns 404 when tweet doesn't exist
- [ ] Is idempotent (duplicate like returns existing, no error)
- [ ] Increments like count when viewed via GET endpoint
- [ ] Foreign key constraint enforced (invalid userId/tweetId rejected)

**DELETE /api/tweets/:tweetId/like**:
- [ ] Removes like and returns 204 when authenticated
- [ ] Returns 401 when unauthenticated
- [ ] Is idempotent (unliking non-existent like returns 204, no error)
- [ ] Decrements like count when viewed via GET endpoint
- [ ] Doesn't return 404 for non-existent like

**GET /api/tweets/:tweetId/likes**:
- [ ] Returns correct count and userLiked=true when user has liked
- [ ] Returns correct count and userLiked=false when user hasn't liked
- [ ] Returns userLiked=false for anonymous users
- [ ] Allows anonymous access (no auth required)
- [ ] Returns 404 when tweet doesn't exist
- [ ] Returns count=0 for tweets with no likes

### Integration Tests

- [ ] Full flow: Register → Post tweet → Like tweet → Verify count increments
- [ ] Full flow: Like tweet → Unlike tweet → Verify count decrements
- [ ] Multiple users like same tweet → Count is accurate
- [ ] Anonymous user views tweet → Sees like count but cannot like
- [ ] Like persists across page refresh (session maintained)
- [ ] Rapid like/unlike toggling (no race conditions)

---

## Performance Requirements

**From spec success criteria**:
- **SC-001**: Like operation completes in < 500ms (POST endpoint)
- **SC-002**: Unlike operation completes in < 500ms (DELETE endpoint)
- **SC-006**: API handles 100 concurrent like requests without errors
- **Monitoring**: GET endpoint should complete in < 100ms (not in spec but implied)

**API Performance Targets**:
- POST /api/tweets/:tweetId/like: < 200ms (p95)
- DELETE /api/tweets/:tweetId/like: < 200ms (p95)
- GET /api/tweets/:tweetId/likes: < 50ms (p95)

---

## Security Considerations

### Authentication

- Like/unlike require valid session cookie (httpOnly, secure, sameSite=strict)
- View likes is public (no auth required) - like counts are non-sensitive data
- User ID comes from session, not request body (prevents impersonation)

### SQL Injection Prevention

- All queries use parameterized statements via `postgres` package
- No string concatenation in SQL queries
- Template literals ensure safe escaping
- UUIDs validated by Zod before database operations

### Rate Limiting (Future Enhancement)

- Not implemented in MVP (trust users)
- Consider adding if abuse detected (e.g., 100 likes/minute per user)
- Use Redis for distributed rate limiting if needed

### CSRF Protection

- Relying on SameSite cookie attribute (already configured in 001)
- CSRF tokens not required for stateless API (session cookie sufficient)

---

## Future Enhancements (Out of Scope for MVP)

**Not Implemented Now**:
- Pagination for liked tweets list (GET /api/users/:userId/liked-tweets)
- "Who liked this" user list (GET /api/tweets/:tweetId/likers)
- Like notifications (webhook when tweet is liked)
- Like analytics (GET /api/tweets/:tweetId/like-stats)
- Bulk operations (POST /api/likes/bulk for multiple tweets)
- WebSocket real-time updates (push like count changes)

These features require specification, planning, and implementation in separate PRs.

---

**API Contracts Status**: ✅ COMPLETE

Ready for quickstart implementation guide.
