import { uuidv7 } from 'uuidv7';
import { sql } from './db.service.js';
import type { Profile } from '../types/index.js';

/**
 * Create user profile
 * Pure function (side effects isolated to SQL execution)
 */
export async function createProfile(
  userId: string,
  displayName: string,
  bio: string,
  avatarUrl?: string | null
): Promise<Profile> {
  const profileId = uuidv7();

  const [profile] = await sql<Profile[]>`
    INSERT INTO profiles (id, user_id, display_name, bio, avatar_url)
    VALUES (${profileId}, ${userId}, ${displayName}, ${bio}, ${avatarUrl || null})
    RETURNING *
  `;

  return profile;
}

/**
 * Get profile by user ID
 * Pure function - returns profile or null
 */
export async function getProfileByUserId(
  userId: string
): Promise<Profile | null> {
  const [profile] = await sql<Profile[]>`
    SELECT * FROM profiles WHERE user_id = ${userId}
  `;
  return profile || null;
}

/**
 * Get profile by username (case-insensitive)
 * Joins with users table to get username
 * Pure function - returns profile with username or null
 */
export async function getProfileByUsername(
  username: string
): Promise<(Profile & { username: string }) | null> {
  const [profile] = await sql<(Profile & { username: string })[]>`
    SELECT p.*, u.username
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    WHERE LOWER(u.username) = LOWER(${username})
  `;
  return profile || null;
}

/**
 * Validate bio length (Tweeter's 141-character limit)
 * Pure function - returns boolean
 */
export function validateBio(bio: string): boolean {
  return bio.length <= 141;
}
