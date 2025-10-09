# Frontend Implementation Plan: Tweet Posting UI

**Branch**: `002-users-can-post-tweets-frontend` | **Date**: 2025-10-08
**Parent Spec**: [frontend-spec.md](./frontend-spec.md) | **Backend Plan**: [plan.md](./plan.md)

## Summary

**Primary Requirement**: Implement React/Remix UI components for tweet composition and viewing. Authenticated users can compose tweets with real-time character counting (0-141 chars). All users (authenticated and anonymous) can view tweets on profile pages in reverse chronological order with relative timestamps. Empty profiles show friendly "No tweets yet" messages.

**Technical Approach**: Create three new React components (TweetForm, TweetList, TweetItem) using Flowbite React components and Tailwind CSS to match existing design system. Add new `/compose` route for tweet composition with authentication requirement. Update existing `/$username` route loader to fetch tweets alongside profile data. Integrate TweetList into ProfileView component. Implement character counter with color-coded states (gray/yellow/red). Create `formatRelativeTime()` utility for timestamp display. Follow established patterns from RegisterForm and LoginForm components.

## Technical Context

**Frontend Stack**:
- React 18.3+ with Remix 2.16+ (full-stack framework)
- TypeScript 5.x (strict mode)
- Flowbite React 0.10+ (component library)
- Tailwind CSS 3.4+ (utility-first styling)
- Remix useLoaderData, useActionData, useNavigation hooks
- Native fetch API for backend communication

**Backend APIs (Already Complete)**:
- POST /api/tweets - Create new tweet (requires auth, returns 201 + tweet object)
- GET /api/tweets/user/:userId - Fetch user's tweets (public, returns 200 + tweets array)

**Existing Patterns to Follow**:
- Form submissions: Remix `<Form>` with action handlers (see login.tsx, register.tsx)
- Loading states: `useNavigation()` hook with `isProcessing` button prop
- Error handling: `useActionData()` with Alert components for validation errors
- Data loading: Remix loaders with `useLoaderData()` hook
- Navigation: Flowbite `<Navbar>` with conditional rendering based on auth state
- Styling: Flowbite components + Tailwind utilities, max-w-2xl containers, centered layouts

**Performance Goals**:
- Character counter updates < 50ms (React controlled input with useState)
- Tweet submission < 1 second (backend API already optimized)
- Profile page load with tweets < 2 seconds (single database query)
- Responsive mobile/desktop layouts

**Constraints**:
- Must match existing Flowbite/Tailwind design system
- No external date libraries (implement formatRelativeTime in vanilla JS)
- No state management libraries (use React useState only)
- Server-side rendering with Remix (SEO-friendly, fast initial load)

## Constitution Check

*Frontend implementation compliance with [Tweeter Constitution v1.0.0](../../.specify/memory/constitution.md):*

### I. Functional Programming First
- [x] React functional components (no class components)
- [x] Pure render functions (no side effects in render)
- [x] State transformations use immutability (setState with new objects)
- [x] Utility functions are pure (formatRelativeTime, validateTweetContent)

### II. API-First Architecture
- [x] Backend APIs complete and tested before frontend work
- [x] Frontend consumes defined REST contracts (POST /api/tweets, GET /api/tweets/user/:userId)
- [x] No direct database access from client
- [x] API client uses standard fetch with proper headers/credentials

### III. Test-First Development
- [x] Backend APIs have full test coverage (12 tests passing)
- [ ] Frontend: Manual testing checklist in spec (automated UI tests future enhancement)
- [x] TypeScript compile-time validation prevents type errors
- [x] Zod validation on both frontend (UX) and backend (security)

### IV. Type Safety Chain
- [x] Components use TypeScript interfaces for props
- [x] API responses typed with existing Tweet interface
- [x] Form data validated with existing TweetSchema (Zod)
- [x] No 'any' types used

### V. Security for MVP
- [x] Authentication enforced by backend (401 errors handled in UI)
- [x] Client-side validation for UX only (backend validates all inputs)
- [x] Session cookies httpOnly (handled by backend)
- [x] No sensitive data in client-side code

### VI. Simplicity & YAGNI
- [x] Implements only required features (composition + viewing)
- [x] No premature optimizations (no virtualization, pagination yet)
- [x] Simple React patterns (useState, no complex state management)
- [x] Reuses existing components where possible (Navigation, ProfileView)

