# Feature Specification: User Registration and Profiles

**Feature Branch**: `001-users-can-register`
**Created**: 2025-10-08
**Status**: Draft
**Input**: User description: "Users can register with username and password, then create a profile with display name, bio (max 141 characters), and avatar image uploaded from their device. Profiles are public and anyone can view them."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Registration (Priority: P1)

New users can create an account to access the platform.

**Why this priority**: Registration is the entry point to the entire application. Without it, no other features are accessible. This is the foundational user journey.

**Independent Test**: Can be fully tested by attempting to register with valid credentials, then verifying the account exists and the user is authenticated.

**Acceptance Scenarios**:

1. **Given** a visitor on the registration page, **When** they enter a unique username and valid password, **Then** their account is created and they are automatically logged in
2. **Given** a visitor on the registration page, **When** they enter a username that already exists, **Then** they see an error message indicating the username is taken
3. **Given** a visitor on the registration page, **When** they enter a password shorter than 8 characters, **Then** they see an error message requiring a stronger password
4. **Given** a visitor on the registration page, **When** they submit the form with missing fields, **Then** they see validation errors for each required field

---

### User Story 2 - Profile Creation (Priority: P1)

Authenticated users can create their public profile with personalized information and avatar.

**Why this priority**: Profiles are core to the user identity on Tweeter. Without a profile, users cannot meaningfully participate (future tweets will need profile association).

**Independent Test**: Can be fully tested by logging in as a newly registered user, completing the profile form with all fields including avatar upload, and verifying the profile is saved and displayed correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated user without a profile, **When** they fill in display name, bio (under 141 chars), and upload an avatar image, **Then** their profile is created and saved
2. **Given** an authenticated user creating a profile, **When** they enter a bio exceeding 141 characters, **Then** they see a character count warning and cannot submit until it's under the limit
3. **Given** an authenticated user creating a profile, **When** they upload an image file (JPG/PNG/GIF), **Then** the image is uploaded to cloud storage and associated with their profile
4. **Given** an authenticated user creating a profile, **When** they try to upload a non-image file or file over 5MB, **Then** they see an error message about file format or size restrictions

---

### User Story 3 - View Own Profile (Priority: P2)

Authenticated users can view their own profile to verify their information is correct.

**Why this priority**: Users need to confirm their profile looks as expected. This provides immediate feedback after profile creation and supports future profile editing.

**Independent Test**: Can be fully tested by navigating to the authenticated user's profile URL and verifying all profile fields (display name, bio, avatar) are displayed correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated user with a completed profile, **When** they navigate to their profile page, **Then** they see their display name, bio, and avatar image
2. **Given** an authenticated user with a profile, **When** they view their profile, **Then** the avatar image loads from cloud storage and displays properly
3. **Given** an authenticated user without a profile, **When** they navigate to their profile page, **Then** they see a prompt to create their profile

---

### User Story 4 - View Public Profiles (Priority: P2)

Anyone (authenticated users and anonymous visitors) can view any user's public profile.

**Why this priority**: Public profiles enable discovery and social interaction. This validates the "public by default" design decision and enables future features like viewing tweet authors.

**Independent Test**: Can be fully tested by navigating to a user's profile URL (both as an authenticated user and as an anonymous visitor) and verifying the profile information is visible to both.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they navigate to another user's profile URL, **Then** they see that user's display name, bio, and avatar
2. **Given** an anonymous visitor (not logged in), **When** they navigate to any user's profile URL, **Then** they see that user's public profile information
3. **Given** any visitor, **When** they navigate to a profile URL for a non-existent user, **Then** they see a "Profile not found" message

---

### User Story 5 - User Login (Priority: P3)

Returning users can log back into their accounts.

**Why this priority**: Login is essential for returning users but lower priority than registration since new users start with registration. This completes the authentication cycle.

**Independent Test**: Can be fully tested by logging out a registered user, then attempting to log back in with correct credentials and verifying session is established.

**Acceptance Scenarios**:

1. **Given** a registered user on the login page, **When** they enter their correct username and password, **Then** they are logged in and redirected to their profile
2. **Given** a registered user on the login page, **When** they enter an incorrect password, **Then** they see an error message and remain on the login page
3. **Given** a registered user on the login page, **When** they enter a username that doesn't exist, **Then** they see an error message indicating invalid credentials
4. **Given** a logged-in user, **When** they close their browser and return later, **Then** they remain logged in (persistent session for 30 days)

---

### Edge Cases

- What happens when a user tries to register with special characters or very long usernames?
  - Usernames limited to alphanumeric + underscore/hyphen, 3-30 characters
- How does the system handle concurrent avatar uploads?
  - Upload queue ensures sequential processing, user sees progress indicator
- What happens if avatar upload to Cloudinary fails?
  - User sees error message, can retry upload, profile saved without avatar (can add later)
- What happens when a user's session expires?
  - User redirected to login page with message indicating session expired
- What if a user submits a bio with exactly 141 characters?
  - Accepted as valid (141 is inclusive limit)
