# Tasks: Like Feature

**Feature**: 003-users-can-like-tweets
**Input**: Design documents from `/specs/003-users-can-like-tweets/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-endpoints.md

**Tests**: Per [Tweeter Constitution v1.0.0](../../.specify/memory/constitution.md) Principle III, tests are MANDATORY and MUST be written BEFORE implementation code (TDD).

**Organization**: Tasks are grouped by phase to enable systematic implementation with TDD checkpoints.

## Format: `[ID] [P?] [Phase] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Phase]**: Which phase this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Setup (Minimal - Extends 001 + 002)

**Purpose**: Database migration and type definitions for likes

**Status**: ⏳ PENDING

- [ ] T001 [P] Create PostgreSQL migration 004_create_likes.sql in src/db/migrations/ (likes table with FK to users and tweets, UNIQUE constraint, indexes)
- [ ] T002 [P] Update TypeScript types in src/types/index.ts (add Like interface, LikeData interface, LikeInput type export)
- [ ] T003 [P] Create LikeSchema in src/schemas/like.schema.ts (tweetId: UUID validation)
- [ ] T004 Update src/schemas/index.ts to re-export LikeSchema
- [ ] T005 Create migration script scripts/migrate-004.ts (runs 004_create_likes.sql)
- [ ] T006 Run database migration (npm run migrate or npx tsx scripts/migrate-004.ts)
- [ ] T007 Verify migration success (check likes table exists, indexes created, FK constraints work, UNIQUE constraint enforced)

**Checkpoint**: Foundation ready - TDD can now begin

---

## Phase 2: Tests for Backend (TDD Red Phase) ⚠️ CRITICAL

**Purpose**: Write ALL tests BEFORE writing any implementation code

**⚠️ CRITICAL**: These tests MUST be written, run, and FAIL before any implementation code is written.

### Contract Tests (API Layer)

- [ ] T008 [P] Write contract test for POST /api/tweets/:tweetId/like in tests/contract/likes.contract.test.ts (test: 201 success, 401 unauthorized, 404 tweet not found, idempotent duplicate like)
- [ ] T009 [P] Write contract test for DELETE /api/tweets/:tweetId/like in tests/contract/likes.contract.test.ts (test: 204 success, 401 unauthorized, idempotent unlike non-existent)
- [ ] T010 [P] Write contract test for GET /api/tweets/:tweetId/likes in tests/contract/likes.contract.test.ts (test: 200 with count and userLiked, 404 tweet not found, anonymous access allowed)

### Integration Tests (Full Flows)

- [ ] T011 [P] Write integration test for like → unlike flow in tests/integration/like-flow.test.ts (register → post tweet → like → verify count → unlike → verify count)
- [ ] T012 [P] Write integration test for multiple users liking same tweet in tests/integration/like-flow.test.ts (user A likes → user B likes → verify count is 2)
- [ ] T013 [P] Write integration test for anonymous viewing in tests/integration/like-flow.test.ts (like as authenticated → view as anonymous → verify count visible but userLiked false)

### Unit Tests (Service Layer)

- [ ] T014 [P] Write unit test for createLike in tests/unit/like.service.test.ts (test: creates like, returns like with all fields, idempotent on duplicate)
- [ ] T015 [P] Write unit test for deleteLike in tests/unit/like.service.test.ts (test: deletes like, silent on non-existent)
- [ ] T016 [P] Write unit test for getLikeCount in tests/unit/like.service.test.ts (test: returns accurate count, returns 0 for no likes)
- [ ] T017 [P] Write unit test for checkUserLiked in tests/unit/like.service.test.ts (test: returns true when liked, false when not liked)
- [ ] T018 [P] Write unit test for getLikesByTweetIds in tests/unit/like.service.test.ts (test: returns batch data, includes tweets with 0 likes)

### TDD Checkpoint

- [ ] T019 **RUN ALL TESTS AND VERIFY THEY FAIL** (Red phase - proves tests are valid before implementation)

**Checkpoint**: All tests written and failing - ready for implementation

---

## Phase 3: Backend Implementation (TDD Green Phase)

**Purpose**: Implement code to make tests pass

**Type Safety Chain (Constitution IV)**: All tasks must maintain Zod → TypeScript → PostgreSQL synchronization

### Service Layer (Pure Functions)

