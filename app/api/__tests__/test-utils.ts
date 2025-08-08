import type { ApiRequest, ApiResponse } from '../types';
import type { AuthUser } from '../../lib/middleware/auth';

/**
 * Create a mock ApiRequest for testing
 */
export function createMockRequest(overrides?: Partial<ApiRequest>): ApiRequest {
  return {
    method: 'GET',
    path: '/api/test',
    params: {},
    query: new URLSearchParams(),
    body: null,
    headers: {},
    ...overrides,
  };
}

/**
 * Create a mock authenticated request
 */
export function createAuthenticatedRequest(
  user: Partial<AuthUser> = {},
  overrides?: Partial<ApiRequest>
): ApiRequest {
  const defaultUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    ...user,
  };
  
  return createMockRequest({
    user: defaultUser,
    ...overrides,
  });
}

/**
 * Helper to extract response data for testing
 */
export function extractResponseData(response: ApiResponse) {
  return {
    status: response.status,
    body: response.body,
    cookies: response.cookies || [],
    headers: response.headers || {},
  };
}

/**
 * Create mock query parameters
 */
export function createQueryParams(params: Record<string, string>): URLSearchParams {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value);
  });
  return searchParams;
}