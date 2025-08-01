import { hash, verify } from '@node-rs/argon2';

// Argon2 configuration with adaptive cost factors
const ARGON2_CONFIG = {
  memoryCost: 2 ** 16, // 64MB
  timeCost: 3,        // 3 iterations
  parallelism: 1,     // Single thread
  outputLen: 32,      // 32 bytes hash
};

/**
 * Hash a password using Argon2id algorithm
 * @param password - Plain text password
 * @returns Hashed password with salt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashed = await hash(password, {
      ...ARGON2_CONFIG,
      algorithm: 2, // Argon2id
    });
    return hashed;
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Stored hash to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await verify(hashedPassword, password);
  } catch (error) {
    // Don't leak specific error details
    return false;
  }
}

/**
 * Validate password strength requirements
 * @param password - Password to validate
 * @returns Object with isValid flag and error messages
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be at most 128 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure random password reset token
 * @returns Base64 encoded token
 */
export function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, '');
}