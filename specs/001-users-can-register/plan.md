# Implementation Plan: User Registration and Profiles

**Branch**: `001-users-can-register` | **Date**: 2025-10-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-users-can-register/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

**Primary Requirement**: Enable users to register with username/password authentication, create public profiles with display name, bio (141 char limit), and avatar images, with all profiles publicly viewable by anyone (authenticated or anonymous).

**Technical Approach**: Build API-first with Express REST endpoints backed by PostgreSQL (Neon), implementing authentication with argon2 password hashing and 30-day persistent sessions. Use Zod validation schemas as single source of truth for type safety chain (Zod → TypeScript → PostgreSQL). Upload avatars to Cloudinary for cloud storage. Frontend built with Remix using programmatic routes and Tailwind CSS + Flowbite components. Follow TDD with contract and integration tests written before implementation.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: Remix (React Router v7), Express 4.x, Zod 3.x, postgres (PostgreSQL client), argon2, uuidv7, cloudinary, Tailwind CSS, Flowbite
**Storage**: PostgreSQL 15+ via Neon (cloud-hosted), Cloudinary for avatar images
**Testing**: Vitest for unit/integration tests, Supertest for API contract tests
**Target Platform**: Web application (server-side rendering with Remix, Express API backend)
**Project Type**: Web application (full-stack: backend API + frontend UI)
**Performance Goals**: Profile page load < 2 seconds, avatar upload success rate > 95%, bio character counter update < 100ms, form validation feedback < 500ms
**Constraints**: Bio text limited to 141 characters (strict), avatar files ≤ 5MB, argon2 hashing mandatory (no plaintext passwords), public profiles only (no privacy controls)
**Scale/Scope**: MVP for single-user registration and profile creation (foundational feature for future tweet/like features), ~10-15 API endpoints, 5-8 frontend routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with [Tweeter Constitution v1.0.0](../.specify/memory/constitution.md):

### I. Functional Programming First
- [x] Business logic implemented as pure functions (no side effects in core logic)
  - Auth logic (password verification, session creation) will be pure functions
  - Profile operations (create, read) will be pure functions with DB calls isolated
- [x] State transformations use immutability (no mutations)
  - All data transformations use immutable patterns (map, filter, spread operators)
- [x] Classes used ONLY for framework integration, NOT business logic
  - Classes only for Remix route exports and Express middleware
  - Business logic in `src/services/` as pure functions
- [x] Side effects isolated to service layer boundaries
  - Database queries in service layer only
  - Cloudinary uploads in dedicated upload service
  - HTTP requests isolated from business logic

### II. API-First Architecture
- [x] API contracts defined before frontend work (endpoints, schemas, HTTP methods)
  - All endpoints specified in contracts/ before UI development
- [x] Backend routes testable independently of frontend
  - API tests use Supertest without Remix UI
- [x] Programmatic routes used (NOT file-based)
  - Remix routes defined programmatically, Express routes registered explicitly
- [x] REST principles followed (proper verbs, resource URLs, status codes)
  - POST /api/auth/register (201), POST /api/auth/login (200), GET /api/profiles/:username (200/404)

### III. Test-First Development (NON-NEGOTIABLE)
- [x] Tests written BEFORE implementation (Red-Green-Refactor)
  - Implementation only after tests fail
- [x] Contract tests planned for API endpoints
  - All API endpoints have contract tests (register, login, profiles, avatar upload)
- [x] Integration tests planned for user journeys
  - Full flows: registration → profile creation → view, login → view, anonymous view
- [x] All tests must pass before merge to main
  - Manual verification before PR merge (CI pipeline future enhancement)

### IV. Type Safety Chain
- [x] Zod schemas defined for all user inputs
  - RegisterSchema, LoginSchema, ProfileSchema, AvatarUploadSchema
- [x] TypeScript types derived from Zod (using `z.infer<typeof schema>`)
  - type RegisterInput = z.infer<typeof RegisterSchema>, etc.
- [x] PostgreSQL schema aligns with Zod/TypeScript definitions
  - users table (username VARCHAR, password_hash TEXT), profiles table (display_name, bio VARCHAR(141), avatar_url)
- [x] `postgres` package used for camelCase ↔ snake_case mapping
  - All DB queries use postgres package for automatic conversion
- [x] Changes to data models update all three layers atomically
  - Schema changes documented in data-model.md with migration steps

### V. Security for MVP
- [x] Passwords hashed with argon2 (if authentication involved)
  - argon2.hash() before storing, argon2.verify() for login, NEVER plaintext
- [x] All user inputs validated with Zod on frontend AND backend
  - Frontend: Form validation for UX, Backend: Request validation for security
