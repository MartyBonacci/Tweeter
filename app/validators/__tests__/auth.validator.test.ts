import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '../auth.validator';

describe('Auth Validators', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.parse({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should reject invalid email', () => {
      expect(() => {
        loginSchema.parse({
          email: 'invalid-email',
          password: 'password123',
        });
      }).toThrow('Invalid email address');
    });

    it('should reject empty password', () => {
      expect(() => {
        loginSchema.parse({
          email: 'test@example.com',
          password: '',
        });
      }).toThrow('Password is required');
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const result = registerSchema.parse({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123',
      });

      expect(result).toEqual({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123',
      });
    });

    it('should reject username too short', () => {
      expect(() => {
        registerSchema.parse({
          username: 'ab',
          email: 'test@example.com',
          name: 'Test User',
          password: 'Password123',
        });
      }).toThrow('Username must be at least 3 characters');
    });

    it('should reject username with invalid characters', () => {
      expect(() => {
        registerSchema.parse({
          username: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          password: 'Password123',
        });
      }).toThrow('Username can only contain letters, numbers, and underscores');
    });

    it('should reject weak password', () => {
      expect(() => {
        registerSchema.parse({
          username: 'testuser',
          email: 'test@example.com',
          name: 'Test User',
          password: 'weak',
        });
      }).toThrow('Password must be at least 8 characters');
    });

    it('should reject password without uppercase', () => {
      expect(() => {
        registerSchema.parse({
          username: 'testuser',
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        });
      }).toThrow('Password must contain at least one uppercase letter');
    });
  });
});