# Tweeter API Testing Guide

## Quick Start Testing

### Using curl

#### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "name": "Test User",
    "password": "TestPass123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

#### Create a tweet (with authentication)
```bash
curl -X POST http://localhost:3000/api/tweets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "content": "Hello from API testing! This is my first tweet."
  }'
```

### Using Postman

#### Environment Setup
1. Create a new collection: "Tweeter API"
2. Set base URL: `http://localhost:3000`
3. Create environment variables:
   - `base_url`: `http://localhost:3000`
   - `access_token`: (will be populated after login)

#### Collection Structure
```
Tweeter API/
├── Authentication/
│   ├── Register User
│   ├── Login User
│   └── Logout User
├── Users/
│   ├── Get All Users
│   ├── Get User Profile
│   ├── Update User Profile
│   ├── Follow User
│   └── Unfollow User
├── Tweets/
│   ├── Get All Tweets
│   ├── Create Tweet
│   ├── Get Tweet
│   ├── Update Tweet
│   └── Delete Tweet
└── Likes/
    ├── Like Tweet
    └── Unlike Tweet
```

## Test Scenarios

### Authentication Flow
1. **Valid Registration**
   - POST /api/auth/register with valid data
   - Expected: 201 Created with user object

2. **Duplicate Username/Email**
   - POST /api/auth/register with existing username/email
   - Expected: 400 Bad Request with error message

3. **Valid Login**
   - POST /api/auth/login with correct credentials
   - Expected: 200 OK with access token

4. **Invalid Login**
   - POST /api/auth/login with wrong credentials
   - Expected: 401 Unauthorized

### User Operations
1. **Get User Profile**
   - GET /api/users/{userId}
   - Expected: 200 OK with user data

2. **Update Profile**
   - PUT /api/users/{userId} with auth token
   - Expected: 200 OK with updated user data

3. **Follow/Unfollow**
   - POST /api/users/{userId}/follow
   - DELETE /api/users/{userId}/follow
   - Expected: 201/200 with success message

### Tweet Operations
1. **Create Tweet**
   - POST /api/tweets with auth token
   - Content: 1-140 characters
   - Expected: 201 Created with tweet data

2. **List Tweets**
   - GET /api/tweets with optional pagination
   - Expected: 200 OK with tweet list and pagination info

3. **Update Tweet**
   - PUT /api/tweets/{tweetId} with auth token
   - Must be tweet author
   - Expected: 200 OK with updated tweet

4. **Delete Tweet**
   - DELETE /api/tweets/{tweetId} with auth token
   - Must be tweet author
   - Expected: 200 OK with success message

### Like Operations
1. **Like Tweet**
   - POST /api/tweets/{tweetId}/like with auth token
   - Expected: 201 Created with success message

2. **Unlike Tweet**
   - DELETE /api/tweets/{tweetId}/like with auth token
   - Expected: 200 OK with success message

## Testing Script

Create a file `test-api.js`:

```javascript
const API_BASE = 'http://localhost:3000';

async function registerUser() {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'apitestuser',
      email: 'apitest@example.com',
      name: 'API Test User',
      password: 'TestPass123'
    })
  });
  return response.json();
}

async function loginUser() {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'apitest@example.com',
      password: 'TestPass123'
    })
  });
  return response.json();
}

async function createTweet(token, content) {
  const response = await fetch(`${API_BASE}/api/tweets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });
  return response.json();
}

// Run tests
async function runTests() {
  console.log('1. Registering user...');
  const registerResult = await registerUser();
  console.log('Registration:', registerResult);

  console.log('2. Logging in...');
  const loginResult = await loginUser();
  console.log('Login:', loginResult);

  if (loginResult.accessToken) {
    console.log('3. Creating tweet...');
    const tweetResult = await createTweet(
      loginResult.accessToken,
      'This is a test tweet from our API testing script!'
    );
    console.log('Tweet:', tweetResult);
  }
}

runTests().catch(console.error);
```

Run the test script:
```bash
node test-api.js
```

## Load Testing

### Using Apache Bench
```bash
# Test tweet creation endpoint
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  -p tweet-payload.json -T application/json \
  http://localhost:3000/api/tweets

# Test tweet listing endpoint
ab -n 1000 -c 50 http://localhost:3000/api/tweets
```

### Using Artillery
Create `load-test.yml`:

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: "Bearer YOUR_ACCESS_TOKEN"

scenarios:
  - name: "Create tweets"
    flow:
      - post:
          url: "/api/tweets"
          json:
            content: "Load test tweet {{ $randomInt() }}"
      - think: 1

  - name: "List tweets"
    weight: 3
    flow:
      - get:
          url: "/api/tweets"
      - think: 2
```

Run load test:
```bash
npm install -g artillery
artillery run load-test.yml
```

## Error Testing

### Validation Errors
```bash
# Test username too short
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ab","email":"test@example.com","name":"Test","password":"Test123"}'

# Test email invalid format
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"invalid-email","name":"Test","password":"Test123"}'

# Test tweet too long
curl -X POST http://localhost:3000/api/tweets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content":"This tweet is way too long and exceeds the 140 character limit that we have implemented for all tweets in our platform..."}'
```

### Authentication Errors
```bash
# Test unauthorized access
curl -X POST http://localhost:3000/api/tweets \
  -H "Content-Type: application/json" \
  -d '{"content":"Should fail without auth"}'

# Test invalid token
curl -X POST http://localhost:3000/api/tweets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"content":"Should fail with invalid token"}'
```

## Integration Testing

### Using Jest/Supertest
Create `tests/api.test.js`:

```javascript
const request = require('supertest');
const app = require('../app/server');

describe('API Integration Tests', () => {
  let authToken;
  let userId;
  let tweetId;

  test('POST /api/auth/register', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser' + Date.now(),
        email: `test${Date.now()}@example.com`,
        name: 'Test User',
        password: 'TestPass123'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.user).toHaveProperty('id');
    userId = response.body.user.id;
  });

  test('POST /api/auth/login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'TestPass123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    authToken = response.body.accessToken;
  });

  test('POST /api/tweets', async () => {
    const response = await request(app)
      .post('/api/tweets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Integration test tweet'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.tweet).toHaveProperty('id');
    tweetId = response.body.tweet.id;
  });

  test('GET /api/tweets', async () => {
    const response = await request(app)
      .get('/api/tweets')
      .query({ limit: 10 });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tweets');
    expect(Array.isArray(response.body.tweets)).toBe(true);
  });
});
```

## Monitoring and Debugging

### Enable Debug Logging
```bash
# Set debug environment variable
DEBUG=tweeter:* npm run dev
```

### Check Server Logs
```bash
# View logs in development
tail -f logs/api.log

# Check error logs
grep ERROR logs/api.log
```

### Health Check Endpoint
```bash
# Basic health check
curl http://localhost:3000/health

# Database connection check
curl http://localhost:3000/health/db
```

## Troubleshooting

### Common Issues
1. **CORS errors**: Ensure frontend is running on allowed origin
2. **Rate limiting**: Check rate limit headers in response
3. **Token expiry**: Implement token refresh logic
4. **Database connection**: Verify DATABASE_URL configuration
5. **Validation errors**: Check request payload format

### Debug Commands
```bash
# Check server status
curl -I http://localhost:3000

# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check rate limit headers
curl -v http://localhost:3000/api/tweets
```