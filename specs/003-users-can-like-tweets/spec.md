# Feature Specification: Users Can Like Tweets

**Feature ID**: 003-users-can-like-tweets
**Priority**: P1 (Core engagement feature)
**Status**: Specification
**Created**: 2025-10-08
**Dependencies**: 001-users-can-register, 002-users-can-post-tweets

---

## Overview

Users can express appreciation for tweets by liking them. Each tweet displays the total like count, and users can see which tweets they've liked with the ability to unlike them. This feature enables basic social engagement and provides feedback to tweet authors.

---

## User Stories

### User Story 1 - Like a Tweet (Priority: P1) 🎯 MVP

**As a** logged-in user
**I want to** like any tweet by clicking a like button
**So that** I can express appreciation for content I enjoy

**Acceptance Criteria**:
- Authenticated users can click a like button on any tweet
- Like button changes visual state (filled heart) when liked
- Like count increments immediately upon liking
- Each user can only like a tweet once (idempotent operation)
- Liking a tweet persists across sessions and page refreshes
- Users can like their own tweets

**Out of Scope**:
- Animated like button transitions
- Notification to tweet author when liked
- Like activity feed or timeline

---

### User Story 2 - Unlike a Tweet (Priority: P1) 🎯 MVP

**As a** logged-in user
**I want to** unlike a tweet I previously liked
**So that** I can change my mind or correct accidental likes

**Acceptance Criteria**:
- Users can click the like button again to unlike
- Like button returns to unfilled state when unliked
- Like count decrements immediately upon unliking
- Unlike operation persists across sessions and page refreshes
- Toggle behavior: clicking alternates between liked/unliked states

**Out of Scope**:
- Undo confirmation dialog
- Like history tracking (when liked/unliked)

---

### User Story 3 - View Like Count on Tweets (Priority: P1) 🎯 MVP

**As a** any user (authenticated or anonymous)
**I want to** see the total number of likes on each tweet
**So that** I can gauge tweet popularity and community sentiment

**Acceptance Criteria**:
- Every tweet displays like count next to like button
- Like count shows "0 likes" for tweets with no likes
- Like count shows "1 like" (singular) for tweets with one like
- Like count shows "N likes" (plural) for tweets with multiple likes
- Like count updates in real-time when user likes/unlikes (no page refresh needed)
- Anonymous users can see like counts but cannot interact with like button

**Out of Scope**:
- List of users who liked a tweet
- Sorting tweets by like count
- Trending/popular tweets based on likes

---

### User Story 4 - Identify Liked Tweets (Priority: P2)

**As a** logged-in user
**I want to** see visual indication of tweets I've already liked
**So that** I know my like status without needing to remember

**Acceptance Criteria**:
- Like button shows filled state (solid heart icon) for tweets the user has liked
- Like button shows unfilled state (outline heart icon) for tweets the user hasn't liked
- Visual state persists when navigating between pages
- Visual state is correct immediately upon page load (no flash of wrong state)

**Out of Scope**:
- Filtering to show only tweets the user has liked
- "Liked tweets" page on user profile
- Timestamp of when tweet was liked

---

## Functional Requirements

### Core Functionality

**FR-001**: System MUST allow authenticated users to like any tweet
**FR-002**: System MUST prevent duplicate likes (one like per user per tweet)
**FR-003**: System MUST allow authenticated users to unlike previously liked tweets
**FR-004**: System MUST display accurate like count on every tweet
**FR-005**: System MUST persist like/unlike actions to database immediately
**FR-006**: System MUST update UI like count in real-time without page refresh

### Data Integrity

**FR-007**: System MUST maintain referential integrity (likes reference valid users and tweets)
**FR-008**: System MUST delete likes when associated tweet is deleted (CASCADE DELETE)
**FR-009**: System MUST delete likes when associated user is deleted (CASCADE DELETE)
**FR-010**: System MUST prevent race conditions when multiple like requests occur simultaneously

### Authentication & Authorization

