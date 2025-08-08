# API Abstraction Layer Architecture

This directory contains a **framework-agnostic API layer** that makes your API handlers portable between different HTTP frameworks (React Router, Express, Fastify, etc.).

## 🎯 **Key Benefits**

- **✅ Framework-Agnostic**: Handlers work with any HTTP framework
- **✅ Type-Safe**: Full TypeScript support throughout
- **✅ Testable**: Handlers are pure functions (easy to unit test)
- **✅ Maintainable**: Clear separation of concerns
- **✅ Scalable**: Easy to add new endpoints
- **✅ Future-Proof**: Simple migration to Express/Fastify later

## 📁 **Directory Structure**

```
app/api/
├── types.ts              # Core type definitions
├── utils.ts              # Route matching & utilities  
├── router.ts             # Route registry
├── handlers/             # Business logic (portable!)
│   ├── tweets.handler.ts
│   ├── auth.handler.ts
│   ├── users.handler.ts
│   └── timeline.handler.ts
├── middleware/           # Middleware adapters
│   └── index.ts
└── __tests__/           # Tests
    ├── test-utils.ts
    ├── utils/
    ├── handlers/
    └── integration/
```

## 🔧 **Core Components**

### 1. **Types (`types.ts`)**

Framework-agnostic request/response types:

```typescript
interface ApiRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
  user?: AuthUser;
}

interface ApiResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
  cookies?: string[];
}
```

### 2. **Route Registry (`router.ts`)**

All API routes defined in one place:

```typescript
export const apiRoutes: Route[] = [
  { method: 'GET', path: '/api/tweets', handler: tweetHandlers.handleGetTweets },
  { method: 'POST', path: '/api/tweets', handler: tweetHandlers.handleCreateTweet, middleware: ['auth'] },
  // ... more routes
];
```

### 3. **Handlers (`handlers/*.ts`)**

Pure functions that contain business logic:

```typescript
export async function handleGetTweets(req: ApiRequest): Promise<ApiResponse> {
  const limit = Number(req.query.get('limit')) || 20;
  const tweets = await findAllTweets(limit);
  
  return {
    status: 200,
    body: { tweets }
  };
}
```

### 4. **React Router Adapter (`/routes/api/$.tsx`)**

Single file that converts React Router requests to our format:

```typescript
export async function loader({ request, params }: LoaderFunctionArgs) {
  return handleRequest('GET', request, params);
}

export async function action({ request, params }: ActionFunctionArgs) {
  return handleRequest(request.method, request, params);
}

// Uses Response.json() instead of deprecated json() import
function createResponse(body: any, status: number = 200) {
  return Response.json(body, { status });
}
```

## 🚀 **Adding New API Endpoints**

### Step 1: Create Handler Function

```typescript
// app/api/handlers/posts.handler.ts
export async function handleGetPosts(req: ApiRequest): Promise<ApiResponse> {
  const posts = await findAllPosts();
  return { status: 200, body: { posts } };
}
```

### Step 2: Register Route

```typescript
// app/api/router.ts
import * as postHandlers from './handlers/posts.handler';

export const apiRoutes: Route[] = [
  // ... existing routes
  { method: 'GET', path: '/api/posts', handler: postHandlers.handleGetPosts },
  { method: 'POST', path: '/api/posts', handler: postHandlers.handleCreatePost, middleware: ['auth'] },
];
```

### Step 3: Write Tests

```typescript
// app/api/__tests__/handlers/posts.handler.test.ts
import { handleGetPosts } from '../../handlers/posts.handler';
import { createMockRequest } from '../test-utils';

describe('Post Handlers', () => {
  it('should return posts', async () => {
    const request = createMockRequest();
    const response = await handleGetPosts(request);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('posts');
  });
});
```

That's it! The new endpoint works automatically.

## 🧪 **Testing**

### Unit Tests

Test handlers in isolation:

```bash
npm test app/api/__tests__/handlers/
```