- What happens if someone tries to view a deleted user's profile?
  - Same as non-existent user: "Profile not found" message

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to register with a unique username and password
- **FR-002**: System MUST enforce username uniqueness across all users
- **FR-003**: System MUST require passwords to be at least 8 characters long
- **FR-004**: System MUST hash passwords using argon2 before storing (never store plaintext passwords)
- **FR-005**: System MUST automatically authenticate users after successful registration
- **FR-006**: Users MUST be able to create a profile with display name, bio, and avatar image
- **FR-007**: System MUST enforce a maximum of 141 characters for bio text
- **FR-008**: System MUST validate all user inputs on both frontend (for UX) and backend (for security)
- **FR-009**: System MUST upload avatar images to Cloudinary cloud storage
- **FR-010**: System MUST support common image formats for avatars (JPG, PNG, GIF, WebP)
- **FR-011**: System MUST limit avatar file size to 5MB maximum
- **FR-012**: System MUST make all user profiles publicly accessible (no privacy settings)
- **FR-013**: System MUST display profile information to both authenticated and anonymous users
- **FR-014**: Users MUST be able to log in with their username and password
- **FR-015**: System MUST maintain user sessions for 30 days (persistent login)
- **FR-016**: System MUST provide clear error messages for validation failures
- **FR-017**: System MUST sanitize all text inputs to prevent injection attacks
- **FR-018**: Usernames MUST be 3-30 characters, alphanumeric plus underscore/hyphen only
- **FR-019**: System MUST provide a character counter for bio input (real-time feedback)
- **FR-020**: System MUST generate unique identifiers for users using uuidv7

### Key Entities

- **User Account**: Represents authentication credentials (username, hashed password, unique ID). Used for login and account management.
- **User Profile**: Represents public user information (display name, bio, avatar URL). Linked to User Account. Public by default.
- **Avatar Image**: User-uploaded profile photo stored in Cloudinary. Returns public URL for display.
- **Session**: Represents authenticated user state. Persists for 30 days to keep users logged in.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete registration and profile creation in under 3 minutes (from landing page to completed profile)
- **SC-002**: 95% of avatar uploads succeed on first attempt (measured over 100 uploads)
- **SC-003**: Profile pages load in under 2 seconds for both authenticated and anonymous users
- **SC-004**: Zero plaintext passwords stored in database (100% compliance with argon2 hashing)
- **SC-005**: Bio character counter updates in real-time (within 100ms of user input)
- **SC-006**: Public profiles accessible without authentication (100% of profile URLs work for anonymous visitors)
- **SC-007**: Form validation provides immediate feedback (errors display within 500ms of blur event)
- **SC-008**: Session persistence works correctly (90% of returning users remain logged in after 7 days)

## Assumptions

**Documented assumptions made to fill gaps in the feature description:**

1. **Email not required**: Registration uses username-only (no email verification for MVP)
2. **Session duration**: 30-day persistent sessions assumed as standard web app behavior
3. **Avatar file limits**: 5MB max file size and common web formats (JPG/PNG/GIF/WebP) assumed as industry standard
4. **Username format**: Alphanumeric + underscore/hyphen, 3-30 characters assumed as typical username constraints
5. **Password strength**: Minimum 8 characters assumed as baseline security (no complexity requirements for MVP)
6. **Avatar optional**: Users can create profile without avatar (can add later or use default placeholder)
7. **Display name vs. username**: Display name can differ from username (username for login, display name for public profile)
8. **Profile immutability**: Profile editing NOT included in this feature (future `/speckit.modify` task)
9. **Logout functionality**: Logout endpoint assumed but not explicitly specified (required for session management)
10. **Password reset**: NOT included in MVP (future enhancement)
11. **Profile deletion**: NOT included in MVP (future enhancement)
12. **Avatar cropping/editing**: NOT included in MVP (users upload pre-prepared images)
13. **Concurrent session limit**: No limit on concurrent sessions (users can be logged in on multiple devices)
14. **Case sensitivity**: Usernames are case-insensitive for uniqueness (e.g., "Alice" and "alice" are the same user)

## Dependencies

- **Cloudinary account**: Requires Cloudinary API credentials configured for avatar uploads
- **Database**: PostgreSQL database via Neon must be provisioned and accessible
- **External libraries**: argon2, uuidv7, Zod validation libraries
- **No authentication provider**: No dependency on OAuth or third-party auth (username/password only)

## Constraints

- **141-character limit**: Bio text strictly limited to 141 characters (Tweeter's defining constraint)
- **Public profiles only**: No privacy controls or private profiles in MVP
- **No email**: Registration without email verification (simplifies MVP)
- **No social login**: No "Sign in with Google/Twitter/etc." in MVP
- **Single avatar only**: One avatar per profile (no avatar history or multiple images)

## Out of Scope

The following features are explicitly NOT included in this feature:

- Profile editing (update display name, bio, or avatar after creation)
- Password reset or password change functionality
- Email verification or email-based account recovery
- Social login (OAuth with Google, Twitter, etc.)
- Private profiles or privacy settings
- Profile deletion or account deactivation
- Avatar cropping or image editing tools
- Multiple profile photos or photo galleries
- Bio formatting (bold, italic, links, etc.) - plain text only
- Username changes after registration
- Profile analytics or view counts
- Follow/follower relationships (future feature)
- Direct messaging or notifications (future features)
