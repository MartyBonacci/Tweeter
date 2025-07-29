# System Architecture - Tweeter Project

## Technology Stack

### Frontend
- **React Router 7** (Framework Mode): Full-stack React framework
  - [Official Documentation for React Router 7 framework mode](https://reactrouter.com/start/framework/installation)
  - [Example how to implement React Router 7 framework mode](https://github.com/MartyBonacci/react-router-7-tutorial/tree/main)
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server

### Backend
- **React Router 7 API Routes**: Server-side API endpoints
  - [Official Documentation for React Router 7 framework mode](https://reactrouter.com/start/framework/installation)
  - [Example how to implement React Router 7 framework mode](https://github.com/MartyBonacci/react-router-7-tutorial/tree/main)
- **Drizzle ORM**: Type-safe database queries
- **Zod**: Runtime type validation
- **UUIDv7**: Time-sortable unique identifiers

### Database
- **PostgreSQL**: Primary database (via Neon)
- **Drizzle Kit**: Database migrations and schema management

### Development & Deployment
- **pnpm**: Package manager
- **Vitest**: Testing framework
- **ESLint**: Code linting
- **TypeScript**: Type checking

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │   React Router  │  │   React          │  │ Tailwind  │ │
│  │   Framework     │  │   Components     │  │   CSS     │ │
│  └─────────────────┘  └──────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Router API Routes                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │   API Routes    │  │   Controllers    │  │   Zod     │ │
│  │   /api/*        │  │   Business Logic │  │ Validation│ │
│  └─────────────────┘  └──────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (PostgreSQL)                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │   Users         │  │   Tweets         │  │  Likes    │ │
│  │   Follows       │  │   Retweets       │  │  Replies  │ │
│  └─────────────────┘  └──────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Route Structure
```
src/routes/
├── _index.tsx              # Home timeline
├── login.tsx              # User authentication
├── register.tsx           # User registration
├── tweet.$id.tsx          # Individual tweet view
├── profile.$username.tsx  # User profile
├── api/
│   ├── tweets.ts          # Tweet CRUD operations
│   ├── users.ts          # User operations
│   ├── follows.ts        # Follow/unfollow
│   └── auth.ts           # Authentication endpoints
```

### Controller Structure
```
src/controllers/
├── tweetController.ts     # Tweet business logic
├── userController.ts      # User management
├── authController.ts      # Authentication
└── followController.ts    # Social connections
```

### Model Structure
```
src/models/
├── schema.ts             # Drizzle schema definitions
├── user.ts              # User model
├── tweet.ts             # Tweet model
├── follow.ts            # Follow relationship
└── like.ts              # Like relationship
```

## Data Models

### User Model
```typescript
{
  user_id: UUIDv7,
  username: string (unique),
  display_name: string,
  bio: string (max 160),
  avatar_url: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Tweet Model
```typescript
{
  tweet_id: UUIDv7,
  user_id: UUIDv7 (foreign key),
  content: string (max 140),
  created_at: timestamp,
  updated_at: timestamp,
  is_deleted: boolean
}
```

### Follow Model
```typescript
{
  follow_id: UUIDv7,
  follower_id: UUIDv7 (foreign key),
  following_id: UUIDv7 (foreign key),
  created_at: timestamp
}
```

### Like Model
```typescript
{
  like_id: UUIDv7,
  user_id: UUIDv7 (foreign key),
  tweet_id: UUIDv7 (foreign key),
  created_at: timestamp
}
```

## Data Flow

### Creating a Tweet
1. User submits tweet via frontend form
2. React Router API route receives request
3. Zod validates 140-character limit
4. Controller creates tweet record
5. Database stores tweet with UUIDv7 ID
6. Timeline cache updated
7. Websocket notifies followers (future enhancement)

### Loading Timeline
1. User visits home page
2. API fetches followed users' tweets
3. Reverse chronological sorting
4. Pagination for infinite scroll
5. Hydrate React components with data

## Security Considerations

### Authentication
- JWT tokens for session management
- HTTP-only cookies for token storage
- Rate limiting on API endpoints
- CSRF protection

### Data Validation
- Zod schemas for all inputs
- SQL injection prevention via parameterized queries
- XSS protection through React's built-in escaping
- File upload restrictions for avatars

### Privacy
- User data encryption at rest
- Secure password hashing (bcrypt)
- Privacy-focused default settings
- No third-party tracking

## Performance Optimization

### Database
- Proper indexing on user_id, created_at
- Pagination with cursor-based approach
- Read replicas for scaling (future)
- Connection pooling

### Frontend
- React.lazy() for code splitting
- Image optimization with modern formats
- Service worker for caching
- Bundle size monitoring

### Caching Strategy
- Browser caching for static assets
- API response caching with ETags
- Database query result caching
- CDN for global asset delivery

## Monitoring & Observability

### Application Monitoring
- Error tracking with Sentry
- Performance monitoring with APM
- Database query performance
- User analytics (privacy-respecting)

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking
- Performance metrics

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Database read replicas
- CDN for static assets
- Microservices architecture (future)

### Database Scaling
- Partitioning by user_id
- Read/write splitting
- Connection pooling
- Query optimization

### Future Enhancements
- Redis for caching
- Message queues for async processing
- Real-time notifications
- Media uploads