<!--
  SYNC IMPACT REPORT
  Version: 0.0.0 → 1.0.0 (Initial Ratification)
  Date: 2025-10-08

  Changes:
  - NEW: Principle 1 - Functional Programming First
  - NEW: Principle 2 - API-First Architecture
  - NEW: Principle 3 - Test-First Development (NON-NEGOTIABLE)
  - NEW: Principle 4 - Type Safety Chain
  - NEW: Principle 5 - Security for MVP
  - NEW: Principle 6 - Simplicity & YAGNI
  - NEW: Technology Stack Requirements section
  - NEW: Development Workflow section

  Template Updates Required:
  - ✅ .specify/templates/plan-template.md (constitution gates added)
  - ✅ .specify/templates/spec-template.md (verified alignment)
  - ✅ .specify/templates/tasks-template.md (test-first checkpoints added)

  Follow-up TODOs: None
-->

# Tweeter Constitution

## Core Principles

### I. Functional Programming First

**Pure functions over classes; immutability over mutation; composition over inheritance.**

- All business logic MUST be implemented as pure functions (no side effects)
- State mutations MUST be avoided; prefer immutable data transformations
- Use function composition patterns to build complex behavior from simple functions
- Classes are permitted only for framework integration (e.g., Remix route exports, Express middleware) but MUST NOT contain business logic
- Side effects (database calls, API requests, file I/O) MUST be isolated at boundaries (service layer)

**Rationale**: Functional code is easier to test, reason about, and parallelize. Pure functions guarantee predictable behavior regardless of execution context.

### II. API-First Architecture

**Express REST endpoints designed and tested before UI implementation.**

- API contracts (request/response schemas, endpoints, HTTP methods) MUST be defined before frontend work begins
- Backend routes MUST be independently testable without frontend code
- API endpoints MUST follow REST principles (proper HTTP verbs, resource-oriented URLs, standard status codes)
- Programmatic routes MUST be used (NOT file-based routing) to maintain explicit control and type safety
- Frontend MUST consume backend APIs via defined contracts; no direct database access from client

**Rationale**: API-first design ensures clear separation of concerns, enables parallel frontend/backend development, and facilitates future client diversity (web, mobile, CLI).

### III. Test-First Development (NON-NEGOTIABLE)

**TDD mandatory: Tests written → Tests fail → Implementation → Tests pass → Refactor.**

- Tests MUST be written BEFORE implementation code (Red-Green-Refactor cycle)
- No feature is complete without passing tests
- Test categories MUST include:
  - **Contract tests**: Verify API endpoint schemas match Zod contracts
  - **Integration tests**: Verify end-to-end user journeys work correctly
  - **Unit tests**: Verify individual functions behave correctly (optional but recommended)
- All tests MUST pass before committing to main branch
- If a bug is found, a failing test MUST be written first, then the bug fixed to make the test pass

**Rationale**: TDD prevents regressions, ensures code correctness, and serves as living documentation. It is the single most important quality gate.

### IV. Type Safety Chain

**Zod schemas → TypeScript types → PostgreSQL schema must stay synchronized.**

- All user inputs (frontend forms, API requests) MUST be validated with Zod schemas
- Zod schemas MUST be the single source of truth for runtime validation
- TypeScript types MUST be derived from Zod schemas (using `z.infer<typeof schema>`) to ensure compile-time safety
- PostgreSQL schema (column types, constraints) MUST align with Zod/TypeScript definitions
- The `postgres` npm package MUST be used to handle camelCase (JavaScript) ↔ snake_case (PostgreSQL) mapping automatically
- Any change to data models MUST update all three layers (Zod, TypeScript, PostgreSQL) atomically

**Rationale**: The type safety chain prevents runtime errors, ensures data integrity, and provides confidence during refactoring. Breaking the chain creates vulnerabilities.

### V. Security for MVP

**Essential security measures: argon2 hashing, Zod validation, parameterized queries, HTTPS.**

- Passwords MUST be hashed using argon2 (NEVER store plaintext or use weak hashing like MD5/SHA1)
- All user inputs MUST be validated with Zod on both frontend (UX) and backend (security)
- Database queries MUST use parameterized statements (via `postgres` package) to prevent SQL injection
- HTTPS MUST be enforced in production environments (HTTP allowed only in local development)
- Authentication tokens MUST be stored securely (httpOnly cookies or secure storage)
- Avoid complex security features for MVP (OAuth, 2FA, rate limiting) unless explicitly required

