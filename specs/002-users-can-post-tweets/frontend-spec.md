# Frontend Implementation Specification: Tweet Posting UI

**Feature**: 002-users-can-post-tweets (Phase 4-5: Frontend Components)
**Created**: 2025-10-08
**Status**: Draft
**Parent Spec**: `specs/002-users-can-post-tweets/spec.md`
**Input**: User request for frontend implementation of tweet composition and viewing

## Context

**Backend Status**: ✅ COMPLETE
- Database migrations complete (tweets table exists)
- API endpoints implemented and tested:
  - POST /api/tweets (create tweet)
  - GET /api/tweets/user/:userId (fetch user's tweets)
- 12 backend tests passing (contract + integration)
- Type safety chain verified (Zod → TypeScript → PostgreSQL)

**Frontend Status**: ❌ NOT STARTED
- No tweet composition UI exists
- No tweet display components exist
- ProfileView component exists but doesn't show tweets

**Goal**: Implement frontend UI components to complete Feature 002's user stories.

---

## User Stories (Frontend-Specific)

### User Story 1: Tweet Composition Interface

**As an** authenticated user
**I want** a form interface to compose tweets with real-time character counting
**So that** I can easily post tweets while staying within the 141-character limit

**Acceptance Criteria**:
1. Textarea input field for tweet content with appropriate sizing
2. Real-time character counter displaying "X / 141"
3. Visual feedback:
   - Normal state: gray counter (0-120 chars)
   - Warning state: yellow counter (121-141 chars)
   - Error state: red counter (>141 chars)
4. Submit button disabled when:
   - Content is empty after trimming whitespace
   - Content exceeds 141 characters
   - Form is submitting (loading state)
5. Error messages display for validation failures
6. Success feedback after tweet posts
7. Form clears after successful submission
8. Optimistic UI update (tweet appears immediately before server confirms)

---

### User Story 2: Tweet List Display

**As a** user (authenticated or anonymous)
**I want** to see tweets on profile pages in reverse chronological order
**So that** I can read the most recent content first

**Acceptance Criteria**:
1. Tweets display in a vertical list/feed layout
2. Each tweet shows:
   - Author's display name and @username
   - Tweet content (supports line breaks)
   - Relative timestamp ("2 hours ago", "3 days ago", "Jan 15, 2025")
   - Optional: Author's avatar
3. Tweets ordered newest-first (reverse chronological)
4. Empty state message when no tweets exist:
   - Own profile: "You haven't posted any tweets yet"
   - Others' profile: "@username hasn't posted any tweets yet"
5. Seamless integration with existing ProfileView component
6. Responsive design (mobile and desktop)
7. Accessible markup (semantic HTML, ARIA labels)

---

### User Story 3: Navigation Integration

**As an** authenticated user
**I want** easy access to tweet composition
**So that** I can quickly post tweets from anywhere in the app

**Acceptance Criteria**:
1. Navigation component includes "Compose" or "Tweet" button/link
2. Clicking navigation action opens composition interface:
   - Option A: Navigate to /compose route with dedicated page
   - Option B: Open modal overlay with inline form
3. Compose action only visible to authenticated users
4. Clear visual indication of current location
5. Consistent with existing Navigation component styling

---

## Component Architecture

### New Components

**TweetForm.tsx**
- Props: `onSuccess?: (tweet: Tweet) => void`
- State: content (string), charCount (number), isSubmitting (boolean), error (string | null)
- Features:
  - Controlled textarea input
  - Real-time character counting
  - Client-side validation (empty, >141 chars)
  - Form submission with error handling
  - Loading state during submission
  - Success callback for optimistic updates

**TweetList.tsx**
- Props: `tweets: Tweet[]`, `emptyMessage?: string`
- Features:
  - Maps tweets array to TweetItem components
  - Handles empty state with custom message
  - Reverse chronological rendering (assumes pre-sorted data)
  - Responsive grid/list layout

**TweetItem.tsx**
- Props: `tweet: Tweet`
- Features:
  - Displays username, display name, content, timestamp
  - Relative timestamp formatting utility
  - Avatar display (if available)
  - Semantic HTML structure
  - Preserves line breaks in content (`whitespace: pre-wrap`)
  - Future: Integration point for LikeButton (Feature 003)

### Route Updates

**New Route: /compose** (if dedicated page approach)
- Requires authentication (redirect to /login if not authenticated)
- Displays TweetForm component
- Redirects to user's profile after successful post

**Updated Route: /$username.tsx**
- Loader fetches both profile AND tweets data
- Passes tweets to ProfileView component
- ProfileView renders TweetList below profile info

**Updated Route: _index.tsx** (optional)
- Shows recent tweets from all users (global feed) - future enhancement
- For MVP: just profile-specific tweets

### Utility Functions

**formatRelativeTime(date: Date): string**
- Input: JavaScript Date object
- Output: Human-readable relative time string
- Logic:
  - < 1 minute: "just now"
  - < 60 minutes: "X minutes ago"
  - < 24 hours: "X hours ago"
  - < 7 days: "X days ago"
  - >= 7 days: "MMM DD, YYYY" (e.g., "Jan 15, 2025")

**validateTweetContent(content: string): { valid: boolean; error?: string }**
- Trims whitespace
- Checks length constraints
- Returns validation result with error message

---

## Design System Integration

**Flowbite React Components to Use**:
- `<Textarea>` for tweet composition
- `<Button>` for submit/compose actions
- `<Card>` for tweet display containers (optional)
- `<Avatar>` for user profile images
- `<Alert>` for error messages
- `<Badge>` for character counter (optional)
- `<Spinner>` for loading states

**Tailwind Utilities**:
- `text-gray-500` for character counter (normal)
- `text-yellow-500` for warning state (121-141)
- `text-red-500` for error state (>141)
- `disabled:opacity-50` for disabled submit button
- `whitespace-pre-wrap` for tweet content line breaks
- Responsive breakpoints: `sm:`, `md:`, `lg:`

---

## Success Criteria (Frontend-Specific)

- **SC-F01**: TweetForm renders with character counter showing "0 / 141" initially
- **SC-F02**: Character counter updates within 50ms of user input (imperceptible lag)
- **SC-F03**: Submit button disables when content is empty or exceeds 141 characters
- **SC-F04**: Form submission shows loading state (disabled button + spinner)
- **SC-F05**: Successful tweet post clears form and shows success feedback
- **SC-F06**: Profile pages display all user's tweets in reverse chronological order
- **SC-F07**: Empty profiles show appropriate "No tweets yet" message
- **SC-F08**: Relative timestamps display correctly ("2 hours ago" for 2-hour-old tweets)
- **SC-F09**: Tweet content preserves line breaks and whitespace formatting
- **SC-F10**: Mobile layout is responsive and usable (textarea expands, text readable)
- **SC-F11**: Keyboard navigation works (Tab to fields, Enter to submit)
- **SC-F12**: Screen readers can access all tweet information (ARIA labels present)

---

## Testing Strategy

### Manual Testing Checklist

**Tweet Composition**:
- [ ] Open compose page/modal as authenticated user
- [ ] Type text and verify character counter updates in real-time
- [ ] Verify counter color changes at 121 chars (yellow) and 142 chars (red)
- [ ] Verify submit button disables when counter is red or empty
- [ ] Submit valid tweet and verify redirect to profile
- [ ] Verify new tweet appears at top of profile feed
- [ ] Attempt to access compose as anonymous user → redirects to login

**Tweet Viewing**:
- [ ] View own profile with tweets → all tweets visible newest-first
- [ ] View own profile with no tweets → see "You haven't posted any tweets yet"
- [ ] View another user's profile with tweets → all tweets visible
- [ ] View another user's profile with no tweets → see "@username hasn't posted"
- [ ] Verify timestamps show relative time ("X hours ago")
- [ ] Verify tweets from 7+ days ago show date ("Jan 15, 2025")
- [ ] Verify line breaks in tweet content are preserved
- [ ] Test on mobile viewport → layout is responsive

**Error Handling**:
- [ ] Submit empty tweet → see error message
- [ ] Submit tweet with only whitespace → see error message
- [ ] Submit tweet with 142+ characters → button is disabled (can't submit)
- [ ] Simulate network error → see error message, tweet doesn't disappear
- [ ] Attempt to post tweet with expired session → redirect to login

---

## Implementation Notes

**Character Counting**:
- Use `content.length` (JavaScript string length, counts UTF-16 code units)
- This matches backend validation in `TweetSchema`
- Edge case: Emojis may count as 2 characters (acceptable for MVP)

**Timestamp Formatting**:
- Backend returns ISO 8601 timestamps
- Convert to JavaScript Date: `new Date(tweet.createdAt)`
- Use `formatRelativeTime()` utility for display
- Consider using `<time datetime={...}>` HTML element for semantics

**Optimistic UI**:
- Option A: Show tweet immediately with temporary ID, replace on server response
- Option B: Wait for server response before showing (simpler, slight delay)
- Recommendation: Option B for MVP (simpler, more reliable)

**Loader Data Structure**:
```typescript
// /$username.tsx loader return type
{
  profile: Profile;
  tweets: Tweet[];
  error: string | null;
}
```

**Form Submission Flow**:
1. User types in TweetForm
2. Character counter updates on every keystroke
3. User clicks "Post Tweet" button
4. Frontend validates (client-side UX)
5. POST request to /api/tweets with content
6. Backend validates (server-side security)
7. Success: redirect to /profile with success message
8. Failure: show error message, keep form populated

---

## Dependencies

**Completed Prerequisites**:
- ✅ Feature 001 (user registration, authentication, profiles)
- ✅ Feature 002 backend (APIs, database, service layer)
- ✅ Remix routing setup
- ✅ Flowbite + Tailwind styling
- ✅ Navigation component exists

**Required Infrastructure** (already exists):
- TypeScript types for Tweet entity
- API client/fetch utilities (or use native fetch)
- Session management (cookies for authenticated requests)
- Error handling patterns

---

## Future Enhancements (Out of Scope)

The following are explicitly NOT included in this frontend implementation:

- Tweet editing or deletion UI
- Tweet like button (Feature 003)
- Media upload interface
- Rich text editor
- @ mentions autocomplete
- Hashtag parsing
- URL preview cards
- Infinite scroll / pagination
- Tweet drafts (localStorage)
- Keyboard shortcuts (e.g., Ctrl+Enter to post)
- Tweet analytics (view counts)
- Global feed / timeline view
- Search / filter tweets

---

## Validation Checklist

Before marking this implementation complete, verify:

- [ ] All 3 user stories have acceptance criteria met
- [ ] TweetForm, TweetList, TweetItem components created
- [ ] /compose route exists and requires authentication
- [ ] /$username route displays tweets
- [ ] Navigation component includes compose action
- [ ] Character counter works correctly with color changes
- [ ] Empty states display appropriate messages
- [ ] Relative timestamps format correctly
- [ ] All manual testing checklist items pass
- [ ] Mobile responsive design verified
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: screen reader labels present
- [ ] No console errors or warnings
- [ ] TypeScript compiles without errors
- [ ] Constitution compliance:
  - [ ] Functional components (no class components)
  - [ ] Type safety maintained (TypeScript types used)
  - [ ] Integrates with existing API contracts
  - [ ] Follows existing design patterns
- [ ] README.md updated to reflect frontend completion
- [ ] Feature 002 can be marked as 100% complete

---

## Notes

This specification focuses on **frontend implementation only**. The backend APIs are already complete and tested. This is Phase 4-5 of the original Feature 002 task breakdown.

After this implementation is complete, Feature 003 (like functionality) can add the LikeButton component to TweetItem as an integration point.
