# Quickstart: User Registration and Profiles Implementation

**Feature**: 001-users-can-register
**Estimated Time**: 8-12 hours (with TDD)

## Prerequisites

1. **Database**: PostgreSQL via Neon provisioned and accessible
2. **Cloudinary**: Account created, API credentials ready
3. **Environment**: Node.js 18+, npm/pnpm installed

## Step-by-Step Implementation Guide

### Phase 1: Project Setup (30 min)

```bash
# Initialize project
npm init -y

# Install dependencies
npm install @remix-run/react @remix-run/node express express-session connect-pg-simple postgres zod argon2 uuidv7 cloudinary multer

# Install dev dependencies
npm install -D @types/express @types/express-session @types/multer vitest supertest @types/supertest typescript tsx

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://...
SESSION_SECRET=$(openssl rand -base64 32)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NODE_ENV=development
PORT=3000
EOF

# Create tsconfig.json
npx tsc --init --target ES2022 --module ESNext --moduleResolution bundler --strict
```

### Phase 2: Database Migrations (20 min)

```bash
# Create migration files
mkdir -p src/db/migrations

# Run migrations (copy SQL from data-model.md)
psql $DATABASE_URL < src/db/migrations/001_create_users.sql
psql $DATABASE_URL < src/db/migrations/002_create_profiles.sql
```

### Phase 3: Zod Schemas (30 min)

**TDD Step 1**: Write tests FIRST for schema validation

```typescript
// tests/unit/schemas.test.ts
import { RegisterSchema, ProfileSchema } from '../src/schemas';

test('RegisterSchema validates valid input', () => {
  expect(RegisterSchema.parse({
    username: 'alice',
    password: 'password123'
  })).toBeTruthy();
});

test('RegisterSchema rejects short password', () => {
  expect(() => RegisterSchema.parse({
    username: 'alice',
    password: 'short'
  })).toThrow();
});
// ... more test cases
```

**TDD Step 2**: Run tests (they should FAIL)
```bash
npm test # RED
```

**TDD Step 3**: Implement schemas (see data-model.md)

**TDD Step 4**: Tests pass
```bash
npm test # GREEN
```

### Phase 4: Pure Function Services (1 hour)

**TDD**: Write service tests FIRST (see tests/unit/auth.service.test.ts template)

```typescript
// src/services/auth.service.ts
import argon2 from 'argon2';
import { uuidv7 } from 'uuidv7';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function generateUserId(): string {
  return uuidv7();
}
```

### Phase 5: API Contract Tests (1 hour)

**TDD CRITICAL**: Write ALL contract tests BEFORE implementing routes

```typescript
// tests/contract/auth.contract.test.ts
import request from 'supertest';
import { app } from '../../src/api/server';

describe('POST /api/auth/register', () => {
  test('creates user and returns 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.session).toHaveProperty('expires');
  });

  test('rejects duplicate username with 409', async () => {
    // First registration
    await request(app).post('/api/auth/register')
      .send({ username: 'alice', password: 'password123' });

    // Duplicate attempt
    const res = await request(app).post('/api/auth/register')
      .send({ username: 'alice', password: 'different123' });

    expect(res.status).toBe(409);
  });
});
```

**Run tests** → Should FAIL (no routes implemented yet)

### Phase 6: Express API Routes (2 hours)

Implement routes to make contract tests pass (see contracts/api-endpoints.md)

```typescript
// src/api/routes/auth.ts
import { Router } from 'express';
import { RegisterSchema } from '../../schemas/auth.schema';
import { hashPassword, generateUserId } from '../../services/auth.service';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.post('/register', validate(RegisterSchema), async (req, res) => {
  const { username, password } = req.body;

  const passwordHash = await hashPassword(password);
  const userId = generateUserId();

  try {
    const [user] = await sql`
      INSERT INTO users (id, username, password_hash)
      VALUES (${userId}, ${username.toLowerCase()}, ${passwordHash})
      RETURNING id, username, created_at
    `;

    req.session.userId = user.id;

    res.status(201).json({
      user,
      session: { expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Username already exists' });
    } else {
      throw error;
    }
  }
});

export default router;
```

**Run contract tests** → Should PASS (GREEN)

### Phase 7: Integration Tests (1 hour)

**TDD**: Write integration tests for full user flows

```typescript
// tests/integration/registration-flow.test.ts
test('full registration → profile creation → view flow', async () => {
  // 1. Register
  const regRes = await request(app).post('/api/auth/register')
    .send({ username: 'bob', password: 'password123' });

  const sessionCookie = regRes.headers['set-cookie'];

  // 2. Create profile
  const profRes = await request(app).post('/api/profiles')
    .set('Cookie', sessionCookie)
    .send({ displayName: 'Bob Smith', bio: 'Hello world!' });

  expect(profRes.status).toBe(201);

  // 3. View profile (as anonymous user)
  const viewRes = await request(app).get('/api/profiles/bob');

  expect(viewRes.status).toBe(200);
  expect(viewRes.body.profile.displayName).toBe('Bob Smith');
});
```

### Phase 8: Remix Frontend (3 hours)

Implement UI components using Tailwind + Flowbite (see project structure in plan.md)

**Key components**:
- RegisterForm.tsx (with real-time validation)
- ProfileForm.tsx (with 141-char counter)
- AvatarUpload.tsx (with progress bar)
- ProfileView.tsx (displays public profile)

### Phase 9: Avatar Upload (1 hour)

```typescript
// src/services/upload.service.ts
import cloudinary from 'cloudinary';
import { Readable } from 'stream';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export function uploadAvatar(file: Express.Multer.File): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.v2.uploader.upload_stream(
      { folder: 'tweeter/avatars', transformation: [{ width: 400, height: 400, crop: 'fill' }] },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url });
      }
    );
    Readable.from(file.buffer).pipe(upload);
  });
}
```

### Phase 10: Testing & Refactoring (1 hour)

**Run full test suite**:
```bash
npm test
```

**All tests must PASS before proceeding!**

**Refactor** while keeping tests green:
- Extract duplicate code
- Improve function names
- Add comments for complex logic

## Checklist

- [ ] Database migrations run successfully
- [ ] All Zod schemas defined and tested
- [ ] All contract tests written and passing
- [ ] All integration tests written and passing
- [ ] API endpoints implement all contracts
- [ ] Session management works (30-day persistence)
- [ ] Password hashing uses argon2
- [ ] Avatar upload to Cloudinary works
- [ ] Frontend forms have real-time validation
- [ ] Bio character counter updates in real-time
- [ ] Public profiles viewable without auth
- [ ] Username uniqueness enforced (case-insensitive)
- [ ] Error messages are user-friendly
- [ ] Constitution compliance verified (all 6 principles)

## Running the App

### Development
```bash
# Terminal 1: API server
npm run api:dev

# Terminal 2: Remix dev server
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Next Steps

After this feature is complete:
1. Merge to main (after all tests pass)
2. Deploy to production
3. Next feature: `/speckit.specify "Users can post tweets..."`
