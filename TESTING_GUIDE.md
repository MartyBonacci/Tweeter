# Tweeter Manual Testing Guide

## 🚀 Foundation Verification Checklist

### ✅ Development Environment Status
- [x] React Router 7 configured with TypeScript
- [x] TailwindCSS styling system active
- [x] PostgreSQL database connected
- [x] Drizzle ORM configured
- [x] Argon2id password hashing ready
- [x] Development server running on http://localhost:5173

### 🎯 Quick Verification Steps

#### 1. Development Server Test
```bash
# Server should be running on:
http://localhost:5173

# You should see:
# - "Tweeter - Authentic Twitter Experience" title
# - Clean Twitter-inspired design
# - Feature roadmap displayed
```

#### 2. Database Connection Test
```bash
# Run database commands
npm run db:generate    # Should complete without errors
npm run db:migrate     # Should apply migrations successfully
npm run db:studio      # Opens Drizzle Studio for visual DB management
```

#### 3. TypeScript Verification
```bash
npm run typecheck      # Should pass without type errors
npm run lint          # Should pass linting rules
```

#### 4. Testing Framework
```bash
npm test              # Runs Vitest unit tests
npm run test:e2e      # Runs Playwright E2E tests (when available)
```

#### 5. Password Hashing Test
```bash
# Run the Argon2 verification test
npm test -- auth.test
```

### 🔧 Environment Variables Setup

Create `.env` file in project root:
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tweeter"

# Argon2 Configuration
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=1
```

### 📊 Database Schema Verification

Run these SQL commands to verify database setup:
```sql
-- Check tables exist
\dt

-- Check users table structure
\d users

-- Check sample data (after seeding)
SELECT * FROM users LIMIT 5;
SELECT * FROM tweets LIMIT 5;
```

### 🔍 Manual Testing Procedures

#### Step 1: Browser Testing
1. Open http://localhost:5173
2. Verify responsive design on mobile/desktop
3. Check console for JavaScript errors (F12 → Console)
4. Check network tab for API calls (F12 → Network)

#### Step 2: Database Testing
1. Run `npm run db:studio` to open Drizzle Studio
2. Verify all tables are created:
   - users
   - tweets
   - follows
   - likes
3. Check that UUIDv7 primary keys are working

#### Step 3: Password Hashing Test
1. Create a test script or use existing tests
2. Test password hashing with:
   - Simple password: "test123"
   - Complex password: "MyP@ssw0rd!2024"
   - Verify different hashes for same password

#### Step 4: Type Safety Test
1. Run `npm run typecheck`
2. Verify no TypeScript errors
3. Check that all imports resolve correctly

### 🚨 Troubleshooting Common Issues

#### Issue: Database connection failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Create database if missing
createdb tweeter

# Check connection string
psql $DATABASE_URL
```

#### Issue: Port 5173 already in use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 5174
```

#### Issue: Tailwind styles not applying
```bash
# Rebuild styles
npm run build
npm run dev

# Check app.css imports
# Verify @tailwind directives are present
```

### 🎉 Success Indicators

When everything is working correctly:
- [ ] Server starts without errors
- [ ] Home page loads with Twitter-style design
- [ ] Database migrations complete successfully
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Environment variables are loaded
- [ ] Tailwind styles are applied correctly

### 📋 Next Steps After Verification

1. **User Authentication**: Implement registration/login
2. **Tweet Creation**: Add 140-character tweet functionality
3. **Timeline**: Create chronological feed
4. **Follow System**: Implement follow/unfollow
5. **Like/Retweet**: Add interaction features

### 🔗 Useful Commands Summary

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate migrations
npm run db:migrate      # Apply migrations
npm run db:push         # Push schema changes
npm run db:studio       # Open Drizzle Studio

# Testing
npm run test           # Run unit tests
npm run test:e2e       # Run E2E tests
npm run typecheck      # Type checking
npm run lint          # Code linting

# Password hashing tests
npm test -- auth.test  # Test Argon2 functionality
```

### 📞 Support

If you encounter issues:
1. Check this testing guide
2. Review console logs for specific error messages
3. Verify all environment variables are set
4. Ensure PostgreSQL is running
5. Check that all dependencies are installed with `npm install`