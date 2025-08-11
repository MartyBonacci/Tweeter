# Database Deployment Guide

## Overview
This project uses PostgreSQL with Drizzle ORM. The database schema has been configured with clean table names (without the `tweeter_` prefix).

## Database Tables
- `users` - User accounts
- `tweets` - Tweet posts  
- `follows` - User follow relationships
- `likes` - Tweet likes

## Deployment to New Environment

### Method 1: Using the Deployment Script (Recommended)
```bash
# 1. Set your database URL in .env
DATABASE_URL=postgresql://user:password@host:port/database

# 2. Run the deployment script
npm run db:deploy
```

The script will:
- Check DATABASE_URL is configured
- Run migrations to create tables
- Optionally seed with test data

### Method 2: Manual Steps
```bash
# 1. Set your database URL
export DATABASE_URL=postgresql://user:password@host:port/database

# 2. Run migrations
npm run db:migrate

# 3. (Optional) Seed with test data
npm run db:seed
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate migration files from schema |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:push` | Push schema directly (dev only) |
| `npm run db:studio` | Open Drizzle Studio GUI |
| `npm run db:seed` | Populate with test data |
| `npm run db:deploy` | Full deployment script |

## Migration Files

The database schema is defined in:
- `drizzle/0000_medical_tarot.sql` - Initial schema with all tables

Schema definitions are in:
- `app/lib/db/schema/users.ts`
- `app/lib/db/schema/tweets.ts`
- `app/lib/db/schema/follows.ts`
- `app/lib/db/schema/likes.ts`

## Environment Variables

Required in `.env`:
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## CI/CD Integration

For automated deployments:

```yaml
# Example GitHub Actions
- name: Setup Database
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    npm install
    npm run db:migrate
```

## Troubleshooting

### Migration Errors
If migrations fail, check:
1. DATABASE_URL is correctly formatted
2. Database server is accessible
3. User has CREATE TABLE permissions

### Clean Start
To completely reset the database:
```bash
# Drop all tables (WARNING: Deletes all data!)
psql $DATABASE_URL -c "DROP TABLE IF EXISTS likes, follows, tweets, users CASCADE;"

# Re-run migrations
npm run db:migrate
```

## Notes
- The old `tweeter_` prefix has been removed from all table names
- Migrations are idempotent and safe to run multiple times
- The seed data includes sample users and tweets for testing