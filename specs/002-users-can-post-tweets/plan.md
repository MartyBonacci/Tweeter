# Implementation Plan: Tweet Posting

**Branch**: `002-users-can-post-tweets` | **Date**: 2025-10-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-users-can-post-tweets/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

**Primary Requirement**: Enable authenticated users to post tweets containing 1-141 characters of text, with each tweet displaying the author's username, content, and timestamp. All tweets are visible on the user's profile page in reverse chronological order, publicly accessible to authenticated and anonymous visitors.

**Technical Approach**: Extend existing API with new tweet endpoints following the established pattern from 001-users-can-register. Create tweets table with foreign key to users, implement Zod validation for character limits, add pure function services for tweet creation and retrieval, build REST API endpoints for posting and fetching tweets, and extend profile pages with tweet list component. Follow TDD with contract tests for API and integration tests for posting/viewing flows.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled) - already configured
**Primary Dependencies**: Existing stack from 001 (Remix, Express, Zod, postgres, uuidv7) - no new dependencies needed
**Storage**: PostgreSQL 15+ via Neon (existing database, new tweets table)
**Testing**: Vitest for unit/integration tests, Supertest for API contract tests (already configured)
**Target Platform**: Web application (server-side rendering with Remix, Express API backend) - same as 001
**Project Type**: Web application (full-stack: backend API + frontend UI) - extending existing structure
**Performance Goals**: Tweet posting < 1 second, profile page load with 100 tweets < 2 seconds, character counter update < 50ms, reverse chronological ordering maintained
**Constraints**: Tweet content 1-141 characters (strict), text-only (no media), public tweets only (no privacy controls), no editing/deletion in MVP
**Scale/Scope**: Extends 001-users-can-register, ~5-8 new API endpoints, 3-5 new frontend components, single new database table with foreign key relationship

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with [Tweeter Constitution v1.0.0](../../.specify/memory/constitution.md):

### I. Functional Programming First
- [x] Business logic implemented as pure functions (no side effects in core logic)
  - Tweet creation logic (createTweet, getTweetsByUserId) as pure functions
  - Tweet retrieval and sorting logic as pure functions
- [x] State transformations use immutability (no mutations)
  - All data transformations use immutable patterns (map, filter, spread)
- [x] Classes used ONLY for framework integration, NOT business logic
  - Classes only for Remix route exports and Express middleware (same as 001)
  - Business logic in src/services/tweet.service.ts as pure functions
- [x] Side effects isolated to service layer boundaries
  - Database queries in service layer only
  - HTTP requests isolated from business logic

### II. API-First Architecture
- [x] API contracts defined before frontend work (endpoints, schemas, HTTP methods)
  - All endpoints specified in contracts/api-endpoints.md before UI development
- [x] Backend routes testable independently of frontend
  - API tests use Supertest without Remix UI (same pattern as 001)
- [x] Programmatic routes used (NOT file-based)
  - Remix routes defined programmatically, Express routes registered explicitly (existing setup)
- [x] REST principles followed (proper verbs, resource URLs, status codes)
  - POST /api/tweets (201), GET /api/tweets/user/:userId (200), proper status codes for errors

### III. Test-First Development (NON-NEGOTIABLE)
- [x] Tests written BEFORE implementation (Red-Green-Refactor)
  - Implementation only after tests fail (strict TDD enforcement)
- [x] Contract tests planned for API endpoints
  - All API endpoints have contract tests (POST /api/tweets, GET /api/tweets/user/:userId)
- [x] Integration tests planned for user journeys
  - Full flows: login → post tweet → view on profile, anonymous view profile with tweets
- [x] All tests must pass before merge to main
  - Manual verification before PR merge (CI pipeline future enhancement)

### IV. Type Safety Chain
- [x] Zod schemas defined for all user inputs
  - TweetSchema for tweet content validation (1-141 chars, trimmed whitespace)
- [x] TypeScript types derived from Zod (using `z.infer<typeof schema>`)
  - type TweetInput = z.infer<typeof TweetSchema>
- [x] PostgreSQL schema aligns with Zod/TypeScript definitions
  - tweets table (id UUID, user_id UUID FK, content VARCHAR(141), created_at, updated_at)
- [x] `postgres` package used for camelCase ↔ snake_case mapping
  - All DB queries use postgres package for automatic conversion (already configured)
- [x] Changes to data models update all three layers atomically
  - Schema changes documented in data-model.md with migration steps

### V. Security for MVP
- [x] Passwords hashed with argon2 (if authentication involved)
  - Authentication already implemented in 001 (no changes needed)
- [x] All user inputs validated with Zod on frontend AND backend
  - Frontend: Form validation for UX, Backend: Request validation for security
- [x] Parameterized queries used (via `postgres` package) to prevent SQL injection
  - All queries use postgres template literals, no string concatenation (existing pattern)
- [x] HTTPS enforced in production (if deployment planned)
  - Production requires HTTPS, development allows HTTP (localhost only) - already configured
- [x] Auth tokens stored securely (httpOnly cookies or secure storage)
  - Session tokens in httpOnly cookies with Secure flag and SameSite=strict (from 001)

### VI. Simplicity & YAGNI
- [x] Only implements features explicitly required by spec
  - No tweet editing, deletion, media, rich text, hashtags, mentions (all out of scope)
- [x] No premature optimization (optimize after profiling)
  - Simple queries initially, no pagination (can add if >100 tweets causes performance issue)
- [x] Simple, readable code preferred over complex abstractions
  - Direct PostgreSQL queries (no ORM), straightforward validation, clear function names
