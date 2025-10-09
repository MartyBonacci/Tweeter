# API Contracts: User Registration and Profiles

**Feature**: 001-users-can-register
**Base URL**: `/api`
**Format**: REST (JSON)

## Authentication Endpoints

### POST /api/auth/register
**Purpose**: Create new user account and auto-login

**Request**:
```typescript
{
  username: string;  // 3-30 chars, alphanumeric + _ -
  password: string;  // Min 8 chars
}
```

**Success Response (201 Created)**:
```typescript
{
  user: {
    id: string;
    username: string;
    createdAt: string;
  };
  session: {
    expires: string;
  };
}
```

**Error Responses**:
- 400 Bad Request: Invalid input (Zod validation errors)
- 409 Conflict: Username already exists

---

### POST /api/auth/login
**Purpose**: Authenticate existing user

**Request**:
```typescript
{
  username: string;
  password: string;
}
```

**Success Response (200 OK)**:
```typescript
{
  user: {
    id: string;
    username: string;
  };
  session: {
    expires: string;
  };
}
```

**Error Responses**:
- 400 Bad Request: Missing fields
- 401 Unauthorized: Invalid credentials

---

### POST /api/auth/logout
**Purpose**: End user session

**Request**: None (uses session cookie)

**Success Response (200 OK)**:
```typescript
{
  message: "Logged out successfully"
}
```

---

## Profile Endpoints

### POST /api/profiles
**Purpose**: Create user profile (requires authentication)

**Headers**: `Cookie: connect.sid=...`

**Request**:
```typescript
{
  displayName: string;  // 1-100 chars
  bio: string;          // 0-141 chars
}
```

**Success Response (201 Created)**:
```typescript
{
  profile: {
    id: string;
    userId: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    createdAt: string;
  };
}
```

**Error Responses**:
- 401 Unauthorized: Not logged in
- 400 Bad Request: Invalid input
- 409 Conflict: Profile already exists

---

### POST /api/profiles/avatar
**Purpose**: Upload profile avatar (requires authentication)

**Headers**:
- `Cookie: connect.sid=...`
- `Content-Type: multipart/form-data`

**Request**:
```
file: <binary image data>  // Max 5MB, JPG/PNG/GIF/WebP
```

**Success Response (200 OK)**:
```typescript
{
  avatarUrl: string;  // Cloudinary URL
}
```

**Error Responses**:
- 401 Unauthorized: Not logged in
- 400 Bad Request: Invalid file (not image, too large)
- 500 Internal Server Error: Cloudinary upload failed

---

### GET /api/profiles/:username
**Purpose**: View public profile (no auth required)

**Parameters**: `username` (case-insensitive)

**Success Response (200 OK)**:
```typescript
{
  profile: {
    username: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    createdAt: string;
  };
}
```

**Error Responses**:
- 404 Not Found: Profile doesn't exist

---

## Middleware

### Authentication Middleware
```typescript
// Validates session cookie, attaches user to req
export function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

### Validation Middleware
```typescript
// Validates request body against Zod schema
export function validate(schema: ZodSchema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ errors: error.errors });
    }
  };
}
```

## Session Management

### Cookie Configuration
```typescript
{
  name: 'connect.sid',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
}
```

### Session Data Structure
```typescript
{
  userId: string;
  expires: Date;
}
```
