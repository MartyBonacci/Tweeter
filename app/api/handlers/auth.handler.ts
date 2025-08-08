import type { ApiRequest, ApiResponse } from '../types';
import { loginUser, registerUser, generateAuthCookies } from '../../models/auth';
import { loginSchema, registerSchema } from '../../models/auth/auth.validator';
import { AppError, UnauthorizedError } from '../../utils/error.util';

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
export async function handleLogin(req: ApiRequest): Promise<ApiResponse> {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);
    
    // Attempt login
    const { user, tokens } = await loginUser(validatedData);
    
    // Generate auth cookies
    const cookies = generateAuthCookies(tokens.accessToken, tokens.refreshToken);
    
    return {
      status: 200,
      body: {
        message: 'Login successful',
        user,
        accessToken: tokens.accessToken,
      },
      cookies,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        status: 401,
        body: { error: error.message },
      };
    }
    
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        status: 400,
        body: { error: 'Invalid login data', details: error },
      };
    }
    
    console.error('Login error:', error);
    return {
      status: 500,
      body: { error: 'Failed to login' },
    };
  }
}

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function handleRegister(req: ApiRequest): Promise<ApiResponse> {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);
    
    // Register user
    const { user } = await registerUser(validatedData);
    
    return {
      status: 201,
      body: {
        message: 'Registration successful',
        user,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        status: error.statusCode || 400,
        body: { error: error.message },
      };
    }
    
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        status: 400,
        body: { error: 'Invalid registration data', details: error },
      };
    }
    
    console.error('Registration error:', error);
    return {
      status: 500,
      body: { error: 'Failed to register' },
    };
  }
}

/**
 * POST /api/auth/logout
 * Clear authentication cookies
 */
export async function handleLogout(req: ApiRequest): Promise<ApiResponse> {
  // Clear auth cookies by setting them with Max-Age=0
  const cookies = [
    'access_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
    'refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
  ];
  
  return {
    status: 200,
    body: { message: 'Logged out successfully' },
    cookies,
  };
}