**Constitution Check Status: ✅ PASSED** (All applicable gates satisfied)

## Component Architecture

### Component Hierarchy

```
App (root.tsx)
└── Navigation
    ├── /compose route
    │   └── TweetForm
    └── /$username route
        └── ProfileView
            └── TweetList
                └── TweetItem[]
```

### New Components Detail

#### 1. TweetForm Component

**File**: `src/app/components/TweetForm.tsx`

**Purpose**: Compose new tweets with real-time character counting and validation

**Props Interface**:
```typescript
interface TweetFormProps {
  onSuccess?: (tweet: Tweet) => void; // Optional callback after successful post
}
```

**State**:
```typescript
const [content, setContent] = useState<string>('');
const charCount = content.length; // Derived state
```

**Key Features**:
- Flowbite `<Textarea>` for input (rows={4}, placeholder)
- Character counter: `{charCount} / 141`
  - 0-120 chars: `text-gray-500` (normal)
  - 121-141 chars: `text-yellow-500` (warning)
  - 142+ chars: `text-red-500` (error)
- Submit button disabled when:
  - `content.trim().length === 0` (empty after whitespace removal)
  - `charCount > 141` (exceeds limit)
  - `isSubmitting === true` (during API call)
- Flowbite `<Button>` with `isProcessing` prop during submission
- Error display with Flowbite `<Alert color="failure">`
- Clear form after successful submission
- Use Remix `<Form method="post">` for progressive enhancement

**Validation Logic**:
```typescript
const isValid = content.trim().length > 0 && content.length <= 141;
const counterColor =
  charCount > 141 ? 'text-red-500' :
  charCount > 120 ? 'text-yellow-500' :
  'text-gray-500';
```

**Layout Pattern** (follows LoginForm.tsx):
```tsx
<div className="w-full max-w-md mx-auto">
  <div className="bg-white rounded-lg shadow-md p-8">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">
      Compose Tweet
    </h2>
    <Form method="post" className="space-y-4">
      {/* Textarea + counter + button */}
    </Form>
  </div>
</div>
```

**Dependencies**:
- Remix: `Form`, `useActionData`, `useNavigation`
- Flowbite: `Button`, `Label`, `Textarea`, `Alert`
- Hooks: `useState` for content state

---

#### 2. TweetList Component

**File**: `src/app/components/TweetList.tsx`

**Purpose**: Display array of tweets or empty state message

**Props Interface**:
```typescript
interface TweetListProps {
  tweets: Tweet[];
  emptyMessage?: string; // Custom message when no tweets
  username?: string; // For personalized empty messages
}
```

**State**: None (stateless presentation component)

**Key Features**:
- Maps `tweets` array to `<TweetItem>` components
- Empty state display when `tweets.length === 0`
- Assumes tweets are pre-sorted (backend returns newest-first)
- Responsive spacing with Tailwind `space-y-4`
- Container with max-width for readability

**Empty State Logic**:
```typescript
const defaultEmptyMessage = username
  ? `@${username} hasn't posted any tweets yet`
  : "No tweets yet";
```

**Layout Pattern**:
```tsx
<div className="w-full max-w-2xl mx-auto mt-8">
  {tweets.length === 0 ? (
    <div className="text-center text-gray-500 py-12">
      <p>{emptyMessage || defaultEmptyMessage}</p>
    </div>
  ) : (
    <div className="space-y-4">
      {tweets.map((tweet) => (
        <TweetItem key={tweet.id} tweet={tweet} />
      ))}
    </div>
  )}
