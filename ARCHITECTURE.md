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
- **Cloudinary**: Image upload, optimization, and CDN delivery
- **Mailgun**: Email verification and transactional email service

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
app/routes/
├── _index.tsx                        # Redirect to home
├── home.tsx                         # Home timeline with tweet form
├── login.tsx                        # User authentication
├── register.tsx                     # User registration
├── settings.tsx                     # Profile editing page
├── users.$username.tsx              # User profile pages
├── api/
│   ├── tweets.api.tsx              # Tweet retrieval with pagination
│   ├── tweets.$tweetId.like.api.tsx # Like/unlike tweets
│   ├── users.$username.api.tsx      # User profile data
│   ├── users.$username.follow.api.tsx # Follow/unfollow users
│   ├── auth.login.tsx              # Login authentication
│   └── auth.register.tsx           # User registration
```

### Component Structure
```
app/components/
├── Header.tsx            # Main navigation header
├── Sidebar.tsx           # Desktop sidebar navigation
├── MobileNav.tsx         # Mobile bottom navigation
├── Timeline.tsx          # Tweet timeline display
├── Tweet.tsx             # Individual tweet component
├── TweetForm.tsx         # Tweet composition form
├── LoginForm.tsx         # Login form component
├── RegisterForm.tsx      # Registration form component
└── ProfileEditForm.tsx   # Profile editing form
```

### Database Schema Structure
```
app/db/schema/
├── index.ts              # Schema exports
├── users.ts              # User table schema
├── tweets.ts             # Tweet table schema
├── follows.ts            # Follow relationships
└── likes.ts              # Like relationships
```

### Utility Structure
```
app/lib/
├── auth.server.ts        # JWT authentication utilities
├── middleware.ts         # Authentication middleware
├── schemas.ts            # Zod validation schemas
├── validation.ts         # Form validation utilities
└── validation-middleware.ts # API validation middleware
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

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/login` - User login with JWT token generation
- `POST /api/auth/register` - User registration with validation

### Tweet Endpoints
- `GET /api/tweets` - Retrieve tweets with pagination and filtering
  - Query params: `limit`, `offset`, `filter` (all/following)
- `POST /home` - Create new tweet (via form action)

### User Endpoints
- `GET /api/users/:username` - Get user profile data
- `GET /api/users/:username/follow` - Check follow status
- `POST /api/users/:username/follow` - Follow user
- `DELETE /api/users/:username/follow` - Unfollow user

### Social Interaction Endpoints
- `GET /api/tweets/:tweetId/like` - Get like status and count
- `POST /api/tweets/:tweetId/like` - Like tweet
- `DELETE /api/tweets/:tweetId/like` - Unlike tweet

### Image Upload Endpoints
- `POST /api/upload/avatar` - Upload profile image to Cloudinary
- `DELETE /api/upload/avatar` - Remove profile image

### Email Verification Endpoints
- `POST /api/auth/verify-email/:token` - Verify email address with token
- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/auth/verification-status` - Check verification status

## Data Flow

### Creating a Tweet
1. User submits tweet via TweetForm component on home page
2. Form data sent to home route action with authentication token
3. Server verifies JWT token and extracts user ID
4. Zod schema validates content (140-character limit, non-empty)
5. Database insert with UUIDv7 ID and timestamp
6. Success response triggers timeline refresh
7. Tweet appears immediately in user's timeline

### Loading Timeline
1. User visits home page, Timeline component loads
2. Client fetches from `/api/tweets` with authentication headers
3. Server queries database with pagination (limit/offset)
4. Joins tweets with user data and calculates like counts
5. Returns JSON response with tweet data
6. React hydrates Timeline component with server data
7. Infinite scroll loads additional pages on demand

### Social Interactions (Follow/Like)
1. User clicks follow/like button with loading state
2. Frontend sends API request with authentication
3. Server validates user permissions and target existence
4. Database transaction updates relationships
5. Response includes updated counts and success status
6. Frontend updates UI with new state and counts
7. Optimistic updates provide immediate feedback

### Profile Image Upload (Cloudinary)
1. User selects image file in profile edit form
2. Cloudinary upload widget handles file validation
3. Image uploaded directly to Cloudinary with signed parameters
4. Cloudinary processes and optimizes image automatically
5. Upload progress tracked and displayed to user
6. Cloudinary returns secure URL and transformation details
7. Frontend sends URL to server API for profile update
8. Database stores Cloudinary URL in avatar_url field
9. Profile immediately updates across all UI components

### Email Verification (Mailgun)
1. User completes registration form with email
2. Server creates user record with email_verified=false
3. Crypto generates secure verification token with expiration
4. Server stores token and expiration in database
5. Mailgun API sends verification email with token link
6. User clicks verification link in email
7. Server validates token and checks expiration
8. Database updates email_verified=true for user
9. User redirected to login with verification success message

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
- File upload restrictions and validation via Cloudinary
- Email address validation and verification tokens
- Secure token generation using crypto module

### Privacy
- User data encryption at rest
- Secure password hashing (bcrypt)
- Privacy-focused default settings
- No third-party tracking

### Third-Party Service Security
- **Cloudinary**: Signed uploads with API key restrictions
- **Mailgun**: API key rotation and domain verification
- **Environment Variables**: Secure storage of API credentials
- **Rate Limits**: Upload quotas and email sending limits
- **Data Retention**: Image optimization and email log policies

## Performance Optimization

### Database
- Proper indexing on user_id, created_at, tweet_id
- Pagination with limit/offset approach (20 tweets per page)
- Efficient joins for user data and like counts
- Connection pooling via Drizzle ORM
- UUIDv7 for time-sorted unique identifiers

### Frontend
- Real-time character counting with debounced validation
- Loading states for all async operations
- Optimistic UI updates for social interactions
- Mobile-first responsive design
- Efficient React component rendering

### API Performance
- JWT token validation for protected routes
- Zod schema validation for request/response data
- Efficient database queries with joins
- Pagination to limit response sizes
- Error handling with appropriate HTTP status codes

### Caching Strategy
- Browser caching for static assets via Vite
- LocalStorage for JWT tokens and user data
- Component-level state caching
- Cloudinary CDN for global image delivery
- Mailgun template caching for faster email generation
- Future: Redis for session storage and API caching

### Third-Party Service Performance
- **Cloudinary**: Auto-format, auto-quality, and responsive images
- **Image Transformations**: On-the-fly resizing and optimization
- **CDN Distribution**: Global content delivery for fast image loading
- **Mailgun**: Template-based emails with inline CSS optimization
- **Email Queue**: Async processing to prevent blocking operations
- **Service Monitoring**: Health checks and fallback strategies

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