- [x] Complexity justified in "Complexity Tracking" section if needed
  - No unjustified complexity currently

**Constitution Check Status: ✅ PASSED** (All gates satisfied, no violations)

## Project Structure

### Documentation (this feature)

```
specs/002-users-can-post-tweets/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (Zod → TypeScript → PostgreSQL)
├── quickstart.md        # Phase 1 output (step-by-step guide)
├── contracts/           # Phase 1 output (API endpoint specifications)
│   └── api-endpoints.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

Extends existing structure from 001-users-can-register:

```
src/
├── schemas/              # Zod validation schemas (single source of truth)
│   ├── auth.schema.ts    # [EXISTING] RegisterSchema, LoginSchema
│   ├── profile.schema.ts # [EXISTING] ProfileSchema, AvatarUploadSchema
│   ├── tweet.schema.ts   # [NEW] TweetSchema (1-141 chars, trimmed)
│   └── index.ts          # [UPDATED] Re-export all schemas including tweet
├── services/             # Business logic (pure functions)
│   ├── auth.service.ts   # [EXISTING] hashPassword, verifyPassword
│   ├── profile.service.ts# [EXISTING] createProfile, getProfile
│   ├── tweet.service.ts  # [NEW] createTweet, getTweetsByUserId
│   ├── upload.service.ts # [EXISTING] uploadToCloudinary
│   └── db.service.ts     # [EXISTING] PostgreSQL connection
├── api/                  # Express REST API routes
│   ├── routes/
│   │   ├── auth.ts       # [EXISTING] POST /register, /login, /logout
│   │   ├── profiles.ts   # [EXISTING] GET /profiles/:username, POST /profiles
│   │   ├── tweets.ts     # [NEW] POST /tweets, GET /tweets/user/:userId
│   │   └── index.ts      # [UPDATED] Register tweet routes
│   ├── middleware/
│   │   ├── auth.middleware.ts  # [EXISTING] requireAuth
│   │   ├── validate.middleware.ts # [EXISTING] Zod validation
│   │   └── error.middleware.ts # [EXISTING] Error handling
│   └── server.ts         # [EXISTING] Express app setup
├── app/                  # Remix frontend
│   ├── routes.ts         # [EXISTING] Programmatic route configuration
│   ├── root.tsx          # [EXISTING] Root layout
│   ├── components/
│   │   ├── RegisterForm.tsx   # [EXISTING] Registration form
│   │   ├── LoginForm.tsx      # [EXISTING] Login form
│   │   ├── ProfileForm.tsx    # [EXISTING] Profile creation
│   │   ├── ProfileView.tsx    # [UPDATED] Add tweet list display
│   │   ├── Navigation.tsx     # [EXISTING] Navigation bar
│   │   ├── TweetComposer.tsx  # [NEW] Tweet composition form with char counter
│   │   └── TweetList.tsx      # [NEW] Display tweets in reverse chronological order
│   ├── pages/
│   │   ├── register.tsx  # [EXISTING] Registration page
│   │   ├── login.tsx     # [EXISTING] Login page
│   │   ├── profile-create.tsx # [EXISTING] Profile creation
│   │   ├── profile-view.tsx   # [EXISTING] Profile view (/@:username)
│   │   └── compose.tsx   # [NEW] Tweet composition page (/compose)
│   └── utils/
│       ├── session.ts    # [EXISTING] Client-side session helpers
│       └── validators.ts # [EXISTING] Client-side Zod validation wrappers
├── db/
│   ├── migrations/
│   │   ├── 001_create_users.sql      # [EXISTING] Users table
│   │   ├── 002_create_profiles.sql   # [EXISTING] Profiles + session tables
│   │   └── 003_create_tweets.sql     # [NEW] Tweets table with FK to users
│   └── schema.ts         # [UPDATED] TypeScript types for tweets table
└── types/
    └── index.ts          # [UPDATED] Add Tweet interface

tests/
├── contract/             # API contract tests (Supertest)
│   ├── auth.contract.test.ts      # [EXISTING] Auth endpoint tests
│   ├── profiles.contract.test.ts  # [EXISTING] Profile endpoint tests
│   └── tweets.contract.test.ts    # [NEW] Tweet endpoint tests
├── integration/          # End-to-end user flow tests
│   ├── registration-flow.test.ts  # [EXISTING] Registration flow
│   ├── login-flow.test.ts         # [EXISTING] Login flow
│   ├── profile-view.test.ts       # [EXISTING] Profile viewing
│   └── tweet-posting-flow.test.ts # [NEW] Post tweet → view on profile
└── unit/                 # Pure function tests (optional)
    ├── auth.service.test.ts    # [EXISTING] Auth service tests
    ├── profile.service.test.ts # [EXISTING] Profile service tests
    └── tweet.service.test.ts   # [NEW] Tweet service tests
```

**Structure Decision**: Web application structure extends existing from 001. Key design decisions:

1. **Minimal new structure**: Reuses all existing patterns from 001-users-can-register
2. **Single new table**: tweets table with FK to users (one-to-many relationship)
3. **Service layer extension**: New tweet.service.ts follows same pure function pattern
4. **Component reuse**: ProfileView.tsx updated to include TweetList.tsx
5. **Route extension**: New /compose route for tweet posting, tweets displayed on existing /@username route
6. **Test organization**: New tweets.contract.test.ts and tweet-posting-flow.test.ts follow existing test patterns

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No violations - feature follows all constitutional principles without exceptions.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