</div>
```

**Dependencies**:
- TweetItem component
- Tweet type from `src/types/index.ts`

---

#### 3. TweetItem Component

**File**: `src/app/components/TweetItem.tsx`

**Purpose**: Display single tweet with username, content, and timestamp

**Props Interface**:
```typescript
interface TweetItemProps {
  tweet: Tweet;
  displayName?: string; // Optional: Author's display name
  username?: string; // Optional: Author's username
  avatarUrl?: string | null; // Optional: Author's avatar
}
```

**State**: None (stateless presentation component)

**Key Features**:
- Flowbite `<Card>` for tweet container (optional, or plain div)
- Flowbite `<Avatar>` for user profile image (if provided)
- Display name and @username
- Tweet content with `whitespace-pre-wrap` to preserve line breaks
- Relative timestamp using `formatRelativeTime()` utility
- Semantic HTML: `<article>` for tweet, `<time datetime={...}>` for timestamp
- Hover effect: `hover:bg-gray-50` transition
- Future: Integration point for LikeButton (Feature 003)

**Layout Pattern**:
```tsx
<Card className="hover:bg-gray-50 transition-colors">
  <div className="flex gap-3">
    {avatarUrl && (
      <Avatar img={avatarUrl} rounded size="md" />
    )}
    <div className="flex-1">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-bold text-gray-900">{displayName}</span>
        <span className="text-sm text-gray-500">@{username}</span>
        <span className="text-sm text-gray-500">·</span>
        <time
          dateTime={tweet.createdAt.toISOString()}
          className="text-sm text-gray-500"
        >
          {formatRelativeTime(tweet.createdAt)}
        </time>
      </div>
      <p className="text-gray-900 whitespace-pre-wrap">{tweet.content}</p>
    </div>
  </div>
</Card>
```

**Dependencies**:
- Flowbite: `Card`, `Avatar`
- Utility: `formatRelativeTime()`
- Tweet type from `src/types/index.ts`

---

### Utility Functions

#### formatRelativeTime()

**File**: `src/app/utils/formatTimestamp.ts`

**Signature**: `formatRelativeTime(date: Date): string`

**Logic**:
```typescript
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Format as "Jan 15, 2025"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
```

**Tests** (manual):
- Current time → "just now"
- 30 mins ago → "30m ago"
- 5 hours ago → "5h ago"
- 3 days ago → "3d ago"
- 10 days ago → "Jan 15, 2025"

---

## Route Architecture

### New Route: /compose

**File**: `src/app/routes/compose.tsx`

**Purpose**: Dedicated page for tweet composition

**Route Type**: Authenticated only (redirect to /login if not authenticated)

**Loader**:
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  // Check session cookie for authentication
  const cookie = request.headers.get('Cookie');

  // Verify session by hitting /api/auth/session or check cookie directly
  // If not authenticated, redirect to /login

  return json({ authenticated: true });
}
```

**Action** (form submission handler):
```typescript
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const content = formData.get('content') as string;

  // Client-side validation already done, but double-check
  if (!content || content.trim().length === 0 || content.length > 141) {
    return json(
      { error: 'Tweet must be 1-141 characters' },
      { status: 400 }
    );
  }

  try {
    // POST to backend API with session cookie
    const response = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/tweets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return json(error, { status: response.status });
    }

    const data = await response.json();
    const tweet = data.tweet;

    // Redirect to user's profile to see the new tweet
    // Get username from session (will need session helper)
    return redirect(`/${username}`); // Or redirect to /home if global feed exists
  } catch (error) {
    return json(
      { error: 'Failed to post tweet' },
      { status: 500 }
    );
  }
}
```

**Component**:
```typescript
export default function Compose() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation isAuthenticated={true} username={username} />
      <div className="py-12 px-4">
        <TweetForm />
      </div>
    </div>
  );
}
```

**Considerations**:
- Need to get username from session for Navigation and redirect
- Could create session helper: `getSessionUser(request)` utility
- Alternative: Get user from /api/auth/session endpoint

---

### Updated Route: /$username

**File**: `src/app/routes/$username.tsx` (already exists)

**Purpose**: Display user profile with tweets

**Current Functionality**: Fetches profile, displays ProfileView component

**Required Changes**:
1. Update loader to also fetch tweets
2. Pass tweets data to page component
3. Update ProfileView to accept and display tweets

**Updated Loader**:
```typescript
export async function loader({ params }: LoaderFunctionArgs) {
  const username = params.username;

  if (!username) {
    throw new Response('Not Found', { status: 404 });
  }

  try {
    // Fetch profile (existing)
    const profileResponse = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/profiles/${username}`
    );

    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        return json({ profile: null, tweets: [], error: 'Profile not found' }, { status: 404 });
      }
      throw new Error('Failed to fetch profile');
    }

    const profileData = await profileResponse.json();
    const profile = profileData.profile;

    // Fetch tweets (NEW)
    const tweetsResponse = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/tweets/user/${profile.userId}`
    );

    let tweets: Tweet[] = [];
    if (tweetsResponse.ok) {
      const tweetsData = await tweetsResponse.json();
      tweets = tweetsData.tweets || [];
    }

    return json({ profile, tweets, error: null });
  } catch (error) {
    return json(
      { profile: null, tweets: [], error: 'Failed to load profile' },
      { status: 500 }
    );
  }
}
```