- [ ] T020 [P] Implement createLike function in src/services/like.service.ts (pure function: userId + tweetId → Like, ON CONFLICT DO NOTHING for idempotency)
- [ ] T021 [P] Implement deleteLike function in src/services/like.service.ts (pure function: userId + tweetId → void, silent delete)
- [ ] T022 [P] Implement getLikeCount function in src/services/like.service.ts (pure function: tweetId → number, COUNT(*) query)
- [ ] T023 [P] Implement checkUserLiked function in src/services/like.service.ts (pure function: userId + tweetId → boolean, EXISTS query)
- [ ] T024 [P] Implement getLikesByTweetIds function in src/services/like.service.ts (pure function: tweetIds[] + userId? → LikeData[], batch query with IN clause)

### API Routes (Express Endpoints)

- [ ] T025 Create src/api/routes/likes.ts file OR extend src/api/routes/tweets.ts (decision: extend tweets.ts for nested resource paths)
- [ ] T026 Implement POST /api/tweets/:tweetId/like endpoint in src/api/routes/tweets.ts (requireAuth, call createLike, return 201)
- [ ] T027 Implement DELETE /api/tweets/:tweetId/like endpoint in src/api/routes/tweets.ts (requireAuth, call deleteLike, return 204)
- [ ] T028 Implement GET /api/tweets/:tweetId/likes endpoint in src/api/routes/tweets.ts (public, call getLikeCount + checkUserLiked, return 200)
- [ ] T029 Add error handling for all endpoints (400 validation errors, 401 unauthorized, 404 not found, 500 server errors)
- [ ] T030 Add tweet existence validation (check tweet exists before allowing like/unlike/view)

**Note**: Routes are added to existing tweets.ts file, so no route registration needed

### TDD Checkpoint

- [ ] T031 **RUN ALL BACKEND TESTS AND VERIFY THEY PASS** (Green phase - contract tests + integration tests + unit tests)
- [ ] T032 Refactor backend code if needed while keeping tests passing (DRY, clear function names)

**Checkpoint**: Backend API fully functional - users can like/unlike tweets via API

---

## Phase 4: Frontend Component (TDD for UI)

**Purpose**: Create LikeButton component with optimistic UI updates

### Component Implementation

- [ ] T033 Create LikeButton.tsx component in src/app/components/ (props: tweetId, initialCount, initialLiked, isAuthenticated)
- [ ] T034 Implement state management in LikeButton (useState for liked, count, loading)
- [ ] T035 Implement optimistic UI update logic (update state immediately on click)
- [ ] T036 Implement API call to POST/DELETE /api/tweets/:id/like (fetch with credentials)
- [ ] T037 Implement error rollback logic (revert state if API call fails)
- [ ] T038 Implement loading state (disable button, show spinner or opacity)
- [ ] T039 Add heart icons (outline for unliked, filled for liked) - use Heroicons or SVG
- [ ] T040 Add like count display (format: "X like" singular, "X likes" plural)
- [ ] T041 Add disabled state for unauthenticated users (button disabled, tooltip "Log in to like tweets")
- [ ] T042 Add error toast notifications (network error, authentication error)

### Accessibility

- [ ] T043 Add ARIA attributes (aria-label, aria-pressed for toggle state)
- [ ] T044 Ensure keyboard accessibility (native button element with Enter/Space support)
- [ ] T045 Add focus styles (visible focus indicator for keyboard navigation)
- [ ] T046 Ensure minimum 44x44px tap target (mobile-friendly)
- [ ] T047 Verify color contrast (WCAG AA compliant for gray/red colors)

### Integration with Tweet Components

- [ ] T048 Update TweetItem.tsx to include LikeButton component (pass tweetId, likeCount, userLiked props)
- [ ] T049 Update tweet loaders to fetch like data (use getLikesByTweetIds for batch efficiency)
- [ ] T050 Update profile route loader to include like data for tweets
- [ ] T051 Handle missing like data gracefully (default to count=0, userLiked=false)

**Checkpoint**: Like button appears on all tweets with correct state

---

## Phase 5: Integration & Manual Testing

**Purpose**: Verify everything works end-to-end

### Manual Testing Checklist

- [ ] T052 Test like button click (authenticated user) → count increments, icon fills
- [ ] T053 Test unlike button click (authenticated user) → count decrements, icon outlines
- [ ] T054 Test rapid toggle (click multiple times) → final state persists correctly
- [ ] T055 Test page refresh after liking → like persists (userLiked true, count correct)
- [ ] T056 Test anonymous user viewing liked tweet → count visible, button disabled
- [ ] T057 Test network error → optimistic update rolls back, error message shown
- [ ] T058 Test authentication error (expired session) → rollback, redirect to login
- [ ] T059 Test keyboard navigation (Tab to button, Enter/Space to activate)
- [ ] T060 Test multiple users liking same tweet → each sees correct state
- [ ] T061 Test deleted tweet → like button disabled or removed