**Rationale**: These measures provide baseline protection against common attacks (injection, credential theft) without over-engineering the MVP.

### VI. Simplicity & YAGNI

**Start simple; add complexity only when needed; clear code over clever code.**

- Implement only features explicitly required by specifications (You Aren't Gonna Need It)
- Avoid premature optimization; optimize only after profiling reveals bottlenecks
- Prefer simple, readable code over complex abstractions or clever tricks
- When choosing between two approaches, default to the simpler one unless complexity is justified
- Delete dead code immediately; do not comment out code "just in case"

**Rationale**: Simple code is easier to understand, modify, and debug. Complexity should be earned through demonstrated need, not assumed upfront.

## Technology Stack Requirements

**Tweeter MVP is built with a specific, non-negotiable technology stack.**

- **Framework**: Remix (React Router v7 framework mode) for full-stack React application
- **Routing**: Programmatic routes MUST be used (NOT file-based routes) for explicit type safety
- **Backend**: Express REST APIs for server-side logic and database communication
- **Language**: TypeScript with functional programming structure (see Principle I)
- **Validation**: Zod for runtime validation on frontend (form UX) and backend (security)
- **Database**: PostgreSQL via Neon (cloud-hosted PostgreSQL)
- **Storage**: Cloudinary for profile avatar image storage (no local file storage)
- **Identifiers**: uuidv7 MUST be used for all entity IDs (profiles, tweets, likes)
- **Password Hashing**: argon2 (via `argon2` npm package)
- **Styling**: Tailwind CSS + Flowbite component library
- **Database Helper**: `postgres` npm package for camelCase ↔ snake_case mapping

**Constraints**:
- No class-based components (functional components only)
- No OOP patterns in business logic (functional programming only)
- No ORMs that obscure SQL (use `postgres` package for direct queries)

**Rationale**: This stack is chosen for the Tweeter MVP and MUST NOT be changed without amending this constitution. Consistency enables efficient development and avoids decision paralysis.

## Development Workflow

**Spec-driven development is recommended; feature branches follow conventions; PRs require constitution compliance.**

### Recommended Workflow (Not Mandatory)

1. **Specification**: Use `/speckit.specify` to create business specification (what, why, who)
2. **Planning**: Use `/speckit.plan` to generate technical implementation plan (how)
3. **Implementation**: Use `/speckit.implement` to execute the plan
4. **Extensions**: Use `/speckit.bugfix`, `/speckit.modify`, `/speckit.refactor` for maintenance

**Note**: While the Specify workflow is recommended for consistency, developers MAY use alternative approaches if they adhere to all Core Principles.

### Mandatory Workflow Rules

- **Feature branches** MUST follow the pattern: `feature/###-feature-name` (e.g., `feature/001-user-profiles`)
- **Commits** MUST be atomic and include passing tests
- **Pull requests** MUST verify compliance with all Core Principles before merge
- **Documentation** MUST be updated alongside code changes (no stale docs)

## Governance

**The constitution supersedes all other practices; amendments require documentation and versioning.**

### Compliance

- All pull requests MUST be reviewed for compliance with Core Principles
- Violations MUST be justified in the PR description with rationale
- Complexity MUST be justified against Principle VI (Simplicity & YAGNI)
- If a principle cannot be followed, it indicates either:
  - The principle needs amendment, OR
  - The approach needs reconsideration

### Amendments

- Constitution changes MUST be versioned using semantic versioning:
  - **MAJOR**: Backward-incompatible changes (principle removal/redefinition)
  - **MINOR**: New principles or material expansions
  - **PATCH**: Clarifications, wording fixes, non-semantic refinements
- All amendments MUST include a Sync Impact Report documenting changes
- Amendment proposals MUST be discussed before ratification

### Versioning

- Templates (`.specify/templates/*.md`) MUST stay synchronized with constitution
- Commands (`.claude/commands/*.md`) MUST reference current constitution version
- Outdated references MUST be updated when constitution changes

**Version**: 1.0.0 | **Ratified**: 2025-10-08 | **Last Amended**: 2025-10-08
