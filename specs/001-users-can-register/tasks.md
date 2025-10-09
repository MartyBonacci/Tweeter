# Tasks: User Registration and Profiles

**Feature**: 001-users-can-register
**Input**: Design documents from `/specs/001-users-can-register/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-endpoints.md

**Tests**: Per [Tweeter Constitution v1.0.0](../.specify/memory/constitution.md) Principle III, tests are MANDATORY and MUST be written BEFORE implementation code (TDD).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Node.js project with TypeScript configuration (tsconfig.json with strict mode, ES2022 target)
- [ ] T002 Install core dependencies: @remix-run/react, @remix-run/node, express, zod, postgres, argon2, uuidv7
- [ ] T003 [P] Install dev dependencies: typescript, vitest, supertest, @types/express, tsx
- [ ] T004 [P] Install UI dependencies: tailwindcss, flowbite, flowbite-react
- [ ] T005 [P] Configure environment variables in .env (DATABASE_URL, SESSION_SECRET, CLOUDINARY_*)
- [ ] T006 [P] Setup Tailwind CSS configuration with Flowbite plugin
- [ ] T007 Create directory structure: src/schemas/, src/services/, src/api/routes/, src/app/, tests/contract/, tests/integration/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Create PostgreSQL connection service in src/services/db.service.ts (postgres package with camelCase mapping)
- [ ] T009 Create database migrations directory src/db/migrations/
- [ ] T010 [P] Create migration 001_create_users.sql (users table: id UUID, username VARCHAR(30), password_hash TEXT, created_at, updated_at)
- [ ] T011 [P] Create migration 002_create_profiles.sql (profiles table: id UUID, user_id UUID FK, display_name VARCHAR(100), bio VARCHAR(141), avatar_url TEXT, session table)
- [ ] T012 Run migrations against Neon PostgreSQL database
- [ ] T013 Setup Express app in src/api/server.ts with session middleware (express-session, connect-pg-simple)
- [ ] T014 [P] Create auth middleware in src/api/middleware/auth.middleware.ts (requireAuth function)
- [ ] T015 [P] Create validation middleware in src/api/middleware/validate.middleware.ts (Zod schema wrapper)
- [ ] T016 [P] Create error handling middleware in src/api/middleware/error.middleware.ts
- [ ] T017 Setup Remix app in src/app/root.tsx with programmatic routes configuration
- [ ] T018 Create TypeScript types file src/types/index.ts (User, Profile, Session interfaces)
- [ ] T019 Configure Vitest for testing (vitest.config.ts with test environment)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration (Priority: P1) 🎯 MVP

**Goal**: New users can create accounts with username/password and be automatically logged in

**Independent Test**: Attempt registration with valid credentials, verify account exists and user is authenticated

### Tests for User Story 1 (MANDATORY per Constitution III) ⚠️

**CONSTITUTION REQUIREMENT: Tests MUST be written FIRST (Red-Green-Refactor)**

**⚠️ CRITICAL CHECKPOINT**: These tests MUST be written, run, and FAIL before any implementation code is written.

- [ ] T020 [P] [US1] Write contract test for POST /api/auth/register in tests/contract/auth.contract.test.ts (test: 201 success, 409 duplicate username, 400 short password, 400 missing fields)
- [ ] T021 [P] [US1] Write integration test for registration flow in tests/integration/registration-flow.test.ts (register → verify session → verify user in DB)
- [ ] T022 [US1] **RUN TESTS AND VERIFY THEY FAIL** (proves tests are valid before implementation)

### Implementation for User Story 1

**Type Safety Chain (Constitution IV)**: All tasks below must maintain Zod → TypeScript → PostgreSQL synchronization

- [ ] T023 [P] [US1] Define RegisterSchema in src/schemas/auth.schema.ts (username: 3-30 chars alphanumeric + _ -, password: min 8 chars)
- [ ] T024 [P] [US1] Define LoginSchema in src/schemas/auth.schema.ts (username, password)
- [ ] T025 [US1] Export TypeScript types from schemas: RegisterInput, LoginInput (z.infer<typeof RegisterSchema>)
- [ ] T026 [P] [US1] Implement hashPassword function in src/services/auth.service.ts (argon2.hash, pure function)
- [ ] T027 [P] [US1] Implement verifyPassword function in src/services/auth.service.ts (argon2.verify, pure function)
- [ ] T028 [P] [US1] Implement generateUserId function in src/services/auth.service.ts (uuidv7, pure function)
- [ ] T029 [US1] Implement POST /api/auth/register endpoint in src/api/routes/auth.ts (validate with RegisterSchema, hash password, insert user, create session, return 201)
- [ ] T030 [US1] Add duplicate username error handling (catch PostgreSQL error code 23505, return 409)
- [ ] T031 [US1] Add Zod validation error handling (return 400 with formatted errors)
- [ ] T032 [US1] Register auth routes in src/api/routes/index.ts
- [ ] T033 [US1] Create RegisterForm component in src/app/components/RegisterForm.tsx (Tailwind + Flowbite, real-time validation)
- [ ] T034 [US1] Create registration page in src/app/pages/register.tsx (route: /register)
- [ ] T035 [US1] Add programmatic route for /register in src/app/routes.ts
- [ ] T036 [US1] **RUN TESTS AND VERIFY THEY PASS** (Green phase of Red-Green-Refactor)
- [ ] T037 [US1] Refactor if needed while keeping tests passing

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Profile Creation (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can create their public profile with display name, bio (141 chars), and avatar image

**Independent Test**: Log in as new user, complete profile form with avatar upload, verify profile is saved and displayed

### Tests for User Story 2 (MANDATORY per Constitution III) ⚠️

**CONSTITUTION REQUIREMENT: Tests MUST be written FIRST (Red-Green-Refactor)**

- [ ] T038 [P] [US2] Write contract test for POST /api/profiles in tests/contract/profiles.contract.test.ts (test: 201 success, 401 unauthorized, 400 bio > 141 chars, 409 duplicate profile)
- [ ] T039 [P] [US2] Write contract test for POST /api/profiles/avatar in tests/contract/profiles.contract.test.ts (test: 200 success, 401 unauthorized, 400 file too large, 400 invalid format)
- [ ] T040 [P] [US2] Write integration test for profile creation flow in tests/integration/profile-creation-flow.test.ts (register → create profile → upload avatar → verify all saved)
- [ ] T041 [US2] **RUN TESTS AND VERIFY THEY FAIL** (Red phase)

### Implementation for User Story 2

**Type Safety Chain (Constitution IV)**: Maintain Zod → TypeScript → PostgreSQL synchronization

- [ ] T042 [P] [US2] Define ProfileSchema in src/schemas/profile.schema.ts (displayName: 1-100 chars, bio: max 141 chars, avatarUrl: nullable URL)
- [ ] T043 [P] [US2] Define AvatarUploadSchema in src/schemas/profile.schema.ts (file: image mimetype, max 5MB)
- [ ] T044 [US2] Export TypeScript type ProfileInput (z.infer<typeof ProfileSchema>)
- [ ] T045 [US2] Configure Cloudinary client in src/services/upload.service.ts (use env vars for credentials)
- [ ] T046 [P] [US2] Implement uploadAvatar function in src/services/upload.service.ts (stream to Cloudinary, 400x400 transformation, return URL, pure function)
- [ ] T047 [P] [US2] Implement createProfile function in src/services/profile.service.ts (insert profile, return profile data, pure function)
- [ ] T048 [P] [US2] Implement getProfileByUserId function in src/services/profile.service.ts (query profiles table, pure function)
- [ ] T049 [US2] Implement POST /api/profiles endpoint in src/api/routes/profiles.ts (requireAuth, validate ProfileSchema, insert profile, return 201)
- [ ] T050 [US2] Add duplicate profile error handling (catch 23505, return 409)
- [ ] T051 [US2] Implement POST /api/profiles/avatar endpoint in src/api/routes/profiles.ts (requireAuth, multer middleware, validate file, upload to Cloudinary, update profile, return 200)
- [ ] T052 [US2] Add file validation errors (return 400 for non-image or > 5MB)
- [ ] T053 [US2] Register profile routes in src/api/routes/index.ts
- [ ] T054 [US2] Create ProfileForm component in src/app/components/ProfileForm.tsx (Tailwind + Flowbite, 141-char counter with real-time update)
- [ ] T055 [US2] Create AvatarUpload component in src/app/components/AvatarUpload.tsx (file input, preview, progress indicator)
- [ ] T056 [US2] Create profile creation page in src/app/pages/profile-create.tsx (route: /profile/create)
- [ ] T057 [US2] Add programmatic route for /profile/create in src/app/routes.ts
- [ ] T058 [US2] **RUN TESTS AND VERIFY THEY PASS** (Green phase)
- [ ] T059 [US2] Refactor if needed while keeping tests passing

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - View Own Profile (Priority: P2)

**Goal**: Authenticated users can view their own profile to verify information is correct

**Independent Test**: Navigate to authenticated user's profile URL and verify all fields display correctly

### Tests for User Story 3 (MANDATORY per Constitution III) ⚠️

**CONSTITUTION REQUIREMENT: Tests MUST be written FIRST (Red-Green-Refactor)**

- [ ] T060 [P] [US3] Write contract test for GET /api/profiles/:username in tests/contract/profiles.contract.test.ts (test: 200 success with all fields, 404 not found)
- [ ] T061 [P] [US3] Write integration test for view own profile in tests/integration/profile-view.test.ts (register → create profile → view own profile → verify data matches)
- [ ] T062 [US3] **RUN TESTS AND VERIFY THEY FAIL** (Red phase)

### Implementation for User Story 3

**Type Safety Chain (Constitution IV)**: Maintain Zod → TypeScript → PostgreSQL synchronization

- [ ] T063 [US3] Implement getProfileByUsername function in src/services/profile.service.ts (JOIN users and profiles, case-insensitive username, pure function)
- [ ] T064 [US3] Implement GET /api/profiles/:username endpoint in src/api/routes/profiles.ts (query profile, return 200 or 404)
- [ ] T065 [US3] Create ProfileView component in src/app/components/ProfileView.tsx (display name, bio, avatar with Tailwind + Flowbite)
- [ ] T066 [US3] Create profile view page in src/app/pages/profile-view.tsx (route: /@:username, fetch profile data)
- [ ] T067 [US3] Add programmatic route for /@:username in src/app/routes.ts
- [ ] T068 [US3] Add "Profile not created" prompt when user has no profile (link to /profile/create)
- [ ] T069 [US3] **RUN TESTS AND VERIFY THEY PASS** (Green phase)
- [ ] T070 [US3] Refactor if needed while keeping tests passing

**Checkpoint**: User Stories 1, 2, and 3 should all work independently

---

## Phase 6: User Story 4 - View Public Profiles (Priority: P2)

**Goal**: Anyone (authenticated users and anonymous visitors) can view any user's public profile

**Independent Test**: Navigate to profile URL as both authenticated user and anonymous visitor, verify both can see profile

### Tests for User Story 4 (MANDATORY per Constitution III) ⚠️

**CONSTITUTION REQUIREMENT: Tests MUST be written FIRST (Red-Green-Refactor)**

- [ ] T071 [P] [US4] Write integration test for anonymous profile viewing in tests/integration/public-profile-view.test.ts (create profile → view without session → verify visible)
- [ ] T072 [P] [US4] Write integration test for authenticated viewing others' profiles in tests/integration/public-profile-view.test.ts (user A views user B's profile → verify visible)
- [ ] T073 [US4] **RUN TESTS AND VERIFY THEY FAIL** (Red phase)

### Implementation for User Story 4

- [ ] T074 [US4] Verify GET /api/profiles/:username does NOT require authentication (no requireAuth middleware)
- [ ] T075 [US4] Test profile view page works without session cookie (anonymous access)
- [ ] T076 [US4] Add navigation to view other users' profiles (e.g., from username links)
- [ ] T077 [US4] **RUN TESTS AND VERIFY THEY PASS** (Green phase)
- [ ] T078 [US4] Refactor if needed while keeping tests passing

**Checkpoint**: All public profile viewing should work for authenticated and anonymous users

---

## Phase 7: User Story 5 - User Login (Priority: P3)

**Goal**: Returning users can log back into their accounts with 30-day persistent sessions

**Independent Test**: Log out a user, log back in with correct credentials, verify session is established and persists

### Tests for User Story 5 (MANDATORY per Constitution III) ⚠️

**CONSTITUTION REQUIREMENT: Tests MUST be written FIRST (Red-Green-Refactor)**

- [ ] T079 [P] [US5] Write contract test for POST /api/auth/login in tests/contract/auth.contract.test.ts (test: 200 success, 401 wrong password, 401 nonexistent user)
- [ ] T080 [P] [US5] Write contract test for POST /api/auth/logout in tests/contract/auth.contract.test.ts (test: 200 success, session destroyed)
- [ ] T081 [P] [US5] Write integration test for login flow in tests/integration/login-flow.test.ts (register → logout → login → verify session → close browser → return → verify still logged in)
- [ ] T082 [US5] **RUN TESTS AND VERIFY THEY FAIL** (Red phase)

### Implementation for User Story 5

**Type Safety Chain (Constitution IV)**: Maintain Zod → TypeScript → PostgreSQL synchronization

- [ ] T083 [US5] Implement getUserByUsername function in src/services/auth.service.ts (case-insensitive query, pure function)
- [ ] T084 [US5] Implement POST /api/auth/login endpoint in src/api/routes/auth.ts (validate LoginSchema, query user, verify password, create session, return 200 or 401)
- [ ] T085 [US5] Implement POST /api/auth/logout endpoint in src/api/routes/auth.ts (destroy session, return 200)
- [ ] T086 [US5] Configure session cookie with 30-day maxAge (httpOnly, secure in production, sameSite: strict)
- [ ] T087 [US5] Create LoginForm component in src/app/components/LoginForm.tsx (Tailwind + Flowbite, real-time validation)
- [ ] T088 [US5] Create login page in src/app/pages/login.tsx (route: /login)
- [ ] T089 [US5] Add programmatic route for /login in src/app/routes.ts
- [ ] T090 [US5] Add logout button to navigation (calls POST /api/auth/logout)
- [ ] T091 [US5] **RUN TESTS AND VERIFY THEY PASS** (Green phase)
- [ ] T092 [US5] Refactor if needed while keeping tests passing

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T093 [P] Add session expiration redirect (middleware redirects to /login with "Session expired" message)
- [ ] T094 [P] Add user-friendly error messages for all validation failures
- [ ] T095 [P] Add loading states to all forms (disable buttons during submission)
- [ ] T096 [P] Add success notifications for profile creation and avatar upload
- [ ] T097 [P] Implement avatar placeholder for users without uploaded avatars
- [ ] T098 [P] Add navigation links between registration, login, and profile pages
- [ ] T099 Verify bio character counter updates within 100ms (performance requirement SC-005)
- [ ] T100 Verify profile page loads under 2 seconds (performance requirement SC-003)
- [ ] T101 Verify avatar upload success rate > 95% over 100 test uploads (SC-002)
- [ ] T102 Run full test suite and verify all tests pass
- [ ] T103 Verify constitution compliance (all 6 principles satisfied)
- [ ] T104 Run quickstart.md validation checklist
- [ ] T105 Code cleanup and refactoring (DRY, clear function names)
- [ ] T106 [P] Update README.md with setup instructions
- [ ] T107 [P] Document API endpoints in docs/api.md (or reference contracts/)
- [ ] T108 [P] Add comments to complex logic (password hashing, session config, Cloudinary upload)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1) → US2 (P1) → US3 (P2) → US4 (P2) → US5 (P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Requires US1 for authentication but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Requires US2 for profile data but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Requires US2 for profile data but independently testable
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Requires US1 for user accounts but independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD enforcement)
- Schemas before services (type safety chain)
- Services before endpoints (business logic isolation)
- API endpoints before frontend components (API-first)
- Core implementation before integration
- Tests MUST PASS before marking story complete
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Schemas within a story marked [P] can run in parallel
- Services within a story marked [P] can run in parallel
- Polish tasks marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Registration)
4. Complete Phase 4: User Story 2 (Profile Creation)
5. **STOP and VALIDATE**: Test US1 and US2 independently
6. Deploy/demo as MVP

### Full Feature Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP checkpoint
3. Add User Story 2 → Test independently → MVP ready for demo
4. Add User Story 3 → Test independently → Self-service complete
5. Add User Story 4 → Test independently → Public profiles ready
6. Add User Story 5 → Test independently → Full auth cycle complete
7. Complete Phase 8: Polish → Feature complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Registration) + User Story 5 (Login/Logout)
   - Developer B: User Story 2 (Profile Creation)
   - Developer C: User Story 3 (View Own Profile) + User Story 4 (View Public Profiles)
3. Stories complete and integrate independently
4. Team collaborates on Phase 8: Polish

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

---

## Task Count Summary

- **Total Tasks**: 108
- **Phase 1 (Setup)**: 7 tasks
- **Phase 2 (Foundational)**: 12 tasks
- **Phase 3 (User Story 1 - Registration)**: 18 tasks
- **Phase 4 (User Story 2 - Profile Creation)**: 22 tasks
- **Phase 5 (User Story 3 - View Own Profile)**: 11 tasks
- **Phase 6 (User Story 4 - View Public Profiles)**: 8 tasks
- **Phase 7 (User Story 5 - Login/Logout)**: 14 tasks
- **Phase 8 (Polish)**: 16 tasks

**Estimated Time**: 8-12 hours (per quickstart.md) for full implementation with TDD
