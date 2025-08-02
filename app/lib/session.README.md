# Session Management Utilities for Remix

A comprehensive, security-focused session management system for Remix applications with TypeScript support.

## Features

- 🔐 **Secure by default** - Uses secure cookie settings, proper secrets, and session validation
- 🚀 **Type-safe** - Full TypeScript support with Zod validation
- 🔄 **Remix-native** - Built specifically for Remix.run with proper server-side handling
- 📊 **Session lifecycle** - Complete session creation, retrieval, update, and destruction
- 👮 **Role-based access** - Built-in role checking for admin/user permissions
- 🧪 **Well-tested** - Comprehensive test suite with 100% coverage
- 📚 **Rich examples** - Complete usage examples for common patterns

## Quick Start

### 1. Environment Setup

Add to your `.env` file:

```bash
SESSION_SECRET=your-64-character-secret-key-here-must-be-at-least-32-chars
NODE_ENV=production
```

### 2. Basic Usage

#### Creating a session (login)

```typescript
// routes/login.tsx
import { createUserSession } from "~/lib/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await validateCredentials(email, password);
  return createUserSession(
    { userId: user.id, email: user.email, role: user.role },
    "/dashboard"
  );
}
```

#### Protecting a route

```typescript
// routes/dashboard.tsx
import { requireAuth } from "~/lib/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userSession = await requireAuth(request, "/login?redirect=/dashboard");
  return json({ user: userSession });
}
```

#### Checking authentication status

```typescript
// routes/index.tsx
import { getUserSession } from "~/lib/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userSession = await getUserSession(request);
  return json({ isAuthenticated: !!userSession, user: userSession });
}
```

## API Reference

### Core Functions

#### `getUserSession(request: Request): Promise<UserSessionData | null>`
Retrieves the current user session data if it exists and is valid.

```typescript
const userSession = await getUserSession(request);
if (userSession) {
  console.log(`Welcome ${userSession.email}`);
}
```

#### `requireAuth(request: Request, redirectTo?: string): Promise<UserSessionData>`
Requires authentication - redirects to login if not authenticated.

```typescript
const userSession = await requireAuth(request, "/custom-login");
// User is guaranteed to be authenticated here
```

#### `createUserSession(userData, redirectTo: string)`
Creates a new user session and redirects.

```typescript
return createUserSession(
  { userId: "123", email: "user@example.com", role: "admin" },
  "/welcome"
);
```

#### `destroyUserSession(request: Request, redirectTo?: string)`
Destroys the current session (logout).

```typescript
return destroyUserSession(request, "/login?logout=success");
```

#### `isAdmin(request: Request): Promise<boolean>`
Checks if the current user has admin role.

```typescript
if (await isAdmin(request)) {
  // Admin-only functionality
}
```

### Advanced Functions

#### `updateUserSession(request: Request, updates: Partial<...>)`
Updates the current session with new data.

```typescript
const headers = await updateUserSession(request, {
  email: "new@example.com"
});
return redirect("/profile", { headers });
```

#### `getSessionId(request: Request): Promise<string | null>`
Gets the current session ID for audit purposes.

#### `validateSessionConfig(config: Partial<SessionConfig>): SessionConfig`
Validates custom session configuration.

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SESSION_SECRET` | Yes | Cookie signing secret (min 32 chars) | - |
| `NODE_ENV` | No | Environment (affects secure flag) | `development` |

### Custom Configuration

```typescript
import { validateSessionConfig } from "~/lib/session.server";

const config = validateSessionConfig({
  cookieName: "myapp_session",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  secure: true,
  sameSite: "strict",
  path: "/api",
});
```

## Security Features

### Built-in Security

- **Secure cookies** - `httpOnly`, `secure` flag in production
- **Session validation** - Expiration checking and data validation
- **CSRF protection** - Proper `sameSite` cookie settings
- **Secret rotation** - Support for multiple cookie secrets
- **Data sanitization** - Safe for logging and debugging

### Security Utilities

```typescript
import { sessionSecurity } from "~/lib/session.server";

// Generate secure secret
const secret = sessionSecurity.generateSecret(64);

// Validate session data
const isValid = sessionSecurity.validateSessionData(sessionData);

