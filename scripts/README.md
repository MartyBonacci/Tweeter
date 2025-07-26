# Database Setup Instructions

## Quick Setup

### 1. Set up PostgreSQL locally
```bash
# On macOS with Homebrew
brew install postgresql
brew services start postgresql

# On Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
createdb tweeter
```

### 2. Configure environment variables
Create a `.env` file in the root directory:

```bash
DATABASE_URL=postgresql://localhost:5432/tweeter
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Run database setup
```bash
# Push schema to database
npm run db:push

# Seed with test data
npm run seed
```

### 4. Test the seed data
After seeding, you can test with these credentials:
- **johndoe** / password123
- **janedoe** / password123  
- **techguru** / password123
- **foodie** / password123
- **travelbug** / password123

## Reset Database
```bash
# Reset and reseed
npm run seed:reset
```

## Verify Setup
```bash
# Check database tables
npm run db:studio
```

This will open Drizzle Studio at http://localhost:4983 where you can browse your data.