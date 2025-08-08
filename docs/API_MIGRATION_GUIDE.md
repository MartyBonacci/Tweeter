# API Migration Guide: Express/Fastify Backend Separation

This guide walks you through extracting your API layer to a separate backend service while maintaining all functionality.

## 🎯 **Migration Overview**

Your current architecture already supports this migration because:
- ✅ **Handlers are framework-agnostic** (pure functions)
- ✅ **Models are portable** (no React Router dependencies) 
- ✅ **Types are reusable** (work with any HTTP framework)
- ✅ **Business logic is isolated** (in handlers and models)

## 📋 **Migration Steps**

### Phase 1: Prepare Backend Repository

#### 1.1 Create New Backend Project

```bash
mkdir tweeter-api
cd tweeter-api
npm init -y

# Install dependencies
npm install express cors helmet morgan
npm install -D @types/express @types/cors typescript tsx
```

#### 1.2 Copy Portable Code

```bash
# Copy the entire API layer (handlers, types, utils, router)
cp -r ../tweeter/app/api ./src/

# Copy data models
cp -r ../tweeter/app/models ./src/

# Copy utilities (error handling, response utils)
cp -r ../tweeter/app/utils ./src/

# Copy database connection and schema
cp -r ../tweeter/app/lib/db ./src/lib/
```

#### 1.3 Copy Environment Configuration

```bash
# Copy database and JWT configuration
cp ../tweeter/.env ./
cp ../tweeter/drizzle.config.ts ./
cp -r ../tweeter/app/lib/auth ./src/lib/
cp -r ../tweeter/app/lib/middleware ./src/lib/
```

### Phase 2: Create Express Adapter

#### 2.1 Express Server Setup

```typescript
// src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiRoutes } from './api/router';
import { convertToApiRequest, convertToExpressResponse } from './express-adapter';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register API routes
apiRoutes.forEach(route => {
  const method = route.method.toLowerCase() as keyof Express;
  const path = route.path;
  
  app[method](path, async (req, res) => {
    try {
      // Convert Express request to our ApiRequest format
      const apiRequest = await convertToApiRequest(req);
      
      // Apply middleware if specified
      if (route.middleware) {
        const middlewareResult = await applyMiddleware(route.middleware, apiRequest);
        if (!middlewareResult) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        apiRequest = middlewareResult;
      }
      
      // Call the handler
      const apiResponse = await route.handler(apiRequest);
      
      // Convert to Express response
      convertToExpressResponse(apiResponse, res);
      
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});
```

#### 2.2 Express Adapter Functions

```typescript
// src/express-adapter.ts
import type { Request, Response } from 'express';
import type { ApiRequest, ApiResponse } from './api/types';

export async function convertToApiRequest(req: Request): Promise<ApiRequest> {
  return {
    method: req.method,
    path: req.path,
    params: req.params,
    query: new URLSearchParams(req.query as Record<string, string>),
    body: req.body,
    headers: req.headers as Record<string, string>,
    // Note: user will be added by auth middleware
  };
}

export function convertToExpressResponse(
  apiResponse: ApiResponse, 
  res: Response
): void {
  // Set headers
  if (apiResponse.headers) {
    Object.entries(apiResponse.headers).forEach(([key, value]) => {
      res.set(key, value);
    });
  }
  
  // Set cookies
  if (apiResponse.cookies) {
    apiResponse.cookies.forEach(cookie => {
      const [name, ...rest] = cookie.split('=');
      const value = rest.join('=').split(';')[0];
      const options = parseCookieOptions(cookie);
      res.cookie(name, value, options);
    });
  }
  
  res.status(apiResponse.status).json(apiResponse.body);
}

function parseCookieOptions(cookie: string) {
  const options: any = {};
  if (cookie.includes('HttpOnly')) options.httpOnly = true;
  if (cookie.includes('Secure')) options.secure = true;
  if (cookie.includes('SameSite=Strict')) options.sameSite = 'strict';
  
  const maxAge = cookie.match(/Max-Age=(\d+)/);
  if (maxAge) options.maxAge = parseInt(maxAge[1]) * 1000;
  
  return options;
}
```

#### 2.3 Middleware Adaptation

```typescript
// src/middleware/express-middleware.ts
import type { Request, Response, NextFunction } from 'express';
import type { ApiRequest } from '../api/types';
import { authenticateRequest } from '../lib/middleware/auth';

export function authMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convert to our request format for authentication
      const tempRequest = new Request(req.url, {
        method: req.method,
        headers: req.headers as HeadersInit,
      });
      
      const user = await authenticateRequest(tempRequest);
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Add user to Express request
      (req as any).user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  };
}

// Apply middleware to Express routes
export function applyMiddleware(
  middlewareNames: string[], 
  apiRequest: ApiRequest
): Promise<ApiRequest | null> {
  // This would be called by the route handler
  // Implementation depends on how you want to handle middleware in Express
  return Promise.resolve(apiRequest);
}
```

