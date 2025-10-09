# Research: Tweet Posting Technical Decisions

**Feature**: 002-users-can-post-tweets
**Date**: 2025-10-08
**Phase**: 0 (Research & Technical Decisions)

## Database Schema Design

### Decision: Single tweets table with foreign key to users

**Options Considered:**
1. Single tweets table with user_id FK ✅ **SELECTED**
2. Embedded tweets as JSONB array in users table
3. Separate tweets and tweet_metadata tables

**Rationale**:
- Option 1 (selected): Clean one-to-many relationship, easy to query, supports future features (likes, retweets)
- Option 2 rejected: Poor scalability, difficult to query individual tweets, violates normalization
- Option 3 rejected: Over-engineering for MVP, no metadata beyond basic fields needed yet

**Schema**:
```sql
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content VARCHAR(141) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tweets_user_id ON tweets(user_id);
CREATE INDEX idx_tweets_created_at ON tweets(created_at DESC);
```

**Key Decisions**:
- CASCADE DELETE: When user deleted, their tweets deleted automatically
- VARCHAR(141): Enforces character limit at database level
- Indexes: user_id for profile queries, created_at DESC for chronological sorting
- No soft delete: Hard delete only (simplicity for MVP)

---

## Character Counting Method

### Decision: JavaScript `.length` property (UTF-16 code units)

**Options Considered:**
1. JavaScript `.length` (UTF-16 code units) ✅ **SELECTED**
2. Grapheme cluster counting (Unicode segmentation)
3. Byte length (UTF-8 encoding)

**Rationale**:
- Option 1 (selected): Simple, fast, consistent with most platforms, good enough for MVP
- Option 2 rejected: Complex, requires external library, slower, overkill for text-only tweets
- Option 3 rejected: Inconsistent across languages, confusing for users

**Trade-offs**:
- Some emojis count as 2 characters (surrogate pairs) - acceptable for MVP
- Most Latin text counts 1:1 - covers majority use case
- Future enhancement: Switch to grapheme clusters if users complain

**Implementation**:
```typescript
// Frontend validation
const charCount = tweetContent.length; // Simple, fast

// Backend validation (same logic)
const isValid = tweetContent.trim().length >= 1 && tweetContent.trim().length <= 141;
```

---

## Timestamp Display Format

### Decision: Relative time for recent tweets, absolute for old tweets

**Options Considered:**
1. Relative time with fallback to absolute ✅ **SELECTED**
2. Always absolute (e.g., "Jan 15, 2025 3:42 PM")
3. Always relative (e.g., "2 hours ago")

**Rationale**:
- Option 1 (selected): Best UX - relative for recent engagement ("2 hours ago"), absolute for archive ("Jan 15, 2025")
- Option 2 rejected: Less engaging, doesn't convey recency
- Option 3 rejected: Confusing for old tweets ("5 months ago" less useful than date)

**Implementation**:
- < 24 hours: "X minutes/hours ago"
- < 7 days: "X days ago"
- >= 7 days: "MMM DD, YYYY" (e.g., "Jan 15, 2025")

**Library**: Use existing JavaScript `Date` methods or simple helper function (no heavy library needed)

---

## Tweet Ordering

### Decision: Reverse chronological (newest first) with secondary sort by ID

**Options Considered:**
1. Reverse chronological with ID fallback ✅ **SELECTED**
2. Reverse chronological only
3. Algorithmic ranking (e.g., engagement-based)

**Rationale**:
- Option 1 (selected): Deterministic ordering, handles same-timestamp tweets (rare but possible)
- Option 2 rejected: Non-deterministic when timestamps collide (e.g., batch imports, system clock issues)
- Option 3 rejected: Over-engineering for MVP, requires engagement data (likes, retweets) not yet implemented

**SQL Query**:
```sql
SELECT * FROM tweets
WHERE user_id = $1
ORDER BY created_at DESC, id DESC;
```

**Performance**: Index on (created_at DESC) ensures fast sorting even with thousands of tweets

---

## Pagination Strategy

### Decision: Load all tweets initially, add pagination later if needed

**Options Considered:**
1. No pagination (load all) ✅ **SELECTED**
2. Cursor-based pagination
3. Offset-based pagination

**Rationale**:
- Option 1 (selected): Simpler for MVP, acceptable for <100 tweets (spec SC-003 targets this)
- Option 2 rejected: More complex, not needed until profiles have hundreds of tweets
- Option 3 rejected: Same as option 2, plus offset pagination has issues with data changes

**Performance Threshold**:
- MVP target: Profiles with up to 100 tweets load in < 2 seconds (SC-003)
- Future: Add pagination when average user exceeds 50 tweets or profile load > 2 seconds

**Implementation Path**:
1. MVP: `SELECT * FROM tweets WHERE user_id = $1 ORDER BY created_at DESC`
2. Future: Add `LIMIT 20 OFFSET $2` and "Load More" button when needed

---

## Character Counter UX

### Decision: Real-time counter with color indicators at thresholds

**Options Considered:**
1. Real-time with color thresholds ✅ **SELECTED**
2. Real-time without colors
3. Validation only on submit

**Rationale**:
- Option 1 (selected): Best UX - users see limit approach, colors provide visual feedback
- Option 2 rejected: Less intuitive, users may accidentally exceed limit
- Option 3 rejected: Poor UX, users only find out about errors after submission

**Color Thresholds**:
- 0-120 characters: Gray (normal)
- 121-140 characters: Yellow/Amber (warning - approaching limit)
- 141 characters: Green (exactly at limit - valid)
- 142+ characters: Red (exceeds limit - invalid, submit disabled)

**Performance**: `onChange` handler with debouncing if needed (spec SC-002 requires < 50ms)

---

## Form Validation Strategy