**Updated Component**:
```typescript
export default function ProfilePage() {
  const { profile, tweets, error } = useLoaderData<typeof loader>();

  if (error || !profile) {
    // Existing error handling...
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <ProfileView profile={profile} />
      <TweetList tweets={tweets} username={profile.username} />
    </div>
  );
}
```

**Option B**: Update ProfileView to accept tweets prop
```typescript
// ProfileView component signature
interface ProfileViewProps {
  profile: ProfileData;
  tweets?: Tweet[]; // Optional tweets array
}

// Inside ProfileView.tsx
export default function ProfileView({ profile, tweets }: ProfileViewProps) {
  return (
    <>
      <Card className="max-w-2xl mx-auto">
        {/* Existing profile display */}
      </Card>

      {tweets && <TweetList tweets={tweets} username={profile.username} />}
    </>
  );
}
```

**Recommendation**: Option B (pass tweets to ProfileView) keeps all profile-related rendering in one component.

---

### Updated Component: Navigation

**File**: `src/app/components/Navigation.tsx` (already exists)

**Required Changes**: Add "Compose" button for authenticated users

**Updated Layout**:
```tsx
<div className="flex md:order-2 gap-2">
  {isAuthenticated && username ? (
    <>
      <Button as={Link} to="/compose" color="blue" size="sm">
        Compose
      </Button>
      <Button as={Link} to={`/${username}`} color="light" size="sm">
        My Profile
      </Button>
      <Button as="a" href="/api/auth/logout" color="light" size="sm">
        Logout
      </Button>
    </>
  ) : (
    <>
      <Button as={Link} to="/login" color="light" size="sm">
        Log In
      </Button>
      <Button as={Link} to="/register" size="sm">
        Sign Up
      </Button>
    </>
  )}
</div>
```

**Change Summary**: Add `<Button as={Link} to="/compose">Compose</Button>` before "My Profile" button.

---

## Data Flow

### Tweet Composition Flow

```
1. User navigates to /compose
2. Loader verifies authentication
   ├─ Authenticated → render TweetForm
   └─ Not authenticated → redirect to /login

3. User types in textarea
4. Character counter updates on every keystroke (React useState)
5. Submit button enables/disables based on validation

6. User clicks "Post Tweet"
7. Form submits to action handler
8. Action handler:
   ├─ Validates content
   ├─ POSTs to /api/tweets with session cookie
   ├─ Backend creates tweet in database
   └─ Returns tweet object

9. Action redirects to /{username}
10. Profile page loader fetches profile + tweets
11. TweetList renders with new tweet at top
```

### Tweet Viewing Flow

```
1. User navigates to /{username}
2. Loader fetches:
   ├─ Profile data from /api/profiles/{username}
   └─ Tweets data from /api/tweets/user/{userId}

3. Loader returns { profile, tweets }
4. Component receives data via useLoaderData()
5. ProfileView renders profile info
6. TweetList renders tweets:
   ├─ If tweets.length === 0 → show empty message
   └─ If tweets.length > 0 → map to TweetItem components

7. Each TweetItem displays:
   ├─ Username and display name
   ├─ Tweet content (with line breaks preserved)
   └─ Relative timestamp (formatRelativeTime utility)
```

---

## Session Management

**Current State** (from Feature 001):
- Backend uses express-session with PostgreSQL store
- Session cookies are httpOnly, secure (production), sameSite=strict
- Session contains userId
- /api/auth/login sets session cookie
- /api/auth/logout destroys session

**Frontend Needs**:
1. Check if user is authenticated (for /compose route protection)
2. Get current user's username (for Navigation and redirects)

**Solution Options**:

**Option A**: Create /api/auth/session endpoint
```typescript
// Backend: src/api/routes/auth.ts
router.get('/session', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ authenticated: false });
  }

  // Fetch user data from database
  const user = await getUserById(req.session.userId);

  res.json({
    authenticated: true,
    userId: user.id,
    username: user.username
  });
});
```

