# Feature Specification: Tweet Posting

**Feature Branch**: `002-users-can-post-tweets`
**Created**: 2025-10-08
**Status**: Draft
**Input**: User description: "Authenticated users can post tweets containing up to 141 characters of text. Each tweet displays the author's username, the tweet content, and a timestamp. Users can view all their own tweets on their profile page."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Post Tweet (Priority: P1)

Authenticated users can compose and post tweets with text content up to 141 characters.

**Why this priority**: Tweet posting is the core functionality of Tweeter. Without it, the platform has no content. This is the minimum viable feature that makes Tweeter useful.

**Independent Test**: Can be fully tested by logging in as a user, composing a tweet with valid content, posting it, and verifying the tweet appears in the database and on the user's profile. Delivers immediate value as users can express themselves.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the compose tweet page, **When** they enter text (1-141 characters) and click "Post Tweet", **Then** the tweet is created and saved with their username, the tweet content, and a timestamp
2. **Given** an authenticated user composing a tweet, **When** they enter text exceeding 141 characters, **Then** they see a character count warning and cannot submit until content is within limit
3. **Given** an authenticated user composing a tweet, **When** they try to submit an empty tweet, **Then** they see an error message requiring at least 1 character
4. **Given** an authenticated user, **When** they successfully post a tweet, **Then** they are redirected to their profile page showing the new tweet

---

### User Story 2 - View Own Tweets on Profile (Priority: P1)

Authenticated users can view all their own tweets displayed on their profile page in chronological order (newest first).

**Why this priority**: Users need immediate feedback that their tweet was posted successfully. Viewing their own tweets validates the posting action and provides content for their profile page. This is essential for the MVP.

**Independent Test**: Can be fully tested by logging in as a user, posting multiple tweets, navigating to their profile, and verifying all tweets appear in reverse chronological order with correct content, username, and timestamps.

**Acceptance Scenarios**:

1. **Given** an authenticated user with posted tweets, **When** they navigate to their profile page, **Then** they see all their tweets displayed with username, content, and timestamp
2. **Given** an authenticated user viewing their profile, **When** they have multiple tweets, **Then** tweets are displayed in reverse chronological order (newest first)
3. **Given** an authenticated user with no tweets, **When** they view their profile page, **Then** they see a message indicating no tweets yet
4. **Given** an authenticated user viewing their profile, **When** they refresh the page after posting a new tweet, **Then** the new tweet appears at the top of the list

---

### User Story 3 - View Others' Tweets on Profiles (Priority: P2)

Any user (authenticated or anonymous) can view all tweets on any user's public profile page.

**Why this priority**: Public tweet viewing enables discovery and social interaction. This extends the profile viewing feature from 001-users-can-register and makes tweets publicly accessible, which is core to Twitter-like functionality.

**Independent Test**: Can be fully tested by navigating to any user's profile (as authenticated or anonymous visitor) and verifying their tweets are visible with correct display.

**Acceptance Scenarios**:

1. **Given** an anonymous visitor, **When** they navigate to any user's profile URL (/@username), **Then** they see all tweets posted by that user
2. **Given** an authenticated user, **When** they navigate to another user's profile, **Then** they see all tweets posted by that user
3. **Given** any visitor viewing a profile, **When** the user has no tweets, **Then** they see a message indicating no tweets from this user

---

### User Story 4 - Real-Time Character Counter (Priority: P3)

When composing a tweet, users see a real-time character counter showing remaining characters.

**Why this priority**: Character counter provides better UX by showing users how close they are to the 141-character limit. This prevents submission errors and improves the posting experience.

**Independent Test**: Can be fully tested by typing in the tweet compose field and verifying the character count updates in real-time and changes color as it approaches the limit.

**Acceptance Scenarios**:

1. **Given** a user composing a tweet, **When** they type characters, **Then** the character counter updates in real-time showing characters used / 141
2. **Given** a user composing a tweet, **When** they reach 120 characters, **Then** the counter changes to a warning color (yellow)
3. **Given** a user composing a tweet, **When** they exceed 141 characters, **Then** the counter turns red and the submit button is disabled
4. **Given** a user composing a tweet, **When** they delete characters back under 141, **Then** the counter returns to normal color and the submit button is re-enabled

---

### Edge Cases

- What happens when a user tries to post a tweet without being authenticated?
  - Redirect to login page with message "You must be logged in to post tweets"
- How does the system handle concurrent tweet postings from the same user?
  - Each tweet gets a unique ID and timestamp, no conflicts occur
- What happens if tweet posting to database fails?
  - User sees error message "Failed to post tweet, please try again"
- What happens when viewing a profile of a user who has deleted their account?
  - 404 error (same as non-existent user) since cascade delete removes tweets
- What if a tweet contains only whitespace characters?
  - Validation trims whitespace and rejects if empty after trimming
- How are tweets ordered when multiple tweets have the same timestamp?
  - Secondary sort by tweet ID (UUID) ensures consistent ordering
- What happens when a user posts exactly 141 characters?
  - Tweet is accepted as valid (141 is inclusive limit)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to post tweets containing 1-141 characters of text
