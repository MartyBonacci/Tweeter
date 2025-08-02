import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/tweeter_test';
process.env.SESSION_SECRET = 'test-secret-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';

// Mock database connection
vi.mock('~/lib/db/connection', () => ({
  createUser: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserByUsername: vi.fn(),
  createPost: vi.fn(),
  getPosts: vi.fn(),
  getPostById: vi.fn(),
  createComment: vi.fn(),
  getCommentsByPostId: vi.fn(),
  getUserPosts: vi.fn(),
  validatePassword: vi.fn(),
}));

// Mock auth session
vi.mock('~/lib/auth/session', () => ({
  getUserSession: vi.fn(),
  createUserSession: vi.fn(),
  destroySession: vi.fn(),
}));

// Mock JWT
vi.mock('~/lib/auth/jwt', () => ({
  verifyToken: vi.fn(),
  generateToken: vi.fn(),
}));

// Mock fetch for API tests
global.fetch = vi.fn();