**Option B**: Add user context to Remix root loader
```typescript
// src/app/root.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const response = await fetch(
    `http://localhost:${process.env.PORT || 3000}/api/auth/session`,
    { headers: { Cookie: request.headers.get('Cookie') || '' } }
  );

  if (!response.ok) {
    return json({ user: null });
  }

  const data = await response.json();
  return json({ user: data });
}

// Access in any route via useRouteLoaderData()
```

**Recommendation**: Option B (root loader) provides user context globally without repeated API calls.

---

## Implementation Phases

### Phase 1: Utilities and Types (30 minutes)

**Tasks**:
- [ ] Create `src/app/utils/formatTimestamp.ts` with `formatRelativeTime()` function
- [ ] Add comprehensive JSDoc comments to utility function
- [ ] Manual test with various date inputs

**Files**:
- `src/app/utils/formatTimestamp.ts` (NEW)

**Validation**: Can format timestamps correctly for all time ranges

---

### Phase 2: TweetItem Component (45 minutes)

**Tasks**:
- [ ] Create `src/app/components/TweetItem.tsx`
- [ ] Implement component with Flowbite Card and Avatar
- [ ] Add semantic HTML (article, time with datetime attribute)
- [ ] Import and use `formatRelativeTime()` utility
- [ ] Apply Tailwind styling for hover effects and spacing
- [ ] Add TypeScript interface for props
- [ ] Test with mock tweet data

**Files**:
- `src/app/components/TweetItem.tsx` (NEW)

**Validation**: Component renders correctly with mock data, timestamps format properly

---

### Phase 3: TweetList Component (30 minutes)

**Tasks**:
- [ ] Create `src/app/components/TweetList.tsx`
- [ ] Implement empty state logic with conditional rendering
- [ ] Map tweets array to TweetItem components
- [ ] Add proper keys (tweet.id) for React list rendering
- [ ] Apply responsive spacing with Tailwind
- [ ] Add TypeScript interface for props
- [ ] Test with empty array and array with mock tweets

**Files**:
- `src/app/components/TweetList.tsx` (NEW)

**Validation**: Shows empty message when no tweets, renders list when tweets present

---

### Phase 4: Update Profile Route for Tweets (45 minutes)

**Tasks**:
- [ ] Update `src/app/routes/$username.tsx` loader to fetch tweets
- [ ] Update ProfileView component to accept tweets prop
- [ ] Pass tweets to TweetList component in ProfileView
- [ ] Handle errors gracefully (tweets fetch can fail without breaking profile display)
- [ ] Test with users who have tweets and users with no tweets

**Files**:
- `src/app/routes/$username.tsx` (UPDATED)
- `src/app/components/ProfileView.tsx` (UPDATED)

**Validation**: Profile pages display tweets, empty state shows for users with no tweets

---

### Phase 5: TweetForm Component (1 hour)

**Tasks**:
- [ ] Create `src/app/components/TweetForm.tsx`
- [ ] Implement controlled textarea with useState
- [ ] Add character counter with color-coded states
- [ ] Implement button disable logic (empty, >141 chars, submitting)
- [ ] Use Remix Form component for progressive enhancement
- [ ] Add useActionData for error display
- [ ] Add useNavigation for loading state
- [ ] Apply Flowbite components (Textarea, Button, Alert)
- [ ] Test all validation states

**Files**:
- `src/app/components/TweetForm.tsx` (NEW)

**Validation**:
- Counter updates in real-time
- Colors change at 121 and 142 chars
- Button disables correctly
- Form submits without page reload (Remix enhancement)

---

### Phase 6: Compose Route (1 hour)

**Tasks**:
- [ ] Create `src/app/routes/compose.tsx`
- [ ] Implement loader with authentication check
- [ ] Implement action handler for form submission
- [ ] POST to /api/tweets with proper headers and session cookie
- [ ] Handle success and redirect to profile
- [ ] Handle errors and display with Alert
- [ ] Add Navigation component to page
- [ ] Test full flow: navigate to /compose → type tweet → submit → see on profile

**Files**:
- `src/app/routes/compose.tsx` (NEW)

**Validation**:
- Unauthenticated users redirect to /login
- Tweet posts successfully
- Redirects to profile after posting
- New tweet appears at top of list

---

### Phase 7: Navigation Update (15 minutes)

**Tasks**:
- [ ] Update `src/app/components/Navigation.tsx`
- [ ] Add "Compose" button for authenticated users
- [ ] Position between brand and "My Profile" button
- [ ] Use Flowbite Button with Link component
- [ ] Test navigation flow

**Files**:
- `src/app/components/Navigation.tsx` (UPDATED)

**Validation**: Compose button appears for authenticated users, navigates to /compose

---

### Phase 8: Session Context (Optional, 45 minutes)

**Tasks**:
- [ ] Add /api/auth/session endpoint to backend (if not exists)
- [ ] Update `src/app/root.tsx` with root loader for user context
- [ ] Use `useRouteLoaderData()` in compose route and navigation
- [ ] Simplify authentication checks across components

**Files**:
- `src/api/routes/auth.ts` (UPDATED) - add GET /session endpoint
- `src/app/root.tsx` (UPDATED) - add root loader
- `src/app/routes/compose.tsx` (UPDATED) - use root loader data
- `src/app/components/Navigation.tsx` (UPDATED) - use root loader data

**Validation**: User context available globally, no repeated session checks

---

### Phase 9: Polish and Accessibility (1 hour)

**Tasks**:
- [ ] Add ARIA labels to form fields (aria-label, aria-describedby)
- [ ] Ensure keyboard navigation works (Tab order, Enter to submit)
- [ ] Add focus styles to interactive elements (focus:ring-2)
- [ ] Test mobile responsive design (textarea sizing, button tap targets)
- [ ] Verify color contrast (WCAG AA compliance)
- [ ] Add loading spinners during form submission
- [ ] Test with screen reader (macOS VoiceOver or NVDA)
- [ ] Add empty state illustrations/icons (optional)

**Files**:
- All component files (accessibility improvements)

**Validation**: Meets WCAG 2.1 Level AA, keyboard accessible, mobile responsive

---

### Phase 10: Testing and Validation (1 hour)

**Tasks**:
- [ ] Complete manual testing checklist from frontend-spec.md
- [ ] Test all user flows:
  - [ ] Compose tweet with valid content
  - [ ] Attempt to submit empty tweet (should fail)
  - [ ] Attempt to submit 142+ char tweet (button disabled)
  - [ ] View own profile with tweets
  - [ ] View own profile with no tweets (empty message)
  - [ ] View another user's profile as authenticated
  - [ ] View profile as anonymous (no session)
- [ ] Test error scenarios:
  - [ ] Network error during submission
  - [ ] Session expired (401 error)
  - [ ] Invalid content (backend validation)
- [ ] Verify timestamps display correctly
- [ ] Verify line breaks preserved in tweet content
- [ ] Test on mobile viewport (responsive design)

**Validation**: All acceptance criteria from frontend-spec.md met

---

## Testing Strategy

### Manual Testing Checklist

**Tweet Composition**:
- [ ] Navigate to /compose as authenticated user
- [ ] Character counter shows "0 / 141" initially
- [ ] Type 50 characters → counter updates to "50 / 141" (gray)
- [ ] Type 125 characters → counter shows "125 / 141" (yellow)
- [ ] Type 145 characters → counter shows "145 / 141" (red), button disabled
- [ ] Delete to 100 characters → counter returns to gray, button enabled
- [ ] Submit valid tweet → redirects to profile
- [ ] New tweet appears at top of profile feed
- [ ] Navigate to /compose as anonymous → redirects to /login

**Tweet Viewing**:
- [ ] View profile with tweets → all tweets visible, newest first
- [ ] View profile with no tweets → empty message displays
- [ ] Anonymous user views profile → tweets visible
- [ ] Timestamps show relative time ("5h ago" for 5-hour-old tweet)
- [ ] Tweet from 10 days ago shows "Jan 15, 2025" format
- [ ] Tweet content preserves line breaks (multi-line tweet)
- [ ] Long tweet content wraps correctly (no horizontal overflow)

**Edge Cases**:
- [ ] Tweet with only whitespace → validation fails
- [ ] Tweet with exactly 141 characters → accepted
- [ ] Tweet with emojis → counted correctly (may be 2 chars each)
- [ ] Very long username → doesn't break layout
- [ ] Multiple tweets with same timestamp → display in consistent order

**Mobile Responsive**:
- [ ] Textarea expands on mobile (not too small)
- [ ] Character counter visible on mobile
- [ ] Buttons have 44x44px tap targets
- [ ] Navigation collapses appropriately
- [ ] Tweet content readable on small screens

**Accessibility**:
- [ ] Tab through form fields in logical order
- [ ] Enter key submits form from textarea
- [ ] Focus indicators visible on all interactive elements
- [ ] Screen reader announces form labels and errors
- [ ] Error messages have role="alert" or aria-live
- [ ] Character counter changes announced to screen readers

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Character counter lag on slow devices | Low | Use React.memo if needed, counter calculation is simple |
| Session management complexity | Medium | Implement root loader for global user context |
| Redirect after post fails | Medium | Add error handling, keep form data on failure |
| Tweet formatting issues (line breaks) | Low | Use `whitespace-pre-wrap` CSS, test with multi-line tweets |
| Mobile textarea too small | Low | Set `rows={4}` minimum, allow expansion |
| Timestamp calculation off | Low | Thorough testing of `formatRelativeTime()` function |
| Empty state unclear | Low | Use friendly, personalized messages |
| Accessibility gaps | Medium | Follow WCAG 2.1 checklist, test with screen readers |

---

## Success Criteria

Frontend implementation is complete when:

- [ ] All 3 components created (TweetForm, TweetList, TweetItem)
- [ ] /compose route exists and requires authentication
- [ ] /$username route displays tweets below profile
- [ ] Navigation includes "Compose" button for authenticated users
- [ ] Character counter works with color changes (gray/yellow/red)
- [ ] Submit button disables correctly (empty, >141, submitting)
- [ ] Tweets display in reverse chronological order
- [ ] Relative timestamps format correctly
- [ ] Empty states show appropriate messages
- [ ] All manual testing checklist items pass
- [ ] Mobile responsive design verified
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Screen reader accessible (ARIA labels)
- [ ] No TypeScript errors
- [ ] No console errors or warnings
- [ ] README.md updated with feature completion

---

## Estimated Timeline

| Phase | Time | Cumulative |
|-------|------|------------|
| Phase 1: Utilities | 30 min | 30 min |
| Phase 2: TweetItem | 45 min | 1h 15m |
| Phase 3: TweetList | 30 min | 1h 45m |
| Phase 4: Profile Route Update | 45 min | 2h 30m |
| Phase 5: TweetForm | 1h | 3h 30m |
| Phase 6: Compose Route | 1h | 4h 30m |
| Phase 7: Navigation Update | 15 min | 4h 45m |
| Phase 8: Session Context (Optional) | 45 min | 5h 30m |
| Phase 9: Polish & Accessibility | 1h | 6h 30m |
| Phase 10: Testing | 1h | 7h 30m |

**Total Estimated Time**: 7-8 hours (with session context and polish)
**MVP Timeline** (skip Phase 8): 6-7 hours

---

## Dependencies and Prerequisites

**Completed**:
- ✅ Feature 001: User registration, authentication, profiles
- ✅ Feature 002 Backend: Tweets table, API endpoints, service layer
- ✅ Remix and Express setup
- ✅ Flowbite React and Tailwind CSS configured
- ✅ Navigation component exists
- ✅ ProfileView component exists

**Required**:
- TypeScript 5.x
- React 18.3+
- Remix 2.16+
- Flowbite React 0.10+
- Tailwind CSS 3.4+
- Backend APIs running (POST /api/tweets, GET /api/tweets/user/:userId)

**Optional Enhancements** (Future):
- Automated UI testing (Playwright/Cypress)
- Optimistic UI updates (show tweet before server confirms)
- Tweet drafts (localStorage)
- Infinite scroll pagination
- Real-time updates (WebSockets)
- Tweet editing/deletion
- Media attachments
- Rich text formatting

---

## Notes

- This plan focuses exclusively on frontend implementation
- Backend APIs are complete and tested (12 tests passing)
- No new backend work required
- Follows established patterns from Feature 001 components
- Uses existing design system (Flowbite + Tailwind)
- After completion, Feature 003 (likes) can add LikeButton to TweetItem
- All new code must pass TypeScript strict mode compilation
- Mobile-first responsive design required
- WCAG 2.1 Level AA accessibility compliance
