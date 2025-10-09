# Data Model: User Registration and Profiles

**Feature**: 001-users-can-register
**Date**: 2025-10-08
**Phase**: 1 (Design & Contracts)

## Entities

### User Account
**Purpose**: Authentication credentials and account management
**Visibility**: Private (backend only, never exposed to frontend)

| Field | Zod Schema | TypeScript Type | PostgreSQL Type | Constraints |
|-------|------------|-----------------|-----------------|-------------|
| id | z.string().uuid() | string | UUID PRIMARY KEY | Auto-generated (uuidv7) |
| username | z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/) | string | VARCHAR(30) UNIQUE NOT NULL | Case-insensitive uniqueness |
| passwordHash | z.string() | string | TEXT NOT NULL | argon2 hash only |
| createdAt | z.date() | Date | TIMESTAMP DEFAULT NOW() | Auto-generated |
| updatedAt | z.date() | Date | TIMESTAMP DEFAULT NOW() | Auto-updated |

### User Profile
**Purpose**: Public user information displayed on profile pages
**Visibility**: Public (accessible to all users and anonymous visitors)

| Field | Zod Schema | TypeScript Type | PostgreSQL Type | Constraints |
|-------|------------|-----------------|-----------------|-------------|
| id | z.string().uuid() | string | UUID PRIMARY KEY | Auto-generated (uuidv7) |
| userId | z.string().uuid() | string | UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE | 1:1 with User Account |
| displayName | z.string().min(1).max(100) | string | VARCHAR(100) NOT NULL | Can differ from username |
| bio | z.string().max(141) | string | VARCHAR(141) | Tweeter's 141-char limit |
| avatarUrl | z.string().url().nullish() | string \| null | TEXT | Cloudinary URL or null |
| createdAt | z.date() | Date | TIMESTAMP DEFAULT NOW() | Auto-generated |
| updatedAt | z.date() | Date | TIMESTAMP DEFAULT NOW() | Auto-updated |

### Session
**Purpose**: Authenticated user state for 30-day persistent login
**Visibility**: Private (managed by express-session middleware)

| Field | PostgreSQL Type | Description |
|-------|-----------------|-------------|
| sid | VARCHAR PRIMARY KEY | Session ID (auto-generated) |
| sess | JSON NOT NULL | Session data (userId, expires) |
| expire | TIMESTAMP NOT NULL | Session expiration (30 days from creation) |

## Relationships

```
User Account (1) ←→ (1) User Profile [users.id = profiles.user_id]
User Account (1) ←→ (0..*) Session [users.id = sessions.sess.userId]
```

- One User Account has **zero or one** Profile (created after registration)
- One User Account has **zero or many** Sessions (multiple devices/browsers)

## Type Safety Chain

### Zod Schemas (src/schemas/auth.schema.ts)
```typescript
import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
```

### Zod Schemas (src/schemas/profile.schema.ts)
```typescript
import { z } from 'zod';

export const ProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  bio: z.string().max(141),
  avatarUrl: z.string().url().nullish()
});

export const AvatarUploadSchema = z.object({
  file: z.custom<Express.Multer.File>((val) => val && val.mimetype.startsWith('image/'), 'Must be an image file')
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
});

export type ProfileInput = z.infer<typeof ProfileSchema>;
```

### TypeScript Types (src/types/index.ts)
```typescript
// Derived from Zod schemas
export type { RegisterInput, LoginInput } from '../schemas/auth.schema';
export type { ProfileInput } from '../schemas/profile.schema';

// Database entities
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### PostgreSQL Schema (src/db/migrations/001_create_users.sql)
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  username VARCHAR(30) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$'),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username_lower ON users(LOWER(username));
```

### PostgreSQL Schema (src/db/migrations/002_create_profiles.sql)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  bio VARCHAR(141),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

CREATE TABLE session (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX idx_session_expire ON session(expire);
```

## Validation Rules

### Username
- 3-30 characters
- Alphanumeric + underscore/hyphen only
- Case-insensitive uniqueness (LOWER(username) index)
- No spaces or special characters

### Password
- Minimum 8 characters
- Hashed with argon2 before storage
- Never stored in plaintext

### Display Name
- 1-100 characters
- Can include spaces and UTF-8 characters
- Different from username (allows nicknames)

### Bio
- 0-141 characters (Tweeter's defining limit)
- Plain text only (no formatting)
- UTF-8 support for emoji

### Avatar
- Image files only (JPG, PNG, GIF, WebP)
- Max 5MB file size
- Uploaded to Cloudinary
- Optional (null allowed)

## State Transitions

### User Account States
1. **Registered** (initial): User created, password hashed, no profile
2. **Active**: User has completed profile
3. **Logged In**: User has active session(s)
4. **Logged Out**: No active sessions

### Profile States
1. **Nonexistent** (initial): User registered but no profile created
2. **Created**: Profile exists with display name, bio, and optional avatar
3. **Viewable**: Profile accessible via GET /api/profiles/:username

## Database Queries

### Key Queries (using postgres package for camelCase ↔ snake_case)
```typescript
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

// Register user
const user = await sql`
  INSERT INTO users (id, username, password_hash)
  VALUES (${userId}, ${username.toLowerCase()}, ${passwordHash})
  RETURNING *
`;

// Get user by username (case-insensitive)
const [user] = await sql`
  SELECT * FROM users WHERE LOWER(username) = LOWER(${username})
`;

// Create profile
const profile = await sql`
  INSERT INTO profiles (id, user_id, display_name, bio, avatar_url)
  VALUES (${profileId}, ${userId}, ${displayName}, ${bio}, ${avatarUrl})
  RETURNING *
`;

// Get profile by username (with join)
const [profile] = await sql`
  SELECT p.*, u.username
  FROM profiles p
  JOIN users u ON u.id = p.user_id
  WHERE LOWER(u.username) = LOWER(${username})
`;
```

##Human: continue