- [x] Parameterized queries used (via `postgres` package) to prevent SQL injection
  - All queries use postgres template literals, no string concatenation
- [x] HTTPS enforced in production (if deployment planned)
  - Production requires HTTPS, development allows HTTP (localhost only)
- [x] Auth tokens stored securely (httpOnly cookies or secure storage)
  - Session tokens in httpOnly cookies with Secure flag and SameSite=strict

### VI. Simplicity & YAGNI
- [x] Only implements features explicitly required by spec
  - No email verification, password reset, profile editing, or OAuth (all out of scope)
- [x] No premature optimization (optimize after profiling)
  - Simple queries initially, indexing added based on metrics, no caching until proven necessary
- [x] Simple, readable code preferred over complex abstractions
  - Direct PostgreSQL queries (no ORM), straightforward validation, clear function names
- [x] Complexity justified in "Complexity Tracking" section if needed
  - No unjustified complexity currently

**Constitution Check Status: ✅ PASSED** (All gates satisfied, no violations)

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── schemas/              # Zod validation schemas (single source of truth)
│   ├── auth.schema.ts    # RegisterSchema, LoginSchema
│   ├── profile.schema.ts # ProfileSchema, AvatarUploadSchema
│   └── index.ts          # Re-export all schemas
├── services/             # Business logic (pure functions)
│   ├── auth.service.ts   # hashPassword, verifyPassword, createSession
│   ├── profile.service.ts# createProfile, getProfile, validateBio
│   ├── upload.service.ts # uploadToCloudinary, validateImageFile
│   └── db.service.ts     # PostgreSQL connection and helpers
├── api/                  # Express REST API routes
│   ├── routes/
│   │   ├── auth.ts       # POST /api/auth/register, /api/auth/login, /api/auth/logout
│   │   ├── profiles.ts   # GET /api/profiles/:username, POST /api/profiles
│   │   └── index.ts      # Route registration
│   ├── middleware/
│   │   ├── auth.middleware.ts  # Session validation
│   │   ├── validate.middleware.ts # Zod request validation
│   │   └── error.middleware.ts # Error handling
│   └── server.ts         # Express app setup
├── app/                  # Remix frontend
│   ├── routes.ts         # Programmatic route configuration
│   ├── root.tsx          # Root layout
│   ├── components/
│   │   ├── RegisterForm.tsx   # Registration form with Zod validation
│   │   ├── LoginForm.tsx      # Login form
│   │   ├── ProfileForm.tsx    # Profile creation form with character counter
│   │   ├── ProfileView.tsx    # Profile display component
│   │   └── AvatarUpload.tsx   # Avatar upload with progress
│   ├── pages/
│   │   ├── register.tsx  # Registration page (/register)
│   │   ├── login.tsx     # Login page (/login)
│   │   ├── profile-create.tsx # Profile creation (/profile/create)
│   │   └── profile-view.tsx   # Profile view (/@:username)
│   └── utils/
│       ├── session.ts    # Client-side session helpers
│       └── validators.ts # Client-side Zod validation wrappers
├── db/
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   └── 002_create_profiles.sql
│   └── schema.ts         # TypeScript types for DB tables
└── types/
    ├── index.ts          # Shared types derived from Zod
    └── session.ts        # Session types

tests/
├── contract/             # API contract tests (Supertest)
│   ├── auth.contract.test.ts
│   └── profiles.contract.test.ts
├── integration/          # End-to-end user flow tests
│   ├── registration-flow.test.ts
│   ├── login-flow.test.ts
│   └── profile-view.test.ts
└── unit/                 # Pure function tests (optional)
    ├── auth.service.test.ts
    └── profile.service.test.ts

public/                   # Static assets
├── avatars/              # Placeholder avatars (until Cloudinary upload)
└── styles/               # Tailwind CSS
```

**Structure Decision**: Web application structure chosen based on Remix + Express stack. Key design decisions:

1. **Schemas-first**: `src/schemas/` is the single source of truth for validation (aligns with Constitution IV)
2. **Services for logic**: Business logic isolated in pure functions at `src/services/` (Constitution I)
3. **API separation**: Express API at `src/api/`, Remix frontend at `src/app/` (Constitution II: API-first)
4. **Programmatic routes**: Remix routes defined in `app/routes.ts`, not file-based (Constitution requirement)
5. **Tests organized by type**: Contract, integration, unit tests separated (Constitution III: TDD)
6. **DB migrations**: SQL migrations for schema changes, maintaining type safety chain
7. **Shared types**: TypeScript types in `src/types/` derived from Zod schemas

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
