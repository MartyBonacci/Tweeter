# Testing Guide - Tweeter Project

## Quick Start Testing

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb tweeter

# Copy environment template
cp .env.example .env

# Edit .env with your database connection
DATABASE_URL=postgresql://username:password@localhost:5432/tweeter
JWT_SECRET=your-super-secret-key-here
```

### 2. Apply Database Schema
```bash
# Generate and apply migrations
npm run db:push

# Verify database tables
npm run db:studio
```

### 3. Start Development Server
```bash
# Start the server
npm run dev

# Server will be available at: http://localhost:5173
```

## API Endpoint Testing

### Registration Endpoint
**Endpoint**: `POST http://localhost:5173/api/auth/register`

**Test with curl:**
```bash
# Successful registration
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser1&email=test1@example.com&password=TestPass123&displayName=Test User"

# Expected response:
# {
#   "user": {
#     "id": "uuid-string",
#     "username": "testuser1",
#     "email": "test1@example.com",
#     "displayName": "Test User"
#   },
#   "token": "jwt-token-string"
# }
```

**Test invalid data:**
```bash
# Weak password
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser2&email=test2@example.com&password=weak"

# Expected response:
# {
#   "errors": [
#     {"field": "password", "message": "Password must be at least 8 characters long"}
#   ]
# }
```

### Login Endpoint
**Endpoint**: `POST http://localhost:5173/api/auth/login`

**Test with curl:**
```bash
# Successful login
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser1&password=TestPass123"

# Expected response:
# {
#   "user": {
#     "id": "uuid-string",
#     "username": "testuser1",
#     "email": "test1@example.com",
#     "displayName": "Test User",
#     "avatarUrl": null,
#     "bio": null
#   },
#   "token": "jwt-token-string"
# }
```

**Test invalid credentials:**
```bash
# Wrong password
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser1&password=wrongpass"

# Expected response:
# {"message": "Invalid credentials"}
```

## Database Verification

### Check Users Table
```bash
# Connect to database
psql -U username -d tweeter -c "SELECT id, username, email, display_name FROM users;"

# Or use pgAdmin/DBeaver to verify:
# - users table exists with correct columns
# - Passwords are hashed (not plain text)
# - UUIDv7 primary keys are used
```

### Verify Schema
```bash
# Check all tables exist
psql -U username -d tweeter -c "\dt"

# Expected tables:
# - users
# - tweets
# - follows
# - likes
```

## Frontend Testing

### Basic Homepage
1. Visit `http://localhost:5173/`
2. You should see "Welcome to Tweeter" page
3. Verify no console errors

### Manual Form Testing (when forms are added)
1. Navigate to registration form
2. Test with valid/invalid data
3. Check error messages display correctly
4. Verify successful registration redirects appropriately

## JWT Token Testing

### Decode Token
1. Copy token from registration/login response
2. Paste into https://jwt.io/
3. Verify payload contains:
   - `userId` (UUIDv7)
   - `username` (string)
   - `exp` (24h from creation)

### Test Protected Route (when implemented)
```bash
# Test auth middleware
curl -X GET http://localhost:5173/api/protected \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Scripts

### Create test users
```bash
#!/bin/bash
# save as test-users.sh

echo "Creating test users..."

# User 1
curl -s -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=alice&email=alice@example.com&password=AlicePass123&displayName=Alice"

# User 2  
curl -s -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=bob&email=bob@example.com&password=BobPass123&displayName=Bob"

echo "Test users created!"
```

### Test login flow
```bash
#!/bin/bash
# save as test-login.sh

echo "Testing login..."

# Login with alice
token=$(curl -s -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=alice&password=AlicePass123" | jq -r '.token')

echo "Alice's token: $token"
```

## Troubleshooting

### Common Issues
1. **Database connection error**: Check DATABASE_URL in .env
2. **Port already in use**: Change port or kill process using `lsof -ti:5173 | xargs kill`
3. **Missing dependencies**: Run `npm install`
4. **Type errors**: Run `npm run typecheck`

### Debug Database
```bash
# Check if database exists
psql -l | grep tweeter

# Check table structure
psql -d tweeter -c "\d users"

# Check data
psql -d tweeter -c "SELECT * FROM users LIMIT 5;"
```

### Debug API
```bash
# Check server logs
npm run dev

# Test with verbose curl
curl -v http://localhost:5173/api/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test&email=test@example.com&password=TestPass123"
```