### Performance Testing

- [ ] T062 Verify like operation completes in < 500ms (SC-001)
- [ ] T063 Verify unlike operation completes in < 500ms (SC-002)
- [ ] T064 Verify batch query loads 50 tweets with like data in < 2 seconds
- [ ] T065 Test 100 concurrent like requests (SC-006) → no errors, all persist correctly

**Checkpoint**: All functionality working end-to-end

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and edge case handling

### Error Handling & Edge Cases

- [ ] T066 [P] Add user-friendly error messages for all failure scenarios
- [ ] T067 [P] Handle race conditions (rapid like/unlike) → database UNIQUE constraint prevents duplicates
- [ ] T068 [P] Handle tweet deletion while user is viewing → disable button, show message
- [ ] T069 [P] Handle session expiration during like operation → rollback, prompt re-login
- [ ] T070 Add retry logic for transient network errors (optional)

### UI/UX Polish

- [ ] T071 [P] Add hover states for like button (text-red-400 on hover)
- [ ] T072 [P] Add transition animation for color change (optional, not in MVP scope)
- [ ] T073 [P] Ensure like count never shows negative numbers (client-side validation)
- [ ] T074 [P] Format large like counts (e.g., "1.2K likes" for 1234) - optional future enhancement

### Documentation

- [ ] T075 [P] Add JSDoc comments to like service functions
- [ ] T076 [P] Add PropTypes or TypeScript interface docs for LikeButton
- [ ] T077 [P] Document optimistic UI pattern in code comments

---

## Phase 7: Validation & Deployment Prep

**Purpose**: Final checks before deployment

### Test Suite Validation

- [ ] T078 Run full test suite (npm test) → verify all tests pass (38+ tests expected)
- [ ] T079 Verify all 001-users-can-register tests still pass (14 tests - regression check)
- [ ] T080 Verify all 002-users-can-post-tweets tests still pass (12 tests - regression check)
- [ ] T081 Verify all 003-users-can-like-tweets tests pass (12+ tests - new feature)
- [ ] T082 Run performance benchmarks (like/unlike < 500ms)
- [ ] T083 Run load test (100 concurrent requests)

### Constitution Compliance

- [ ] T084 Verify Principle I: All service functions are pure (no side effects beyond DB)
- [ ] T085 Verify Principle II: API contracts documented before implementation ✅
- [ ] T086 Verify Principle III: Tests written first (TDD workflow followed) ✅
- [ ] T087 Verify Principle IV: Type safety chain complete (Zod → TS → PostgreSQL) ✅
- [ ] T088 Verify Principle V: Authentication enforced, parameterized queries used ✅
- [ ] T089 Verify Principle VI: No premature optimization, simple MVP implementation ✅

### Code Quality

- [ ] T090 [P] Run TypeScript type check (npm run typecheck) → no errors
- [ ] T091 [P] Code review: Check for DRY violations
- [ ] T092 [P] Code review: Check for clear function/variable names
- [ ] T093 [P] Code review: Check for missing error handling
- [ ] T094 [P] Remove console.logs and debug code

### Final Validation

- [ ] T095 Run quickstart.md validation checklist (all items checked)
- [ ] T096 Create IMPLEMENTATION_COMPLETE.md document summarizing feature
- [ ] T097 Update README.md with like feature description (optional)
- [ ] T098 Commit all changes with descriptive message: "feat: implement like feature (003)"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Tests)**: Depends on Phase 1 (needs types and schemas for test imports)
- **Phase 3 (Backend)**: Depends on Phase 2 (TDD: tests must be written first)
- **Phase 4 (Frontend)**: Depends on Phase 3 (needs working API endpoints)
- **Phase 5 (Integration)**: Depends on Phase 4 (needs complete frontend)
- **Phase 6 (Polish)**: Depends on Phase 5 (needs working feature)
- **Phase 7 (Validation)**: Depends on Phase 6 (final checks)

### Critical TDD Checkpoints

**⚠️ MANDATORY STOPS**:
1. After T019: Tests MUST fail before proceeding to implementation
2. After T031: Tests MUST pass before proceeding to frontend
3. After T078: All tests MUST pass before considering feature complete

