import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLogin, handleRegister, handleLogout } from '../../handlers/auth.handler';
import { createMockRequest } from '../test-utils';
import { UnauthorizedError, AppError } from '../../../utils/error.util';

// Mock the auth model
vi.mock('../../../models/auth', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  generateAuthCookies: vi.fn(),
}));

import * as authModel from '../../../models/auth';

describe('Auth Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('handleLogin', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
      };
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      
      vi.mocked(authModel.loginUser).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });
      vi.mocked(authModel.generateAuthCookies).mockReturnValue([
        'access_token=access-token; HttpOnly',
        'refresh_token=refresh-token; HttpOnly',
      ]);
      
      const request = createMockRequest({
        method: 'POST',
        path: '/api/auth/login',
        body: {
          username: 'testuser',
          password: 'password123',
        },
      });
      
      const response = await handleLogin(request);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Login successful',
        user: mockUser,
        accessToken: 'access-token',
      });
      expect(response.cookies).toHaveLength(2);
      expect(authModel.loginUser).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
    
    it('should return 401 for invalid credentials', async () => {
      vi.mocked(authModel.loginUser).mockRejectedValue(
        new UnauthorizedError('Invalid credentials')
      );
      
      const request = createMockRequest({
        method: 'POST',
        path: '/api/auth/login',
        body: {
          username: 'testuser',
          password: 'wrongpassword',
        },
      });
      
      const response = await handleLogin(request);
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });
    
    it('should return 400 for invalid input data', async () => {
      const request = createMockRequest({
        method: 'POST',
        path: '/api/auth/login',
        body: {
          username: '', // Empty username should fail validation
          password: 'password123',
        },
      });
      
      const response = await handleLogin(request);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(authModel.loginUser).not.toHaveBeenCalled();
    });
  });
  
  describe('handleRegister', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'newuser',
        email: 'new@example.com',
        name: 'New User',
      };
      
      vi.mocked(authModel.registerUser).mockResolvedValue({ user: mockUser });
      
      const request = createMockRequest({
        method: 'POST',
        path: '/api/auth/register',
        body: {
          username: 'newuser',
          email: 'new@example.com',
          name: 'New User',
          password: 'SecurePass123',
        },
      });
      
      const response = await handleRegister(request);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Registration successful',
        user: mockUser,
      });
      expect(authModel.registerUser).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        name: 'New User',
        password: 'SecurePass123',
      });
    });
    
    it('should return 400 for duplicate username', async () => {
      vi.mocked(authModel.registerUser).mockRejectedValue(
        new AppError('Username already taken', 400)
      );
      
      const request = createMockRequest({
        method: 'POST',
        path: '/api/auth/register',
        body: {
          username: 'existinguser',
          email: 'new@example.com',
          name: 'New User',
          password: 'SecurePass123',
        },
      });
      
      const response = await handleRegister(request);
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Username already taken' });
    });
    
    it('should return 400 for invalid registration data', async () => {
      const request = createMockRequest({
        method: 'POST',
        path: '/api/auth/register',
        body: {
          username: 'nu', // Too short
          email: 'invalid-email', // Invalid email
          name: 'New User',
          password: 'weak', // Too weak
        },
      });
      
      const response = await handleRegister(request);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(authModel.registerUser).not.toHaveBeenCalled();
    });
  });
  
  describe('handleLogout', () => {
    it('should clear auth cookies', async () => {
      const request = createMockRequest({
        method: 'POST',
        path: '/api/auth/logout',
      });
      
      const response = await handleLogout(request);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Logged out successfully' });
      expect(response.cookies).toEqual([
        'access_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
        'refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
      ]);
    });
  });
});