### Phase 3: Update Frontend

#### 3.1 Create API Client

```typescript
// app/lib/api-client.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.yourapp.com'
  : 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }
  
  private async request<T>(
    path: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
  }
  
  // Tweet methods
  async getTweets(query?: { limit?: number; offset?: number; userId?: string }) {
    const searchParams = new URLSearchParams();
    if (query?.limit) searchParams.set('limit', query.limit.toString());
    if (query?.offset) searchParams.set('offset', query.offset.toString());
    if (query?.userId) searchParams.set('userId', query.userId);
    
    const queryString = searchParams.toString();
    return this.request(`/api/tweets${queryString ? `?${queryString}` : ''}`);
  }
  
  async createTweet(data: { content: string }) {
    return this.request('/api/tweets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async getTweetById(id: string) {
    return this.request(`/api/tweets/${id}`);
  }
  
  // Auth methods
  async login(data: { username: string; password: string }) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async register(data: { username: string; email: string; name: string; password: string }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  }
}

export const apiClient = new ApiClient();
```

#### 3.2 Update Route Loaders/Actions

Replace the internal handler calls with API client calls:

```typescript
// app/routes/timeline.tsx
import { apiClient } from '~/lib/api-client';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Instead of: getUserTimeline(userId, limit, offset)
    const result = await apiClient.getTweets({ limit: 20, offset: 0 });
    return json(result);
  } catch (error) {
    return json({ error: 'Failed to load timeline' }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const content = formData.get('content') as string;
  
  try {
    // Instead of: createTweet({ content, userId })
    const result = await apiClient.createTweet({ content });
    return json(result);
  } catch (error) {
    return json({ error: 'Failed to create tweet' }, { status: 500 });
  }
}
```

### Phase 4: Deploy & Test

#### 4.1 Backend Deployment

```bash
# Build the backend
npm run build

# Deploy to your platform (Railway, Heroku, AWS, etc.)
# Set environment variables:
# - DATABASE_URL
# - JWT_SECRET
# - FRONTEND_URL
```

#### 4.2 Frontend Updates

```bash
# Update environment variables
VITE_API_URL=https://your-api.com

# Deploy frontend with new API URL
npm run build
```

#### 4.3 Database Migration

If using separate databases:

```bash
# Run migrations on the new API database
npx drizzle-kit push
npx tsx src/lib/db/seeds/seed.ts
```

## 🧪 **Testing Migration**

### Test Both Systems in Parallel

1. **Keep React Router API running** on localhost:3000
2. **Start Express API** on localhost:3001
3. **Test endpoints match**:

```bash
# Test React Router API
curl http://localhost:3000/api/tweets

# Test Express API
curl http://localhost:3001/api/tweets

# Responses should be identical
```

### Gradual Migration

1. **Route by route**: Migrate one endpoint at a time
2. **Feature flags**: Use environment variables to switch between internal/external API
3. **Load testing**: Ensure performance is acceptable

```typescript
// Gradual migration with feature flag
const USE_EXTERNAL_API = process.env.USE_EXTERNAL_API === 'true';

export async function loader({ request }: LoaderFunctionArgs) {
  if (USE_EXTERNAL_API) {
    return apiClient.getTweets();
  } else {
    // Use internal handlers
    return handleGetTweets(await normalizeRequest(request, {}));
  }
}
```

## 🚀 **Benefits After Migration**

### Immediate Benefits
- **Independent scaling** - Scale API and frontend separately
- **Technology flexibility** - Use different languages/frameworks for API
- **Team productivity** - Frontend and backend teams can work independently
- **Better caching** - Can add Redis, CDN layers
- **Security** - API can be behind separate firewall

### Future Possibilities
- **Mobile apps** - Same API works for iOS/Android
- **Multiple frontends** - Admin panel, public site, etc.
- **Microservices** - Split API into smaller services
- **Different databases** - API can use different data stores

## ⚠️ **Potential Issues & Solutions**

### CORS Issues
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://yourapp.com'
  ],
  credentials: true
}));
```

### Cookie/Session Management
```typescript
// Ensure cookies work cross-domain
res.cookie('token', value, {
  domain: process.env.COOKIE_DOMAIN || 'localhost',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' // Allow cross-site for dev
});
```

### Error Handling
```typescript
// Maintain same error format
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

## 📊 **Migration Checklist**

- [ ] Backend repository created
- [ ] Portable code copied (api/, models/, utils/)
- [ ] Express server configured
- [ ] Database connection working
- [ ] Auth middleware adapted
- [ ] API client created in frontend
- [ ] Route loaders/actions updated
- [ ] Environment variables set
- [ ] CORS configured
- [ ] Error handling consistent
- [ ] Tests updated
- [ ] Performance tested
- [ ] Monitoring added
- [ ] Documentation updated

Your **API Abstraction Layer** makes this migration straightforward because your business logic is already framework-independent! 🎉