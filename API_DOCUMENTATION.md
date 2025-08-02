# Tweeter API Documentation

## Overview

Tweeter is a RESTful API that provides a Twitter-like social networking platform. The API allows users to create accounts, post tweets (with 140 character limit), follow other users, like tweets, and manage their profiles.

## Base URL

```
https://api.tweeter.example.com
```

For local development:
```
http://localhost:3000
```

## Authentication

The API uses JWT-based authentication. After successful login, an access token is provided which should be included in the `Authorization` header for protected endpoints.

**Header Format:**
```
Authorization: Bearer <access_token>
```

**Token Types:**
- **Access Token**: Valid for 15 minutes, used for API requests
- **Refresh Token**: Valid for 7 days, used to obtain new access tokens (stored in HTTP-only cookies)

## Rate Limiting

All endpoints are rate-limited to prevent abuse. Rate limits are applied per IP address and authenticated user where applicable:

- **Authentication**: 5 requests per 15 minutes per IP
- **Tweet Creation**: 10 tweets per 15 minutes per user
- **Tweet Listing**: 100 requests per 15 minutes per IP
- **User Operations**: 50 requests per 15 minutes per IP
- **Like Operations**: 100 requests per 15 minutes per user

When rate limits are exceeded, the API returns a `429 Too Many Requests` response.

## Error Handling

The API uses consistent error responses with appropriate HTTP status codes:

```json
{
  "error": "Error description",
  "details": ["Optional validation errors"]
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## API Endpoints

### Authentication

#### Register New User
**POST** `/api/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "name": "John Doe",
  "password": "SecurePass123"
}
```

**Validation Rules:**
- `username`: 3-20 characters, alphanumeric and underscores only
- `email`: Valid email format, max 320 characters
- `name`: 1-100 characters
- `password`: 8-128 characters, must contain uppercase, lowercase, and number

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Validation failed or username/email already taken
- `500`: Internal server error

#### User Login
**POST** `/api/auth/login`

Authenticates a user and returns access/refresh tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Cookies Set:**
- `access_token`: JWT access token (HTTP-only, 15 minutes)
- `refresh_token`: JWT refresh token (HTTP-only, 7 days)

**Error Responses:**
- `401`: Invalid credentials
- `400`: Validation failed
- `500`: Internal server error

#### User Logout
**POST** `/api/auth/logout`

Logs out the current user by clearing authentication cookies.

**Headers:**
- Requires valid access token

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

**Cookies Cleared:**
- `access_token`
- `refresh_token`

### Users

#### Get User Profile
**GET** `/api/users/:id`

Retrieves a user's public profile information.

**Parameters:**
- `id`: User UUID

**Success Response (200):**
```json
{
  "id": "uuid",
  "username": "johndoe",
  "name": "John Doe",
  "bio": "Software developer passionate about open source",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `404`: User not found
- `500`: Internal server error

#### Get User by Username
**GET** `/api/users/:username`

Alternative endpoint to retrieve a user by their username.

**Parameters:**
- `username`: Username string (case-sensitive)

**Response:** Same as `/api/users/:id`

#### List Users
**GET** `/api/users`

Retrieves a paginated list of users with optional search.

**Query Parameters:**
- `limit` (optional): Number of users to return (default: 20, max: 100)
- `offset` (optional): Number of users to skip (default: 0)
- `search` (optional): Search term for username, name, or bio

**Success Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "johndoe",
      "name": "John Doe",
      "bio": "Software developer",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Update User Profile
**PUT** `/api/users/:id`

Updates the authenticated user's profile information.

**Headers:**
- Requires valid access token

**Request Body:**
```json
{
  "name": "Jane Doe",
  "bio": "Updated bio information",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "username": "johndoe",
  "name": "Jane Doe",
  "bio": "Updated bio information",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

**Error Responses:**
- `401`: Unauthorized
- `404`: User not found
- `400`: Validation failed
- `500`: Internal server error

#### Follow User
**POST** `/api/users/:id/follow`

Follows a user (creates follow relationship).

**Headers:**
- Requires valid access token

**Parameters:**
- `id`: Target user UUID to follow

**Success Response (201):**
```json
{
  "message": "Successfully followed user"
}
```

**Error Responses:**
- `400`: Cannot follow yourself or already following
- `404`: User not found
- `401`: Unauthorized
- `500`: Internal server error

#### Unfollow User
**DELETE** `/api/users/:id/follow`

Unfollows a user (removes follow relationship).

**Headers:**
- Requires valid access token

**Parameters:**
- `id`: Target user UUID to unfollow

**Success Response (200):**
```json
{
  "message": "Successfully unfollowed user"
}
```

**Error Responses:**
- `400`: Not following this user
- `404`: User not found
- `401`: Unauthorized
- `500`: Internal server error

#### Get User Follow Data
**GET** `/api/users/:id/follow`

Retrieves a user's followers and following lists.

**Parameters:**
- `id`: User UUID

**Success Response (200):**
```json
{
  "followers": [
    {
      "id": "uuid",
      "username": "follower1",
      "name": "Follower One",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "following": [
    {
      "id": "uuid",
      "username": "following1",
      "name": "Following One",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "counts": {
    "followers": 42,
    "following": 15
  }
}
```

### Tweets

#### List Tweets
**GET** `/api/tweets`

Retrieves a paginated list of tweets with optional filtering.

**Query Parameters:**
- `limit` (optional): Number of tweets to return (default: 20, max: 100)
- `offset` (optional): Number of tweets to skip (default: 0)
- `userId` (optional): Filter tweets by specific user ID

**Success Response (200):**
```json
{
  "tweets": [
    {
      "id": "uuid",
      "content": "Hello, Twitter! This is my first tweet.",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "user": {
        "id": "uuid",
        "username": "johndoe",
        "name": "John Doe"
      }
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Create Tweet
**POST** `/api/tweets`

Creates a new tweet.

**Headers:**
- Requires valid access token

**Request Body:**
```json
{
  "content": "Hello, Twitter! This is my first tweet."
}
```

**Validation Rules:**
- `content`: 1-140 characters required
- Content is sanitized to prevent XSS

**Success Response (201):**
```json
{
  "tweet": {
    "id": "uuid",
    "content": "Hello, Twitter! This is my first tweet.",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Tweet created successfully"
}
```

**Error Responses:**
- `400`: Validation failed or content too long
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: Internal server error

#### Get Tweet
**GET** `/api/tweets/:id`

Retrieves a specific tweet by ID.

**Parameters:**
- `id`: Tweet UUID

**Success Response (200):**
```json
{
  "tweet": {
    "id": "uuid",
    "content": "Hello, Twitter! This is my first tweet.",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "name": "John Doe"
    }
  }
}
```

#### Update Tweet
**PUT** `/api/tweets/:id`

Updates the content of an existing tweet (only by the tweet's author).

**Headers:**
- Requires valid access token

**Parameters:**
- `id`: Tweet UUID to update

**Request Body:**
```json
{
  "content": "Updated tweet content here"
}
```

**Success Response (200):**
```json
{
  "tweet": {
    "id": "uuid",
    "content": "Updated tweet content here",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:01:00Z"
  },
  "message": "Tweet updated successfully"
}
```

#### Delete Tweet
**DELETE** `/api/tweets/:id`

Deletes a tweet (only by the tweet's author).

**Headers:**
- Requires valid access token

**Parameters:**
- `id`: Tweet UUID to delete

**Success Response (200):**
```json
{
  "message": "Tweet deleted successfully"
}
```

#### Get User Tweets
**GET** `/api/tweets/user/:userId`

Retrieves all tweets from a specific user.

**Parameters:**
- `userId`: User UUID

**Query Parameters:**
- `limit` (optional): Number of tweets to return (default: 20, max: 100)
- `offset` (optional): Number of tweets to skip (default: 0)

**Response:** Same format as `/api/tweets` but filtered by user

### Likes

#### Like Tweet
**POST** `/api/tweets/:id/like`

Likes a tweet.

**Headers:**
- Requires valid access token

**Parameters:**
- `id`: Tweet UUID to like

**Success Response (201):**
```json
{
  "message": "Successfully liked tweet"
}
```

#### Unlike Tweet
**DELETE** `/api/tweets/:id/like`

Unlikes a tweet.

**Headers:**
- Requires valid access token

**Parameters:**
- `id`: Tweet UUID to unlike

**Success Response (200):**
```json
{
  "message": "Successfully unliked tweet"
}
```

#### Get Tweet Likes
**GET** `/api/tweets/:id/like`

Retrieves the list of users who liked a tweet.

**Parameters:**
- `id`: Tweet UUID

**Success Response (200):**
```json
{
  "likers": [
    {
      "id": "uuid",
      "username": "liker1",
      "name": "Liker One",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 5
}
```

## Data Models

### User Model

```typescript
interface User {
  id: string;           // UUID v7
  username: string;     // 3-50 characters, unique
  email: string;        // Valid email, unique, max 320 characters
  passwordHash: string; // bcrypt hashed password
  displayName?: string; // 0-100 characters
  bio?: string;         // Optional text
  avatarUrl?: string;   // Optional image URL
  createdAt: Date;      // ISO 8601 timestamp
  updatedAt: Date;      // ISO 8601 timestamp
}
```

### Tweet Model

```typescript
interface Tweet {
  id: string;           // UUID v7
  userId: string;       // Author's user ID
  content: string;      // 1-140 characters
  createdAt: Date;      // ISO 8601 timestamp
  updatedAt: Date;      // ISO 8601 timestamp
  user: {               // Populated user object
    id: string;
    username: string;
    name: string;
  };
}
```

### Pagination Model

```typescript
interface Pagination {
  limit: number;
  offset: number;
  hasMore: boolean;
}
```

## Security Considerations

### Input Validation
- All inputs are validated using Zod schemas
- Content is sanitized to prevent XSS attacks
- SQL injection prevention via Drizzle ORM
- Rate limiting on all endpoints

### Authentication
- JWT tokens with 15-minute expiry for access tokens
- HTTP-only cookies for refresh tokens
- Secure password hashing with bcrypt
- Email/username uniqueness validation

### Data Protection
- No sensitive data in responses (password hashes never returned)
- CORS configured for production domains
- HTTPS enforcement in production
- Input sanitization for all user-generated content

## Development Guidelines

### Testing
- Unit tests for all utility functions
- Integration tests for API endpoints
- Component tests for UI elements
- E2E tests for user flows
- Target: 80% code coverage

### Environment Setup

**Required Environment Variables:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/tweeter
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
NODE_ENV=development
```

**Development Server:**
```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm run db:migrate

# Start development server
pnpm run dev
```

### Database Schema

The application uses PostgreSQL with the following schema:

```sql
-- Users table
CREATE TABLE tweeter_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tweets table
CREATE TABLE tweeter_tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES tweeter_users(id) ON DELETE CASCADE NOT NULL,
  content VARCHAR(140) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Follows table
CREATE TABLE tweeter_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES tweeter_users(id) ON DELETE CASCADE NOT NULL,
  followee_id UUID REFERENCES tweeter_users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(follower_id, followee_id)
);

-- Likes table
CREATE TABLE tweeter_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES tweeter_users(id) ON DELETE CASCADE NOT NULL,
  tweet_id UUID REFERENCES tweeter_tweets(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, tweet_id)
);
```

## Performance Considerations

### Database Optimization
- Proper indexing on foreign keys and search fields
- Pagination for large datasets
- Connection pooling with Drizzle ORM

### Caching Strategy
- Browser caching for static assets
- API response caching considerations for read-heavy endpoints
- Database query result caching for expensive operations

### Monitoring
- Response time monitoring
- Error rate tracking
- Database query performance monitoring
- Rate limit usage tracking

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations run
- [ ] Rate limits tested
- [ ] Security headers configured
- [ ] Monitoring tools integrated
- [ ] Backup strategy implemented

### CI/CD Pipeline
- Automated testing on pull requests
- Database migration validation
- Security scanning
- Performance benchmarks
- Automated deployment to staging/production

## Support

For API support, issues, or questions:
- Create an issue in the GitHub repository
- Check the troubleshooting guide in `/docs/troubleshooting.md`
- Review the development setup guide in `/docs/development.md`