### Integration Tests

Test the complete request cycle:

```bash
npm test app/api/__tests__/integration/
```

### Test Utilities

Use provided helpers for consistent testing:

```typescript
import { createMockRequest, createAuthenticatedRequest } from '../test-utils';

const request = createAuthenticatedRequest(
  { id: 'user-123' },
  { method: 'POST', body: { content: 'test' } }
);
```

## 🔐 **Middleware**

### Available Middleware

- **`auth`**: Requires authentication
- **`sanitize`**: Sanitizes input data

### Using Middleware

```typescript
{ 
  method: 'POST', 
  path: '/api/protected', 
  handler: myHandler, 
  middleware: ['auth', 'sanitize'] 
}
```

### Adding Custom Middleware

```typescript
// app/api/middleware/index.ts
export const customMiddleware: MiddlewareFunction = async (req) => {
  // Your logic here
  return req; // or null to reject
};

export const middlewareRegistry = {
  auth: authMiddleware,
  sanitize: sanitizeMiddleware,
  custom: customMiddleware, // Add here
};
```

## 🔄 **Future Express Migration**

When ready to separate your backend:

### Step 1: Copy Portable Code

```bash
cp -r app/api backend/src/
cp -r app/models backend/src/
```

### Step 2: Create Express Adapter

```javascript
// backend/src/server.js
import express from 'express';
import { apiRoutes } from './api/router.js';

const app = express();

apiRoutes.forEach(route => {
  app[route.method.toLowerCase()](route.path, async (req, res) => {
    // Convert Express req/res to ApiRequest/ApiResponse
    const apiRequest = convertExpressRequest(req);
    const apiResponse = await route.handler(apiRequest);
    
    res.status(apiResponse.status).json(apiResponse.body);
  });
});
```

### Step 3: Update Frontend

```typescript
// Replace internal API calls with external HTTP calls
const tweets = await fetch('http://api.myapp.com/tweets').then(r => r.json());
```

Your handlers, models, and business logic work unchanged! 🎉

## 🛠 **Development Workflow**

1. **Plan**: Define your API endpoint structure
2. **Model**: Create/update data models if needed
3. **Handler**: Write the handler function (pure business logic)
4. **Route**: Register the route in router.ts
5. **Test**: Write unit tests for the handler
6. **Use**: The endpoint is automatically available

## 📚 **Best Practices**

### Handler Functions

- Keep handlers pure (no side effects)
- Handle errors gracefully
- Return consistent response shapes
- Use proper HTTP status codes
- Validate input with Zod schemas

### Error Handling

```typescript
export async function handleExample(req: ApiRequest): Promise<ApiResponse> {
  try {
    // Business logic
    return { status: 200, body: { success: true } };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { status: 400, body: { error: error.message } };
    }
    
    console.error('Handler error:', error);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
```

### Response Consistency

```typescript
// Good: Consistent response shapes
{ status: 200, body: { tweets: [...], pagination: {...} } }
{ status: 201, body: { tweet: {...}, message: "Created successfully" } }
{ status: 400, body: { error: "Validation failed", details: {...} } }
```

## 🔍 **Debugging**

### Route Matching Issues

```typescript
import { matchRoute } from './utils';
import { apiRoutes } from './router';

const route = matchRoute('GET', '/api/tweets/123', apiRoutes);
console.log(route); // Should find the :id route
```

### Handler Testing

```typescript
import { handleGetTweets } from './handlers/tweets.handler';
import { createMockRequest } from './__tests__/test-utils';

const response = await handleGetTweets(createMockRequest());
console.log(response);
```

## 📈 **Performance Considerations**

- Handlers are called synchronously (no framework overhead)
- Route matching is O(n) but routes are cached
- Middleware runs in sequence (keep chains short)
- JSON parsing happens once per request
- No regex compilation per request (routes are pre-compiled)

This architecture provides the perfect balance of simplicity, performance, and portability! 🚀