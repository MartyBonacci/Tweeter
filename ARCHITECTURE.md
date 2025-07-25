# Technical Architecture - Tweeter

## Overview

Tweeter is built as a modern, full-stack web application using React Router 7 in framework mode, providing server-side rendering capabilities with a clean separation of concerns. The architecture prioritizes simplicity, performance, and maintainability.

## Technology Stack

### Frontend
- **Framework:** React 18+ with React Router 7 (framework mode)
- **Language:** TypeScript 5+ (strict mode)
- **Styling:** TailwindCSS 3+
- **State Management:** React Context + Hooks (keeping it simple)
- **Build Tool:** Vite 5+
- **Package Manager:** npm/yarn

### Backend (React Router Framework Mode)
- **Runtime:** Node.js 20+
- **API Layer:** React Router actions and loaders
- **Validation:** Zod for runtime type checking
- **Authentication:** JWT with secure httpOnly cookies
- **Session Management:** Server-side sessions with Redis

### Database
- **Primary Database:** PostgreSQL 15+ (via Neon)
- **ORM:** Drizzle ORM
- **Migrations:** Drizzle Kit
- **Connection Pooling:** Neon connection pooling
- **Caching:** Redis for sessions and frequently accessed data

### Infrastructure
- **Hosting:** Vercel/Railway/Fly.io (edge-ready)
- **CDN:** Cloudflare for static assets
- **File Storage:** Cloudflare R2/AWS S3 for user uploads
- **Monitoring:** OpenTelemetry + preferred provider
- **Error Tracking:** Sentry

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│     Browser     │────▶│   CDN/Edge      │────▶│   Origin        │
│                 │     │   (Cloudflare)  │     │   Server        │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                ┌─────────────────────────┴─────────────────────────┐
                                │                                                   │
                                │              React Router App                     │
                                │                                                   │
                                │  ┌─────────────┐  ┌──────────────┐  ┌─────────┐ │
                                │  │   Routes    │  │ Controllers  │  │ Models  │ │
                                │  └──────┬──────┘  └──────┬───────┘  └────┬────┘ │
                                │         │                │                │      │
                                │         └────────────────┴────────────────┘      │
                                │                          │                       │
                                └──────────────────────────┼───────────────────────┘
                                                          │
                        ┌─────────────────┬───────────────┴───────────────┬─────────────────┐
                        │                 │                               │                 │
                        ▼                 ▼                               ▼                 ▼
                ┌───────────────┐ ┌───────────────┐             ┌───────────────┐ ┌───────────────┐
                │  PostgreSQL   │ │     Redis     │             │      R2       │ │   External    │
                │    (Neon)     │ │   (Cache)     │             │   (Storage)   │ │     APIs      │
                └───────────────┘ └───────────────┘             └───────────────┘ └───────────────┘
```

## Directory Structure

```
tweeter/
├── src/
│   ├── routes/             # React Router route definitions
│   │   ├── auth/          # Authentication routes
│   │   ├── tweets/        # Tweet-related routes
│   │   ├── users/         # User profile routes
│   │   └── api/           # API routes
│   │
│   ├── controllers/        # Business logic (actions/loaders)
│   │   ├── authController.ts
│   │   ├── tweetController.ts
│   │   └── userController.ts
│   │
│   ├── models/            # Database models and schemas
│   │   ├── User.ts
│   │   ├── Tweet.ts
│   │   ├── Follow.ts
│   │   └── Like.ts
│   │
│   ├── components/        # React components
│   │   ├── common/       # Shared components
│   │   ├── tweets/       # Tweet-specific components
│   │   ├── users/        # User-specific components
│   │   └── layout/       # Layout components
│   │
│   ├── utils/            # Utility functions
│   │   ├── auth.ts       # Auth helpers
│   │   ├── db.ts         # Database utilities
│   │   └── validation.ts # Validation schemas
│   │
│   ├── types/            # TypeScript type definitions
│   │   ├── models.ts     # Model types
│   │   ├── api.ts        # API types
│   │   └── common.ts     # Common types
│   │
│   └── db/               # Database configuration
│       ├── schema.ts     # Drizzle schema definitions
│       ├── migrations/   # SQL migrations
│       └── seed.ts       # Database seeding
│
├── public/               # Static assets
├── tests/               # Test files
├── scripts/             # Build and utility scripts
└── config/              # Configuration files
```

## Database Schema

### Core Tables

```sql
-- Users table
CREATE TABLE users (
    user_id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
    user_username VARCHAR(30) UNIQUE NOT NULL,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    user_password_hash TEXT NOT NULL,
    user_display_name VARCHAR(50),
    user_bio VARCHAR(160),
    user_avatar_url TEXT,
    user_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tweets table
CREATE TABLE tweets (
    tweet_id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
    tweet_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tweet_content VARCHAR(140) NOT NULL,
    tweet_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tweet_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tweet_reply_to_id UUID REFERENCES tweets(tweet_id) ON DELETE CASCADE,
    tweet_retweet_of_id UUID REFERENCES tweets(tweet_id) ON DELETE CASCADE
);

-- Follows table
CREATE TABLE follows (
    follow_id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
    follow_follower_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    follow_following_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    follow_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follow_follower_id, follow_following_id)
);