// Sanitize for logging
const safeData = sessionSecurity.sanitizeForLogging(sessionData);
```

## Usage Patterns

### Protected Route Pattern

```typescript
// routes/protected.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const userSession = await requireAuth(request);
  return json({ user: userSession });
}

export async function action({ request }: ActionFunctionArgs) {
  const userSession = await requireAuth(request);
  
  // Process form with authenticated user
  const formData = await request.formData();
  await processUserData(userSession.userId, formData);
  
  return json({ success: true });
}
```

### Role-Based Access

```typescript
// routes/admin.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const userSession = await requireAuth(request);
  
  if (!await isAdmin(request)) {
    throw redirect("/unauthorized");
  }
  
  const adminData = await getAdminData();
  return json({ user: userSession, adminData });
}
```

### Layout Route Authentication

```typescript
// routes/dashboard.tsx (layout route)
export async function loader({ request }: LoaderFunctionArgs) {
  const userSession = await requireAuth(request);
  return json({ user: userSession });
}

// routes/dashboard/profile.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const userSession = await requireAuth(request);
  const profile = await getUserProfile(userSession.userId);
  return json({ user: userSession, profile });
}
```

### API Route Pattern

```typescript
// routes/api/user.ts
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userSession = await requireAuth(request);
    const userData = await getUserData(userSession.userId);
    
    return json({
      success: true,
      data: userData,
    }, {
      headers: {
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      }
    });
  } catch (error) {
    if (error instanceof Response && error.status === 302) {
      return json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    throw error;
  }
}
```

## Testing

### Test Setup

```bash
npm install -D vitest @testing-library/jest-dom
```

### Writing Tests

```typescript
import { describe, it, expect } from "vitest";
import { getUserSession, createUserSession } from "~/lib/session.server";

describe("Session Management", () => {
  it("should create and retrieve session", async () => {
    const response = await createUserSession(
      { userId: "123", email: "test@example.com" },
      "/test"
    );
    
    const cookie = response.headers.get("Set-Cookie");
    const request = new Request("http://localhost", {
      headers: { Cookie: cookie }
    });
    
    const session = await getUserSession(request);
    expect(session?.userId).toBe("123");
  });
});
```

## TypeScript Types

```typescript
interface UserSessionData {
  userId: string;
  email: string;
  role: "user" | "admin";
  expiresAt: number;
  createdAt: number;
}

interface SessionConfig {
  cookieName: string;
  cookieSecret: string;
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
}
```

## Troubleshooting

### Common Issues

#### "Cookie secret too short"
Ensure `SESSION_SECRET` is at least 32 characters long:

```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### "Session not persisting"
Check that you're properly handling the `Set-Cookie` header in your responses.

#### "CORS issues"
Ensure your cookie settings match your domain setup:

```typescript
// For cross-origin requests
sameSite: "none",
secure: true, // Requires HTTPS
```

## Migration Guide

### From Express Sessions

If migrating from Express.js sessions:

1. Replace `req.session` with `getUserSession(request)`
2. Replace `req.session.user = user` with `createUserSession(user, redirect)`
3. Replace `req.session.destroy()` with `destroyUserSession(request)`

### From JWT

```typescript
// Instead of JWT tokens
const token = jwt.sign({ userId: user.id }, secret);

// Use session cookies
return createUserSession(
  { userId: user.id, email: user.email },
  "/dashboard"
);
```

## Advanced Usage

### Custom Session Storage

For Redis or database storage, extend the session utilities:

```typescript
import { createSessionStorage } from "@remix-run/node";

const storage = createSessionStorage({
  cookie: sessionConfig,
  async createData(data, expires) {
    // Store in Redis/Database
    return sessionId;
  },
  async readData(id) {
    // Retrieve from Redis/Database
    return data;
  },
  async updateData(id, data, expires) {
    // Update in Redis/Database
  },
  async deleteData(id) {
    // Delete from Redis/Database
  },
});
```

## Contributing

1. Ensure all tests pass: `npm test`
2. Follow TypeScript best practices
3. Add comprehensive tests for new features
4. Update documentation for API changes

## License

MIT - Feel free to use in any project.