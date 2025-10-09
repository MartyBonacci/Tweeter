import { hash, verify } from '@node-rs/argon2';
import { uuidv7 } from 'uuidv7';
import { sql } from './db.service.js';
import type { User } from '../types/index.js';

/**
 * Hash password using argon2
 * Pure function - returns hash string
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

/**
 * Verify password against hash using argon2
 * Pure function - returns boolean
 */
export async function verifyPassword(
  passwordHash: string,
  password: string
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/**
 * Generate unique user ID using uuidv7
 * Pure function - returns UUID string
 */
export function generateUserId(): string {
  return uuidv7();
}

/**
 * Get user by username (case-insensitive)
 * Returns user or null if not found
 */
export async function getUserByUsername(
  username: string
): Promise<User | null> {
  const [user] = await sql<User[]>`
    SELECT id, username, email, password_hash, created_at, updated_at
    FROM users
    WHERE LOWER(username) = LOWER(${username})
  `;
  return user || null;
}

/**
 * Get user by email (case-insensitive)
 * Returns user or null if not found
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await sql<User[]>`
    SELECT id, username, email, password_hash, created_at, updated_at
    FROM users
    WHERE LOWER(email) = LOWER(${email})
  `;
  return user || null;
}