-- Likes table
CREATE TABLE likes (
    like_id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
    like_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    like_tweet_id UUID NOT NULL REFERENCES tweets(tweet_id) ON DELETE CASCADE,
    like_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(like_user_id, like_tweet_id)
);

-- Indexes for performance
CREATE INDEX idx_tweets_user_id ON tweets(tweet_user_id);
CREATE INDEX idx_tweets_created_at ON tweets(tweet_created_at DESC);
CREATE INDEX idx_follows_follower ON follows(follow_follower_id);
CREATE INDEX idx_follows_following ON follows(follow_following_id);
CREATE INDEX idx_likes_tweet ON likes(like_tweet_id);
CREATE INDEX idx_likes_user ON likes(like_user_id);
```

## API Design

### RESTful Endpoints

All API endpoints follow RESTful conventions and return JSON responses.

#### Authentication
```
POST   /api/auth/signup     - Create new account
POST   /api/auth/login      - Login user
POST   /api/auth/logout     - Logout user
GET    /api/auth/me         - Get current user
```

#### Tweets
```
GET    /api/tweets          - Get timeline (paginated)
POST   /api/tweets          - Create new tweet
GET    /api/tweets/:id      - Get specific tweet
DELETE /api/tweets/:id      - Delete tweet
```

#### Users
```
GET    /api/users/:username - Get user profile
GET    /api/users/:username/tweets - Get user tweets
POST   /api/users/:username/follow - Follow user
DELETE /api/users/:username/follow - Unfollow user
```

#### Interactions
```
POST   /api/tweets/:id/like    - Like tweet
DELETE /api/tweets/:id/like    - Unlike tweet
POST   /api/tweets/:id/retweet - Retweet
DELETE /api/tweets/:id/retweet - Remove retweet
```

### Response Format

```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  }
}
```

## Component Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── UserMenu
│   ├── Main
│   └── Footer
│
├── Pages (Routes)
│   ├── Home
│   │   ├── Timeline
│   │   └── TweetComposer
│   ├── Profile
│   │   ├── UserInfo
│   │   ├── UserStats
│   │   └── UserTimeline
│   └── TweetDetail
│       ├── Tweet
│       ├── Replies
│       └── TweetActions
│
└── Common Components
    ├── TweetCard
    ├── UserCard
    ├── Button
    ├── Input
    └── Modal
```

### State Management

```typescript
// Global state via Context
interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

// Local state for components
// Use useState, useReducer for complex state
// React Query/SWR for server state
```

## Security Architecture

### Authentication Flow

```
1. User submits credentials
2. Server validates and creates JWT
3. JWT stored in httpOnly cookie
4. Client receives user data
5. Subsequent requests include cookie
6. Server validates JWT on each request
```

### Security Measures

1. **Input Validation**
   - Zod schemas for all inputs
   - SQL injection prevention via parameterized queries
   - XSS prevention via React's built-in escaping

2. **Authentication**
   - Bcrypt for password hashing
   - JWT with short expiration
   - Refresh token rotation
   - Rate limiting on auth endpoints

3. **Authorization**
   - Resource-based permissions
   - User can only modify own content
   - Admin roles for moderation

4. **Data Protection**
   - HTTPS everywhere
   - Encrypted database connections
   - Sensitive data encryption at rest
   - PII data minimization

## Performance Optimization

### Frontend Performance

1. **Code Splitting**
   - Route-based splitting
   - Lazy loading components
   - Dynamic imports for features

2. **Asset Optimization**
   - Image lazy loading
   - WebP format with fallbacks
   - CDN for static assets

3. **Caching Strategy**
   - Service worker for offline
   - Browser caching headers
   - API response caching

### Backend Performance

1. **Database Optimization**
   - Connection pooling
   - Query optimization
   - Indexed columns
   - Materialized views for stats

2. **Caching Layers**
   - Redis for sessions
   - CDN for static content
   - API response caching
   - Database query caching

3. **Scaling Strategy**
   - Horizontal scaling ready
   - Stateless application
   - Load balancer ready
   - Database read replicas

## Monitoring and Observability

### Logging
```typescript
// Structured logging
logger.info('User login', {
  userId: user.user_id,
  ip: request.ip,
  userAgent: request.headers['user-agent']
});
```

### Metrics
- Request/response times
- Error rates
- Database query performance
- Cache hit rates
- User engagement metrics

### Alerts
- Error rate spikes
- Performance degradation
- Security incidents
- System resource usage

## Development Workflow

### Local Development
```bash
# Start development server
npm run dev

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed

# Run tests
npm run test
```

### CI/CD Pipeline
1. Code push triggers build
2. Run linting and type checking
3. Run unit and integration tests
4. Build production bundle
5. Deploy to staging
6. Run E2E tests
7. Deploy to production

## Future Considerations

### Scalability
- Microservices architecture
- Message queuing (RabbitMQ/Kafka)
- GraphQL API layer
- WebSocket for real-time updates

### Features
- Full-text search (Elasticsearch)
- Recommendation engine
- Analytics dashboard
- Mobile applications

### Technical Debt
- Regular dependency updates
- Code refactoring cycles
- Performance audits
- Security audits

## Conclusion

This architecture provides a solid foundation for building a scalable, maintainable Twitter clone. The use of modern technologies like React Router 7's framework mode, PostgreSQL with Neon, and Drizzle ORM ensures we can deliver a performant application while maintaining code quality and developer experience.