### Decision: Client-side real-time + server-side on submit (dual validation)

**Options Considered**:
1. Client + server validation ✅ **SELECTED**
2. Server-side only
3. Client-side only

**Rationale**:
- Option 1 (selected): Best security + UX balance (Constitution V requires both)
- Option 2 rejected: Poor UX (no real-time feedback), violates SC-002
- Option 3 rejected: Insecure (bypassed by API calls), violates Constitution

**Implementation**:
```typescript
// Frontend (UX)
<Form onSubmit={validateAndSubmit}>
  <Textarea onChange={updateCharCount} />
  <span>{charCount} / 141</span>
</Form>

// Backend (security)
router.post('/tweets', validate(TweetSchema), async (req, res) => {
  // Zod validation already executed by middleware
});
```

---

## Tweet Content Sanitization

### Decision: Trim whitespace, no other sanitization (text-only)

**Options Considered**:
1. Trim whitespace only ✅ **SELECTED**
2. HTML entity encoding
3. Full XSS sanitization (DOMPurify)

**Rationale**:
- Option 1 (selected): Sufficient for plain text tweets, prevents all-whitespace tweets
- Option 2 rejected: Overkill if displaying as plain text (React escapes by default)
- Option 3 rejected: Over-engineering for text-only content with no HTML

**Implementation**:
```typescript
// Backend validation
const TweetSchema = z.object({
  content: z.string()
    .trim() // Remove leading/trailing whitespace
    .min(1, "Tweet cannot be empty")
    .max(141, "Tweet exceeds 141 characters")
});
```

**Security Note**: React automatically escapes text content when rendering, preventing XSS

---

## Database Migration Strategy

### Decision: Single migration file for tweets table

**File**: `003_create_tweets.sql`

**Dependencies**: Requires users table from 001 (foreign key constraint)

**Rollback Plan**: `DROP TABLE tweets CASCADE;` (safe since no dependent tables yet)

---

## API Endpoint Design

### Decision: RESTful endpoints following 001 patterns

**Endpoints**:
- `POST /api/tweets` - Create tweet (requires auth)
- `GET /api/tweets/user/:userId` - Get all tweets by user (public)

**Status Codes**:
- 201 Created: Tweet posted successfully
- 400 Bad Request: Validation errors (empty, >141 chars)
- 401 Unauthorized: Not logged in
- 500 Internal Server Error: Database/server errors

**Alternative Considered**: `GET /api/profiles/:username/tweets`
- Rejected: Cleaner to separate tweet resource from profile resource
- Selected approach aligns with REST principles (resource-oriented URLs)

---

## Frontend Routing

### Decision: Extend existing routes, add /compose

**New Routes**:
- `/compose` - Tweet composition page (requires auth)

**Updated Routes**:
- `/@:username` - Add tweet list to existing profile view (public)

**Rationale**: Minimal route additions, reuses existing profile pages

---

## Component Architecture

### Decision: Presentational components for reusability

**Components**:
- `TweetComposer.tsx` - Form with char counter (used on /compose page)
- `TweetList.tsx` - Display tweets in list (used on profile pages)
- `TweetItem.tsx` - Single tweet display (used by TweetList)

**Rationale**: Small, focused components following React best practices

---

## State Management

### Decision: No global state (use Remix loaders/actions)

**Options Considered**:
1. Remix loaders/actions ✅ **SELECTED**
2. React Context
3. Redux/Zustand

**Rationale**:
- Option 1 (selected): Server-side rendering, simpler, follows Remix patterns
- Option 2 rejected: Unnecessary for server-fetched data
- Option 3 rejected: Over-engineering for MVP

**Data Flow**:
1. User posts tweet → Remix action → API call → database
2. Profile page loads → Remix loader → API call → display tweets

---

## Testing Strategy

### Decision: Contract tests + integration tests (same as 001)

**Test Coverage**:
- Contract tests: POST /api/tweets, GET /api/tweets/user/:userId
- Integration tests: Login → post tweet → view on profile
- Unit tests: tweet.service.ts functions (optional)

**Test Cases**:
- Valid tweet (1-141 chars) → 201 Created
- Empty tweet → 400 Bad Request
- Tweet >141 chars → 400 Bad Request
- Unauthenticated post → 401 Unauthorized
- View tweets (authenticated + anonymous) → 200 OK
- Chronological ordering verified

---

## Performance Considerations

### Decision: Simple queries now, optimize later if needed

**Current Approach**:
- No query optimization initially
- No caching
- No pagination (load all tweets)

**Monitoring Plan**:
- Track profile page load times
- Add pagination if >100 tweets causes >2 second load (SC-003)
- Add Redis caching if database becomes bottleneck

**Optimization Path** (future):
1. Add database indexes (already planned in schema)
2. Add pagination (LIMIT/OFFSET)
3. Add Redis caching for hot profiles
4. Add CDN for static assets

---

## Summary of Key Decisions

| Decision | Selected Approach | Rationale |
|----------|------------------|-----------|
| Database | Single tweets table with FK | Clean, scalable, supports future features |
| Character counting | JavaScript `.length` | Simple, fast, good enough for MVP |
| Timestamp display | Relative with absolute fallback | Best UX for recency and archival |
| Ordering | Reverse chronological + ID | Deterministic, fast with indexes |
| Pagination | None initially | Simple for MVP, add later if needed |
| Character counter | Real-time with colors | Best UX, meets <50ms requirement |
| Validation | Client + server | Security + UX balance |
| Sanitization | Trim whitespace only | Sufficient for plain text |
| API design | RESTful following 001 | Consistency, familiar patterns |
| Testing | Contract + integration | Same strategy as 001 |

All decisions prioritize **simplicity**, **consistency with 001**, and **constitutional compliance**.
