import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { db } from '~/lib/db/connection';
import { users } from '~/lib/db/schema';
import { hashPassword, verifyPassword } from '~/lib/auth/password';

vi.mock('~/lib/db/connection');
vi.mock('~/lib/auth/password');
vi.mock('~/lib/auth/jwt');

const mockUser = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  passwordHash: 'hashed-password',
};

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockUser]),
      });
      
      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(verifyPassword).mockResolvedValue(true);

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should throw error for invalid email', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });
      
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await expect(AuthService.login({
        email: 'invalid@example.com',
        password: 'password123',
      })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockUser]),
      });
      
      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(verifyPassword).mockResolvedValue(false);

      await expect(AuthService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });
      
      const mockInsert = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser]),
      });

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);
      vi.mocked(hashPassword).mockResolvedValue('hashed-password');

      const result = await AuthService.register({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123',
      });

      expect(result.user).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should throw error for existing username', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockUser]),
      });

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await expect(AuthService.register({
        username: 'existinguser',
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123',
      })).rejects.toThrow('Username already taken');
    });

    it('should throw error for existing email', async () => {
      const mockSelect = vi
        .fn()
        .mockReturnValueOnce({ limit: vi.fn().mockResolvedValue([]) }) // username check
        .mockReturnValueOnce({ limit: vi.fn().mockResolvedValue([mockUser]) }); // email check

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await expect(AuthService.register({
        username: 'newuser',
        email: 'existing@example.com',
        name: 'Test User',
        password: 'Password123',
      })).rejects.toThrow('Email already registered');
    });
  });
});