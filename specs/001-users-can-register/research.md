# Research: User Registration and Profiles

**Feature**: 001-users-can-register
**Date**: 2025-10-08
**Phase**: 0 (Outline & Research)

## Purpose

This document resolves technical unknowns and documents technology choices for the user registration and profile feature. All decisions align with the Tweeter Constitution v1.0.0.

## Research Questions

### 1. Session Management Strategy

**Question**: How should we implement 30-day persistent sessions with httpOnly cookies?

**Research**:
- Evaluated options: JWT tokens, session stores (Redis, PostgreSQL), cookie-based sessions
- Constitution requires httpOnly cookies for security (Constitution V)
- 30-day persistence requirement from spec

**Decision**: **Cookie-based sessions with PostgreSQL session store**

**Rationale**:
- **httpOnly cookies**: Prevents XSS attacks, meets Constitution V requirement
- **PostgreSQL session store**: Reuses existing database, no additional infrastructure (YAGNI principle)
- **Server-side sessions**: More secure than JWTs for MVP (can't be tampered with client-side)
- **30-day expiry**: Set cookie maxAge to 30 days, session cleanup via cron job

**Alternatives considered**:
- JWT tokens: More complex, requires refresh token logic, vulnerable to XSS if stored in localStorage
- Redis session store: Adds infrastructure complexity, premature optimization for MVP
- In-memory sessions: Lost on server restart, not suitable for production

**Implementation approach**:
```typescript
// Express session middleware with postgres store
import session from 'express-session';
import connectPg from 'connect-pg-simple';

const PgSession = connectPg(session);

app.use(session({
  store: new PgSession({ conString: process.env.DATABASE_URL }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));
```

---

### 2. Cloudinary Integration Pattern

**Question**: What's the best pattern for avatar uploads to Cloudinary with error handling?

**Research**:
- Cloudinary Node.js SDK documentation
- Best practices for file upload error handling
- Progress tracking for UX

**Decision**: **Direct backend upload with multipart form data**

**Rationale**:
- **Backend upload**: More secure (API keys never exposed to client)
- **Multipart handling**: Use `multer` middleware for Express
- **Error recovery**: Failed uploads don't block profile creation (avatar optional)
- **Progress feedback**: Use upload streams for progress reporting

**Alternatives considered**:
- Client-side direct upload: Exposes API credentials, security risk
- Base64 encoding: Inefficient for larger files, increases payload size
- Pre-signed URLs: Adds complexity, unnecessary for MVP

**Implementation approach**:
```typescript
// Upload service (pure function)
export async function uploadAvatar(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder: 'tweeter/avatars', transformation: [{ width: 400, height: 400, crop: 'fill' }] },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(file.buffer).pipe(upload);
  });
}
```

---

### 3. Password Hashing Configuration

**Question**: What argon2 configuration provides adequate security without performance issues?

**Research**:
- OWASP password storage recommendations
- argon2 parameter guidelines
- Performance benchmarks for web applications

**Decision**: **argon2id with default parameters**

**Rationale**:
- **argon2id**: Hybrid mode (combines argon2i and argon2d), resistant to both side-channel and GPU attacks
- **Default parameters**: Balanced security/performance (timeCost=3, memoryCost=4096, parallelism=1)
- **Constitution compliance**: Meets Constitution V requirement for argon2 hashing

**Alternatives considered**:
- bcrypt: Older algorithm, argon2 preferred by OWASP
- scrypt: Less standardized than argon2
- Custom parameters: Premature optimization (YAGNI principle)

**Implementation approach**:
```typescript
import argon2 from 'argon2';

// Hash password (pure function)
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password); // Uses argon2id by default
}

// Verify password (pure function)
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false; // Invalid hash format
  }
}
```

---

### 4. Database Schema Design

**Question**: How should we structure users and profiles tables to support future features?

**Research**:
- Normalization principles
- Future features: tweets, likes, follows (from README)
- Performance considerations for profile queries

**Decision**: **Separate users and profiles tables with 1:1 relationship**

**Rationale**:
- **Separation of concerns**: Authentication (users) separate from public data (profiles)
- **Future extensibility**: Tweets/likes reference user_id, not profile
- **Public/private data**: Users table never exposed to frontend, profiles table is public
- **Optional profiles**: Users can exist without profiles (registration before profile creation)

**Alternatives considered**:
- Single table: Violates separation of concerns, mixes auth and public data
- Multiple profile types: Over-engineering for MVP (YAGNI)

**Schema design**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$'),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  bio VARCHAR(141), -- Tweeter's defining constraint
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_users_username_lower ON users(LOWER(username)); -- Case-insensitive lookup
```

---

### 5. Remix + Express Integration

**Question**: How should Remix (frontend) and Express (API) be integrated in development and production?

**Research**:
- Remix server adapters
- Express as API server patterns
- Development workflow best practices

**Decision**: **Separate Express API server + Remix dev server in development, unified in production**

**Rationale**:
- **Development**: Run Express API on port 3001, Remix dev on port 3000 with proxy
- **Production**: Remix serves static assets, Express handles API routes on same port
- **API-first**: Express API can be tested independently (Constitution II)
- **Simplicity**: Standard web app pattern, no custom integration needed

**Implementation approach**:
```typescript
// Development: Separate servers
// Express: npm run api:dev (port 3001)
// Remix: npm run dev (port 3000, proxy /api/* to :3001)

// Production: Unified server
// Express serves both API and Remix build
app.use(express.static('build/client'));
app.use('/api', apiRoutes);
app.get('*', (req, res) => res.sendFile('build/client/index.html'));
```

---

## Technology Choices Summary

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **express-session** | Session management | PostgreSQL-backed, httpOnly cookies, 30-day persistence |
| **connect-pg-simple** | Session store | Reuses PostgreSQL, no additional infrastructure |
| **multer** | File upload handling | Standard Express multipart middleware |
| **cloudinary** | Avatar storage | Cloud-based, automatic image optimization |
| **argon2** | Password hashing | OWASP-recommended, argon2id mode |
| **postgres** (npm) | Database client | camelCase ↔ snake_case mapping, parameterized queries |
| **uuidv7** | ID generation | Time-ordered UUIDs, better indexing than v4 |
| **Vitest** | Test framework | Fast, TypeScript-first, Vite-native |
| **Supertest** | API testing | HTTP assertions for Express routes |

---

## Dependencies to Install

```json
{
  "dependencies": {
    "@remix-run/react": "^2.0.0",
    "@remix-run/node": "^2.0.0",
    "express": "^4.18.0",
    "express-session": "^1.17.0",
    "connect-pg-simple": "^9.0.0",
    "postgres": "^3.4.0",
    "zod": "^3.22.0",
    "argon2": "^0.31.0",
    "uuidv7": "^0.6.0",
    "cloudinary": "^1.41.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/express-session": "^1.17.0",
    "@types/multer": "^1.4.0",
    "vitest": "^1.0.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^6.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/tweeter

# Session
SESSION_SECRET=generate-random-32-char-string

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Environment
NODE_ENV=development|production
PORT=3000
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cloudinary upload failures | Users can't set avatars | Make avatar optional, allow retry, save profile without avatar |
| Session store performance | Slow login/page loads | Add index on session table, implement session cleanup cron |
| Password hash timing attacks | Security vulnerability | Use constant-time comparison (argon2.verify handles this) |
| Username enumeration | Privacy concern | Same error message for "user not found" and "wrong password" |
| Concurrent registration | Duplicate usernames | PostgreSQL UNIQUE constraint prevents, handle error gracefully |

---

## Next Steps

All research questions resolved. Proceed to **Phase 1: Design & Contracts** to generate:
- `data-model.md` - Entity definitions and relationships
- `contracts/` - API endpoint specifications
- `quickstart.md` - Implementation guide