**Violation of TDD = Constitutional violation (Principle III)**

---

### Parallel Opportunities

**Phase 1** (all can run in parallel):
- T001, T002, T003 (different files)

**Phase 2** (all test writing can run in parallel):
- T008, T009, T010 (contract tests - same file but different describe blocks)
- T011, T012, T013 (integration tests - same file but different tests)
- T014, T015, T016, T017, T018 (unit tests - same file but different tests)

**Phase 3** (services and routes can be partially parallel):
- T020, T021, T022, T023, T024 (service functions - different functions in same file)
- After services: T026, T027, T028 (route handlers - different routes)

**Phase 6** (most polish tasks can run in parallel):
- T066, T067, T068, T069 (error handling)
- T071, T072, T073, T074 (UI polish)
- T075, T076, T077 (documentation)

**Phase 7** (validation tasks mostly parallel):
- T090, T091, T092, T093, T094 (code quality checks)

---

## Implementation Strategy

### MVP First (Core Like/Unlike Only)

1. Complete Phase 1: Setup (database ready)
2. Complete Phase 2: Write tests (TDD Red)
3. Complete Phase 3: Implement backend (TDD Green)
4. **STOP and VALIDATE**: Test like/unlike via curl/Postman
5. Complete Phase 4: Frontend component
6. **STOP and VALIDATE**: Test in browser
7. Complete Phase 7: Validation and deploy

**Estimated Time**: 3-4 hours

---

### Full Feature Delivery (With Polish)

1. Complete Phases 1-3 → Backend complete
2. Complete Phase 4 → Frontend complete
3. Complete Phase 5 → Integration validated
4. Complete Phase 6 → Polish complete
5. Complete Phase 7 → Feature complete and validated

**Estimated Time**: 4-5 hours (including polish)

---

### Parallel Team Strategy

With 2 developers:

1. **Developer A**: Phase 1 (Setup) → Phase 2 (Write all tests)
2. Once Phase 2 complete:
   - **Developer A**: Phase 3 (Backend implementation)
   - **Developer B**: Start preparing Phase 4 (component structure, icons)
3. Once Phase 3 complete:
   - **Developer A**: Phase 5 (Integration testing)
   - **Developer B**: Phase 4 (Frontend implementation)
4. Once Phase 4 complete:
   - **Both**: Phase 6 (Polish) + Phase 7 (Validation)

**Estimated Time**: 2.5-3 hours (with 2 developers)

---

## Notes

- **[P] tasks** = different files or independent functions, can run in parallel
- **TDD is NON-NEGOTIABLE** per Constitution III - tests MUST be written first
- Commit after each phase or logical group
- Stop at checkpoints to validate independently
- All existing tests from 001/002 must continue passing (regression prevention)
- Optimistic UI updates are critical for good UX (don't skip)
- Idempotency is critical for reliability (duplicate likes handled gracefully)

---

## Task Count Summary

- **Total Tasks**: 98 tasks
- **Phase 1 (Setup)**: 7 tasks (database and types)
- **Phase 2 (Tests - TDD Red)**: 12 tasks (contract + integration + unit tests)
- **Phase 3 (Backend - TDD Green)**: 13 tasks (services + API routes)
- **Phase 4 (Frontend)**: 19 tasks (component + accessibility + integration)
- **Phase 5 (Integration Testing)**: 14 tasks (manual + performance testing)
- **Phase 6 (Polish)**: 12 tasks (error handling + UI polish + docs)
- **Phase 7 (Validation)**: 21 tasks (test suite + constitution + code quality)

**Estimated Time**: 3-4 hours for MVP, 4-5 hours with polish (per quickstart.md)
**Expected Test Count**: 38+ tests (26 from 001/002 + 12+ new)

---

## Risk Mitigation

**Risks & Mitigations**:

1. **Race conditions (rapid like/unlike)**:
   - Mitigation: Database UNIQUE constraint + idempotent endpoints
   - Test: T054 (rapid toggle test)

2. **Optimistic UI error handling**:
   - Mitigation: Rollback logic + clear error messages
   - Test: T057 (network error test)

3. **Performance with high like counts**:
   - Mitigation: Database indexes + batch queries
   - Test: T064, T065 (performance tests)

4. **N+1 query problem (tweet lists)**:
   - Mitigation: getLikesByTweetIds batch function
   - Test: T064 (batch query performance)

---

**Tasks Status**: ✅ COMPLETE

Ready for implementation with `/speckit.implement`!