- **FR-002**: System MUST reject tweets with 0 characters (empty tweets)
- **FR-003**: System MUST reject tweets exceeding 141 characters
- **FR-004**: System MUST store each tweet with a unique ID (uuidv7), author user ID, content text, and creation timestamp
- **FR-005**: System MUST display author username, tweet content, and timestamp for each tweet
- **FR-006**: System MUST display tweets in reverse chronological order (newest first) on profile pages
- **FR-007**: Users MUST be able to view all their own tweets on their profile page
- **FR-008**: System MUST make all tweets publicly viewable on user profile pages (no privacy settings)
- **FR-009**: System MUST redirect unauthenticated users attempting to post tweets to the login page
- **FR-010**: System MUST trim whitespace from tweet content before validation
- **FR-011**: System MUST provide a real-time character counter showing characters used / 141
- **FR-012**: System MUST visually indicate when character count approaches or exceeds limit
- **FR-013**: System MUST disable tweet submission when character count exceeds 141
- **FR-014**: System MUST validate tweet content on both frontend (UX) and backend (security)
- **FR-015**: System MUST generate unique tweet IDs using uuidv7
- **FR-016**: System MUST associate each tweet with the authenticated user's ID
- **FR-017**: System MUST handle errors gracefully and provide user-friendly error messages
- **FR-018**: Anonymous visitors MUST be able to view tweets on public profiles without authentication

### Key Entities

- **Tweet**: Represents a user's posted message. Key attributes:
  - **id**: Unique identifier (uuidv7)
  - **userId**: Reference to the user who posted the tweet
  - **content**: Text content of the tweet (1-141 characters)
  - **createdAt**: Timestamp when the tweet was posted
  - **updatedAt**: Timestamp when the tweet was last modified (future: editing)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can compose and post a tweet in under 30 seconds (from compose page load to successful post)
- **SC-002**: Character counter updates within 50ms of keystroke (imperceptible lag)
- **SC-003**: Profile pages load with all tweets visible within 2 seconds (for profiles with up to 100 tweets)
- **SC-004**: 100% of submitted tweets within character limit are successfully stored in database
- **SC-005**: Tweets are displayed in correct chronological order on first load (no pagination bugs)
- **SC-006**: Anonymous visitors can view profile tweets without any authentication barriers
- **SC-007**: Form validation prevents submission of invalid tweets (0 chars or >141 chars) 100% of the time
- **SC-008**: Post-tweet redirect to profile page completes within 1 second

## Assumptions

**Documented assumptions made to fill gaps in the feature description:**

1. **No tweet editing**: Users cannot edit tweets after posting (future `/speckit.modify` task if needed)
2. **No tweet deletion**: Users cannot delete tweets after posting (future enhancement)
3. **No rich text formatting**: Tweets are plain text only (no bold, italic, links, hashtags, mentions)
4. **No media attachments**: Text-only tweets (no images, videos, GIFs)
5. **No URL shortening**: URLs count toward character limit at full length
6. **No draft saving**: Compose form does not auto-save drafts (users must complete in one session)
7. **No pagination initially**: All tweets load on profile page (pagination added later if needed for performance)
8. **No tweet liking yet**: Like functionality is a separate feature (003-users-can-like-tweets)
9. **No retweets or replies**: Single-level tweets only (threading is future enhancement)
10. **No tweet visibility controls**: All tweets are public (no private accounts or tweet deletion)
11. **Character counting**: Uses JavaScript `.length` property (Unicode code units, not grapheme clusters)
12. **Timestamp format**: ISO 8601 format stored in database, displayed as relative time (e.g., "2 hours ago")
13. **No rate limiting initially**: Users can post as many tweets as they want (rate limiting added if abuse occurs)
14. **Tweet ownership**: Only the author's user ID is stored (no co-authors or mentions)
15. **Profile integration**: Tweets appear on existing profile pages from 001-users-can-register

## Dependencies

- **Feature 001-users-can-register**: Requires users and profiles to exist (users must be authenticated, tweets display on profile pages)
- **Database**: PostgreSQL database via Neon must be accessible
- **Authentication system**: Requires working session management from 001-users-can-register
- **No external APIs**: No dependencies on external tweet processing services

## Constraints

- **141-character limit**: Tweet content strictly limited to 141 characters (Tweeter's defining constraint)
- **Text-only**: No media, rich text, or formatting in MVP
- **Public tweets only**: No privacy controls or tweet deletion in MVP
- **No threading**: Tweets are standalone (no replies or conversations)
- **Single author**: One tweet, one author (no collaborative tweets)

## Out of Scope

The following features are explicitly NOT included in this feature:

- Tweet editing or deletion (future enhancement)
- Rich text formatting (bold, italic, underline, etc.)
- Media attachments (images, videos, GIFs)
- URL shortening or link previews
- Hashtags or @mentions (no special parsing)
- Retweets, quotes, or replies
- Tweet threading or conversations
- Draft saving or auto-save
- Tweet scheduling or delayed posting
- Analytics (view counts, engagement metrics)
- Tweet search or filtering
- Pagination for tweet lists (all tweets load at once)
- Like, favorite, or bookmark functionality (separate feature)
- Privacy controls (private accounts, protected tweets)
- Tweet notifications
- Trending topics or discovery feeds
- Direct messages (separate feature)