**FR-011**: System MUST require authentication to like/unlike tweets
**FR-012**: System MUST allow anonymous users to view like counts (public visibility)
**FR-013**: System MUST return 401 Unauthorized for unauthenticated like/unlike attempts
**FR-014**: System MUST allow users to like/unlike any tweet (no ownership restrictions)

### User Experience

**FR-015**: System MUST provide immediate visual feedback when like button is clicked
**FR-016**: System MUST show different button states for liked vs unliked tweets
**FR-017**: System MUST display like count in human-readable format (e.g., "5 likes")
**FR-018**: System MUST handle like button clicks idempotently (duplicate requests don't cause errors)

---

## Success Criteria

**SC-001**: User can like a tweet and see like count increment within 500ms
**SC-002**: User can unlike a tweet and see like count decrement within 500ms
**SC-003**: Like button state (liked/unliked) persists correctly across page refreshes
**SC-004**: Multiple users can like the same tweet without conflicts or data corruption
**SC-005**: Anonymous users can view like counts on all tweets
**SC-006**: API endpoint handles 100 concurrent like requests without errors
**SC-007**: All tests pass (contract, integration, E2E) for like functionality
**SC-008**: Like button is keyboard-accessible (can be activated with Enter/Space)

---

## Technical Constraints

### Database

**TC-001**: Use PostgreSQL via Neon with `postgres` package
**TC-002**: Likes stored in separate `likes` table with composite unique constraint
**TC-003**: Use UUIDv7 for like IDs (time-ordered, globally unique)
**TC-004**: Indexes on user_id and tweet_id for fast lookups

### API

**TC-005**: RESTful endpoints following 001/002 patterns
**TC-006**: POST /api/tweets/:tweetId/like (idempotent - creates or returns existing like)
**TC-007**: DELETE /api/tweets/:tweetId/like (idempotent - removes like if exists)
**TC-008**: GET /api/tweets/:tweetId/likes (returns like count + user's like status)

### Frontend

**TC-009**: Use Remix for frontend with programmatic routing
**TC-010**: Like button component with optimistic UI updates
**TC-011**: Accessible button with ARIA labels and keyboard support
**TC-012**: Visual states: unliked (outline heart), liked (filled heart), loading (disabled)

### Performance

**TC-013**: Like operation completes in < 500ms (p95)
**TC-014**: Like count query completes in < 100ms (p95)
**TC-015**: Database indexes ensure fast lookups even with millions of likes

---

## Assumptions

**A-001**: Feature 001 (users-can-register) is complete and deployed
**A-002**: Feature 002 (users-can-post-tweets) is complete and deployed
**A-003**: Users understand heart icon convention for "like" functionality
**A-004**: Like counts are non-sensitive public data (no privacy concerns)
**A-005**: No rate limiting required for MVP (users won't spam like/unlike rapidly)
**A-006**: Like button requires JavaScript (no fallback for JS-disabled browsers)
**A-007**: No notification system exists yet (tweet authors won't be notified of likes)
**A-008**: Likes are permanent (no soft delete or like history tracking needed)
**A-009**: Database can handle high write volume for popular tweets
**A-010**: No pagination needed for like counts (just total count, not list of users)

---

## Dependencies

### Prerequisites (Must be Complete)

1. **Feature 001**: users-can-register
   - User authentication system (sessions, cookies)
   - User database table with IDs
   - Authentication middleware (`requireAuth`)

2. **Feature 002**: users-can-post-tweets
   - Tweets database table with IDs
   - Tweet display components (TweetItem, TweetList)
   - GET /api/tweets endpoints

### Technical Dependencies

- PostgreSQL database with UUID extension
- Express API server with session middleware
- Remix frontend with existing route structure
- TypeScript + Zod validation (existing type safety chain)
- Vitest + Supertest testing framework (existing)

### External Dependencies

- None (no third-party APIs or services required)

---

## Out of Scope

**Explicitly NOT included in this feature:**

1. **Notification System**: Tweet authors will not be notified when their tweets are liked
2. **Like Activity Feed**: No timeline showing recent likes from followed users
3. **Like Analytics**: No charts or insights about like patterns
4. **Liked Tweets Page**: No dedicated page showing all tweets a user has liked
5. **Who Liked This**: No list/modal showing which users liked a specific tweet
6. **Unlike Confirmation**: No "Are you sure?" dialog when unliking
7. **Like Animations**: No animated transitions or particle effects on like button
8. **Bulk Actions**: No "unlike all" or "export likes" functionality
9. **Like History**: No tracking of when likes occurred or like/unlike timestamps
10. **Rate Limiting**: No throttling of like/unlike requests (trust users for MVP)
11. **Replies/Comments**: Likes only apply to tweets, not to replies (no replies exist yet)
12. **Like Notifications Badge**: No unread notification counter for new likes

---

## Edge Cases & Error Handling

### Edge Cases

**EC-001**: User tries to like the same tweet twice
- **Expected**: Idempotent operation - no error, like count remains same, button stays liked

**EC-002**: User tries to unlike a tweet they never liked
- **Expected**: Idempotent operation - no error, like count remains same, button stays unliked

**EC-003**: Tweet is deleted while user is viewing it
- **Expected**: Like button becomes disabled, shows error message if clicked

**EC-004**: User session expires while liking a tweet
- **Expected**: Return 401, prompt user to log in again

**EC-005**: Multiple browser tabs open, user likes in one tab
- **Expected**: Like count may be out of sync in other tabs until page refresh (acceptable for MVP)

**EC-006**: User's internet connection drops during like operation
- **Expected**: Optimistic UI shows liked state, reverts on error, shows retry option

**EC-007**: Tweet has 999+ likes
- **Expected**: Display full number (e.g., "1,234 likes") with proper formatting

**EC-008**: Rapid like/unlike toggling (spam clicking)
- **Expected**: Only final state persists, no race conditions or duplicate entries

### Error Responses

**400 Bad Request**: Invalid tweet ID format
**401 Unauthorized**: User not logged in
**404 Not Found**: Tweet doesn't exist
**409 Conflict**: Like already exists (should not occur due to idempotency)
**500 Internal Server Error**: Database or server error

---

## Data Model Preview

### Likes Table Structure

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tweet_id) -- Composite unique constraint (one like per user per tweet)
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_tweet_id ON likes(tweet_id);
```

### API Endpoints Preview

```
POST   /api/tweets/:tweetId/like   (Authenticated, idempotent)
DELETE /api/tweets/:tweetId/like   (Authenticated, idempotent)
GET    /api/tweets/:tweetId/likes  (Public, returns count + user's like status)
```

---

## UI/UX Considerations

### Like Button States

1. **Unliked** (default): Outline heart icon, gray color
2. **Liked**: Filled heart icon, red/pink color
3. **Loading**: Disabled button, spinner or opacity change
4. **Error**: Button reverts to previous state, shows error toast

### Visual Design

- Like button positioned consistently on all tweet displays
- Like count always visible next to button
- Clear visual distinction between liked and unliked states
- Accessible color contrast (not relying only on color)
- Touch-friendly button size (minimum 44x44px tap target on mobile)

### Interaction Patterns

- Single click to like, single click again to unlike (toggle)
- Optimistic UI update (immediate feedback)
- Error rollback if API call fails
- Keyboard navigation support (Tab to focus, Enter/Space to activate)

---

## Testing Strategy

### Contract Tests (API)

- POST /api/tweets/:tweetId/like returns 201 when authenticated
- POST /api/tweets/:tweetId/like returns 401 when unauthenticated
- POST /api/tweets/:tweetId/like returns 404 for non-existent tweet
- POST /api/tweets/:tweetId/like is idempotent (duplicate likes handled gracefully)
- DELETE /api/tweets/:tweetId/like returns 204 when successful
- DELETE /api/tweets/:tweetId/like returns 404 for non-existent tweet
- DELETE /api/tweets/:tweetId/like is idempotent (unliking non-liked tweet handled gracefully)
- GET /api/tweets/:tweetId/likes returns correct count and user like status

### Integration Tests

- Full flow: Register → Post tweet → Like tweet → Verify count increments
- Full flow: Like tweet → Unlike tweet → Verify count decrements
- Multiple users like same tweet → Verify count is accurate
- User likes multiple tweets → Verify each like is independent
- Anonymous user views tweet → Verify like count visible but button disabled

### Unit Tests

- Like service: createLike function creates database entry
- Like service: deleteLike function removes database entry
- Like service: getLikeCount returns accurate count
- Like service: checkUserLiked returns correct boolean
- Duplicate like handling (UNIQUE constraint test)

---

## Performance Considerations

### Database Optimization

- Composite unique index on (user_id, tweet_id) prevents duplicates and speeds up lookups
- Separate indexes on user_id and tweet_id for fast queries
- COUNT(*) queries on likes table should be < 100ms even with millions of likes
- Consider denormalization (like_count column on tweets) if performance degrades (future optimization)

### API Performance

- Like/unlike operations target < 500ms response time
- Use database transactions to ensure atomicity
- No N+1 queries when loading tweets with like data
- Batch queries when loading multiple tweets with like counts

### Frontend Performance

- Optimistic UI updates for instant feedback
- Debouncing not needed (toggle action, not continuous)
- Like state cached in component state to avoid redundant API calls
- Consider virtual scrolling for long tweet lists (future optimization)

---

## Security Considerations

### SQL Injection Prevention

- All queries use parameterized statements via `postgres` package
- No string concatenation in SQL queries
- UUIDs validated before database operations

### Authorization

- Like/unlike endpoints require valid session cookie
- Verify user is authenticated before allowing like operations
- No ownership check needed (users can like any tweet)

### Data Integrity

- Foreign key constraints ensure likes reference valid users and tweets
- Unique constraint prevents duplicate likes
- Cascade deletes ensure orphaned likes don't persist

### Rate Limiting (Future Enhancement)

- Not implemented in MVP
- Consider adding rate limiting if abuse detected (e.g., 100 likes/minute per user)

---

## Rollout & Migration

### Migration Strategy

1. Create `likes` table with constraints and indexes
2. No data migration needed (new feature, no existing data)
3. API endpoints can be deployed independently
4. Frontend components can be deployed after API is live
5. No downtime required

### Rollback Plan

1. Remove like button from frontend (hide component)
2. Disable like API endpoints (return 503 Service Unavailable)
3. Drop `likes` table if feature is permanently removed
4. No data loss concerns (likes are not critical data)

---

## Future Enhancements (Not in MVP)

1. **Like Notifications**: Notify tweet author when their tweet is liked
2. **Liked Tweets Page**: Dedicated page showing all tweets a user has liked
3. **Who Liked This**: Modal showing list of users who liked a specific tweet
4. **Like Analytics**: Charts showing like trends over time
5. **Trending Tweets**: Sort tweets by like count or like velocity
6. **Like Activity Feed**: Show recent likes from followed users
7. **Animated Like Button**: Particle effects or scale animation on like
8. **Double-Tap to Like**: Instagram-style double-tap on tweet content to like
9. **Like Count Formatting**: Show "1.2K likes" for large numbers instead of "1,234 likes"
10. **Undo Toast**: Brief undo option after liking/unliking (3-second window)

---

## Open Questions

[NONE] - Specification is complete and unambiguous. Ready for planning phase.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-08 | Specify | Initial specification created |

---

## Approval & Sign-off

**Specification Status**: ✅ COMPLETE - Ready for planning phase

**Next Steps**:
1. Run `/speckit.plan` to generate technical implementation plan
2. Run `/speckit.tasks` to generate task breakdown
3. Proceed with TDD implementation

---

**Constitutional Alignment Check** ✅

- **Principle I (Functional Programming)**: Like service functions will be pure (input → output, no side effects)
- **Principle II (API-First)**: REST endpoints defined before UI implementation
- **Principle III (TDD)**: Tests will be written before implementation code
- **Principle IV (Type Safety Chain)**: Zod → TypeScript → PostgreSQL enforced for all like data
- **Principle V (Security)**: Authentication required, parameterized queries, foreign key constraints
- **Principle VI (Simplicity & YAGNI)**: MVP scope limited to core like functionality, no over-engineering

All constitutional principles satisfied. Feature design aligns with project standards.
