# Tasks: Tweet Posting

**Feature**: 002-users-can-post-tweets
**Input**: Design documents from `/specs/002-users-can-post-tweets/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-endpoints.md

**Tests**: Per [Tweeter Constitution v1.0.0](../../.specify/memory/constitution.md) Principle III, tests are MANDATORY and MUST be written BEFORE implementation code (TDD).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Minimal - Extends 001)

**Purpose**: No new setup needed - reuses all infrastructure from 001-users-can-register

**Status**: ✅ **ALREADY COMPLETE** from feature 001

- [x] Project structure exists (src/schemas, src/services, src/api, tests/)
- [x] TypeScript configuration exists
- [x] Vitest testing framework configured
- [x] Database connection service exists (src/services/db.service.ts)
- [x] Express app with middleware configured
- [x] Remix app with programmatic routes

**Checkpoint**: No setup work required - proceed directly to Phase 2

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and type definitions for tweets

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 [P] Create PostgreSQL migration 003_create_tweets.sql in src/db/migrations/ (tweets table with FK to users, indexes)
- [ ] T002 [P] Update TypeScript types in src/types/index.ts (add Tweet interface, TweetInput type export)
- [ ] T003 Run database migration (npm run migrate or manually with psql)
- [ ] T004 Verify migration success (check tweets table exists, indexes created, FK constraint works)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Post Tweet (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can compose and post tweets with 1-141 character text content

**Independent Test**: Log in, compose tweet, post it, verify it's saved in database with correct userId, content, timestamp

### Tests for User Story 1 (MANDATORY per Constitution III) ⚠️

**CONSTITUTION REQUIREMENT: Tests MUST be written FIRST (Red-Green-Refactor)**

**⚠️ CRITICAL CHECKPOINT**: These tests MUST be written, run, and FAIL before any implementation code is written.

- [ ] T005 [P] [US1] Write contract test for POST /api/tweets in tests/contract/tweets.contract.test.ts (test: 201 success, 400 empty, 400 >141 chars, 400 whitespace-only, 401 unauthorized)
- [ ] T006 [P] [US1] Write integration test for tweet posting flow in tests/integration/tweet-posting-flow.test.ts (register → login → post tweet → verify in DB)
- [ ] T007 [US1] **RUN TESTS AND VERIFY THEY FAIL** (proves tests are valid before implementation)

### Implementation for User Story 1

**Type Safety Chain (Constitution IV)**: All tasks below must maintain Zod → TypeScript → PostgreSQL synchronization

- [ ] T008 [US1] Define TweetSchema in src/schemas/tweet.schema.ts (content: string, trimmed, min 1, max 141 chars)
- [ ] T009 [US1] Export TweetInput type from TweetSchema (z.infer<typeof TweetSchema>)
- [ ] T010 [US1] Update src/schemas/index.ts to re-export TweetSchema
- [ ] T011 [P] [US1] Implement createTweet function in src/services/tweet.service.ts (pure function: userId + content → Tweet)
- [ ] T012 [P] [US1] Implement getTweetsByUserId function in src/services/tweet.service.ts (pure function: query tweets ORDER BY created_at DESC)
- [ ] T013 [US1] Create src/api/routes/tweets.ts file with router setup
- [ ] T014 [US1] Implement POST /api/tweets endpoint in src/api/routes/tweets.ts (requireAuth, validate(TweetSchema), call createTweet, return 201)
- [ ] T015 [US1] Add error handling for validation errors (400 Bad Request with formatted errors)
- [ ] T016 [US1] Register tweet routes in src/api/routes/index.ts (router.use('/tweets', tweetRoutes))
- [ ] T017 [US1] **RUN TESTS AND VERIFY THEY PASS** (Green phase of Red-Green-Refactor)
- [ ] T018 [US1] Refactor if needed while keeping tests passing

**Checkpoint**: At this point, User Story 1 backend is fully functional - users can post tweets via API

---

## Phase 4: User Story 2 - View Own Tweets on Profile (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can view all their own tweets on their profile page in reverse chronological order

**Independent Test**: Log in, post multiple tweets, navigate to profile, verify all tweets appear newest-first with correct display

### Tests for User Story 2 (MANDATORY per Constitution III) ⚠️

**CONSTITUTION REQUIREMENT: Tests MUST be written FIRST (Red-Green-Refactor)**

- [ ] T019 [P] [US2] Write contract test for GET /api/tweets/user/:userId in tests/contract/tweets.contract.test.ts (test: 200 with tweets array, correct order, empty array for no tweets)
- [ ] T020 [P] [US2] Write integration test for view own tweets in tests/integration/tweet-posting-flow.test.ts (post multiple → view profile → verify order)
- [ ] T021 [US2] **RUN TESTS AND VERIFY THEY FAIL** (Red phase)

### Implementation for User Story 2

**Type Safety Chain (Constitution IV)**: Maintain Zod → TypeScript → PostgreSQL synchronization

- [ ] T022 [US2] Implement GET /api/tweets/user/:userId endpoint in src/api/routes/tweets.ts (call getTweetsByUserId, return 200 with tweets array + count)
- [ ] T023 [US2] Add 404 error handling for non-existent users
- [ ] T024 [US2] Create TweetList.tsx component in src/app/components/ (displays array of tweets, handles empty state)
- [ ] T025 [US2] Create TweetItem.tsx component in src/app/components/ (displays single tweet: username, content, timestamp)
- [ ] T026 [US2] Update ProfileView.tsx component to include TweetList (fetch tweets via loader, pass to TweetList)
- [ ] T027 [US2] Update src/app/routes/$username.tsx loader to fetch tweets using getTweetsByUsername service function
- [ ] T028 [US2] Implement getTweetsByUsername function in src/services/tweet.service.ts (JOIN tweets with users, ORDER BY created_at DESC)
- [ ] T029 [US2] Add relative timestamp formatting utility in src/app/utils/ (< 24hrs: "X hours ago", < 7 days: "X days ago", else: "MMM DD, YYYY")
- [ ] T030 [US2] **RUN TESTS AND VERIFY THEY PASS** (Green phase)
- [ ] T031 [US2] Refactor if needed while keeping tests passing

**Checkpoint**: At this point, User Stories 1 AND 2 work independently - users can post and view their own tweets

---

## Phase 5: User Story 3 - View Others' Tweets on Profiles (Priority: P2)

**Goal**: Any user (authenticated or anonymous) can view all tweets on any user's public profile page

**Independent Test**: Navigate to another user's profile as both authenticated and anonymous visitor, verify tweets are visible

### Tests for User Story 3 (MANDATORY per Constitution III) ⚠️

**CONSTITUTION REQUIREMENT: Tests MUST be written FIRST (Red-Green-Refactor)**

- [ ] T032 [P] [US3] Write integration test for anonymous tweet viewing in tests/integration/tweet-posting-flow.test.ts (post tweets → view as anonymous → verify visible)
- [ ] T033 [P] [US3] Write integration test for authenticated viewing others' tweets in tests/integration/tweet-posting-flow.test.ts (user A views user B's profile → verify tweets visible)
- [ ] T034 [US3] **RUN TESTS AND VERIFY THEY FAIL** (Red phase)

### Implementation for User Story 3

- [ ] T035 [US3] Verify GET /api/tweets/user/:userId does NOT require authentication (no requireAuth middleware - already implemented in US2)
- [ ] T036 [US3] Verify profile view page works without session cookie (test anonymous access in browser)
- [ ] T037 [US3] Add empty state message for profiles with no tweets ("No tweets yet" or "This user hasn't posted any tweets")
- [ ] T038 [US3] **RUN TESTS AND VERIFY THEY PASS** (Green phase)
- [ ] T039 [US3] Refactor if needed while keeping tests passing

**Checkpoint**: All public profile viewing should work for authenticated and anonymous users

---

## Phase 6: User Story 4 - Real-Time Character Counter (Priority: P3)

**Goal**: When composing a tweet, users see a real-time character counter with color indicators (gray < 120, yellow 120-140, red > 141)

**Independent Test**: Type in tweet compose field, verify counter updates in < 50ms, verify colors change at thresholds, verify submit button disabled when > 141

### Tests for User Story 4 (MANDATORY per Constitution III) ⚠️

**CONSTITUTION REQUIREMENT: Tests MUST be written FIRST (Red-Green-Refactor)**

- [ ] T040 [P] [US4] Write unit test for character counting logic in tests/unit/tweet-composer.test.ts (test: counter updates, color thresholds, button disabled state)
- [ ] T041 [US4] **RUN TESTS AND VERIFY THEY FAIL** (Red phase)

### Implementation for User Story 4

- [ ] T042 [US4] Create TweetComposer.tsx component in src/app/components/ (Form with Textarea, character counter, submit button)
- [ ] T043 [US4] Add useState for character count (updates on onChange)
- [ ] T044 [US4] Implement character counter display (X / 141 format)
- [ ] T045 [US4] Implement color logic (gray 0-120, yellow 121-140, green 141, red >141)
- [ ] T046 [US4] Disable submit button when charCount === 0 || charCount > 141
- [ ] T047 [US4] Add loading state during submission (button shows "Posting..." and is disabled)
- [ ] T048 [US4] Create /compose route in src/app/routes/compose.tsx (uses TweetComposer component)
- [ ] T049 [US4] Add action handler for tweet posting (calls POST /api/tweets, redirects to profile on success)
- [ ] T050 [US4] Add "Compose Tweet" link/button to navigation (only visible when authenticated)
- [ ] T051 [US4] Update Navigation.tsx component to include compose link
- [ ] T052 [US4] **RUN TESTS AND VERIFY THEY PASS** (Green phase)
- [ ] T053 [US4] Refactor if needed while keeping tests passing

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T054 [P] Add tweet count to profile display ("X Tweets" badge or text)
- [ ] T055 [P] Add success notification after posting tweet ("Tweet posted successfully!")
- [ ] T056 [P] Add error handling for network failures (display user-friendly error messages)
- [ ] T057 [P] Add loading skeleton for tweet list while loading (instead of blank page)
- [ ] T058 [P] Implement optimistic UI update (tweet appears immediately, then confirmed by server)
- [ ] T059 Verify character counter updates within 50ms (performance requirement SC-002)
- [ ] T060 Verify profile page with 100 tweets loads under 2 seconds (performance requirement SC-003)
- [ ] T061 Verify tweet posting completes under 1 second (performance requirement SC-001)
- [ ] T062 Run full test suite and verify all tests pass (24+ tests expected)
- [ ] T063 Verify constitution compliance (all 6 principles satisfied)
- [ ] T064 Run quickstart.md validation checklist
- [ ] T065 Code cleanup and refactoring (DRY, clear function names)
- [ ] T066 [P] Add comments to complex logic (timestamp formatting, ordering logic)
- [ ] T067 [P] Update README.md with new features (tweet posting, viewing)
- [ ] T068 [P] Verify all tests from 001-users-can-register still pass (regression testing)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ✅ COMPLETE from 001 - no work needed
- **Foundational (Phase 2)**: No dependencies - can start immediately - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1) → US2 (P1) → US3 (P2) → US4 (P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories (backend only)
- **User Story 2 (P1)**: Can start after US1 (needs GET endpoint) - Adds frontend viewing
- **User Story 3 (P2)**: Can start after US2 (extends viewing to public) - Minimal new work
- **User Story 4 (P3)**: Can start after US1 (adds UX to posting) - Frontend enhancement only

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD enforcement)
- Schemas before services (type safety chain)
- Services before endpoints (business logic isolation)
- API endpoints before frontend components (API-first)
- Core implementation before integration
- Tests MUST PASS before marking story complete
- Story complete before moving to next priority

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel (T001-T002)
- Tests for each user story marked [P] can run in parallel
- Schemas and services within a story marked [P] can run in parallel
- Frontend components can be built in parallel once API is ready
- Polish tasks marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 2: Foundational (database schema)
2. Complete Phase 3: User Story 1 (post tweets backend)
3. Complete Phase 4: User Story 2 (view tweets on profile)
4. **STOP and VALIDATE**: Test posting and viewing independently
5. Deploy/demo as MVP

### Full Feature Delivery

1. Complete Foundational → Database ready
2. Add User Story 1 → Test independently → Backend complete
3. Add User Story 2 → Test independently → MVP ready for demo
4. Add User Story 3 → Test independently → Public viewing complete
5. Add User Story 4 → Test independently → Full UX complete
6. Complete Phase 7: Polish → Feature complete

### Parallel Team Strategy

With multiple developers:

1. Developer A completes Foundational (small task)
2. Once Foundational is done:
   - Developer A: User Story 1 (backend) + User Story 4 (UX enhancement)
   - Developer B: User Story 2 (frontend) + User Story 3 (public viewing)
3. Both collaborate on Phase 7: Polish
4. Stories complete and integrate independently

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **Verify tests fail before implementing** (Red phase of TDD)
- **Verify tests pass after implementing** (Green phase of TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **TDD is NON-NEGOTIABLE** per Constitution III - tests MUST be written first
- All existing tests from 001 must continue passing (regression prevention)

---

## Task Count Summary

- **Total Tasks**: 68 tasks
- **Phase 1 (Setup)**: 0 tasks (reuses 001 infrastructure)
- **Phase 2 (Foundational)**: 4 tasks (database schema)
- **Phase 3 (User Story 1 - Post Tweet)**: 14 tasks (backend posting)
- **Phase 4 (User Story 2 - View Own Tweets)**: 13 tasks (frontend viewing)
- **Phase 5 (User Story 3 - View Others' Tweets)**: 8 tasks (public viewing)
- **Phase 6 (User Story 4 - Character Counter)**: 14 tasks (UX enhancement)
- **Phase 7 (Polish)**: 15 tasks (polish and validation)

**Estimated Time**: 4-6 hours (per quickstart.md) for full implementation with TDD
**Expected Test Count**: 24+ tests (14 from 001 + ~10 new)
