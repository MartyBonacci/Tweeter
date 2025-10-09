# Tweeter
**Better than Twitter... we have 141 characters!**

This is a simple MVP with only profile, tweet and like entities.

## Built With
- Remix (React Router v7 framework mode)
- Programmatic Routes (NOT file-based routes)
- Express REST APIs
- TypeScript
- Functional Programming Structure (rather than OOP)
- Zod for validation (frontend UX + backend security)
- PostgreSQL database via Neon
- Cloudinary for profile avatar image storage
- uuidv7 for IDs
- @node-rs/argon2 for password hashing
- Tailwind CSS and Flowbite
- postgres npm package for camelCase ↔ snake_case mapping

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL and Cloudinary credentials
   ```

3. **Run database migrations:**
   ```bash
   npm run migrate
   ```

4. **Start development servers:**
   ```bash
   # Terminal 1: API server
   npm run api:dev

   # Terminal 2: Remix dev server
   npm run dev
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

## Features

✅ **User Registration & Authentication** (Feature 001)
- User registration with username/password
- User login with 30-day persistent sessions
- Profile creation with display name, bio (141 chars), and avatar
- Public profile viewing (authenticated + anonymous)

✅ **Tweet Posting & Viewing** (Feature 002)
- Compose tweets with real-time character counter (141 chars max)
- View tweets on user profiles in reverse chronological order
- Relative timestamps ("2h ago", "3d ago", "Jan 15, 2025")
- Anonymous users can view tweets

🔄 **Like Functionality** (Feature 003 - Backend Complete)
- Backend API complete (POST/DELETE/GET like endpoints)
- Frontend UI coming soon


