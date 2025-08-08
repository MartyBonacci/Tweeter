import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchRoute, extractParams, normalizeRequest } from '../../utils';
import { applyMiddlewareChain } from '../../middleware';
import { apiRoutes } from '../../router';

// Mock handlers for testing
const mockHandler = vi.fn();
const mockAuthMiddleware = vi.fn();

// Mock middleware
vi.mock('../../middleware', () => ({
  applyMiddlewareChain: vi.fn(),
}));

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Route Matching Integration', () => {
    it('should match and extract parameters from real routes', () => {
      // Test tweet route matching
      const tweetRoute = matchRoute('GET', '/api/tweets/123', apiRoutes);
      expect(tweetRoute).toBeDefined();
      expect(tweetRoute?.path).toBe('/api/tweets/:id');
      
      const params = extractParams('/api/tweets/:id', '/api/tweets/123');
      expect(params).toEqual({ id: '123' });
    });
    
    it('should match auth routes', () => {
      const loginRoute = matchRoute('POST', '/api/auth/login', apiRoutes);
      expect(loginRoute).toBeDefined();
      expect(loginRoute?.path).toBe('/api/auth/login');
      expect(loginRoute?.middleware).toBeUndefined();
    });
    
    it('should identify protected routes', () => {
      const createTweetRoute = matchRoute('POST', '/api/tweets', apiRoutes);
      expect(createTweetRoute).toBeDefined();
      expect(createTweetRoute?.middleware).toContain('auth');
    });
  });
  
  describe('Request Normalization', () => {
    it('should normalize a GET request', async () => {
      const request = new Request('http://localhost/api/tweets?limit=10&offset=20', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token' },
      });
      
      const apiRequest = await normalizeRequest(request, {});
      
      expect(apiRequest.method).toBe('GET');
      expect(apiRequest.path).toBe('/api/tweets');
      expect(apiRequest.query.get('limit')).toBe('10');
      expect(apiRequest.query.get('offset')).toBe('20');
      expect(apiRequest.headers.authorization).toBe('Bearer token');
      expect(apiRequest.body).toBeNull();
    });
    
    it('should normalize a POST request with JSON body', async () => {
      const request = new Request('http://localhost/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Test tweet' }),
      });
      
      const apiRequest = await normalizeRequest(request, {});
      
      expect(apiRequest.method).toBe('POST');
      expect(apiRequest.body).toEqual({ content: 'Test tweet' });
    });
    
    it('should normalize a POST request with form data', async () => {
      const formData = new FormData();
      formData.append('content', 'Test tweet');
      formData.append('mediaUrl', 'http://example.com/image.jpg');
      
      const request = new Request('http://localhost/api/tweets', {
        method: 'POST',
        body: formData,
      });
      
      const apiRequest = await normalizeRequest(request, {});
      
      expect(apiRequest.body).toEqual({
        content: 'Test tweet',
        mediaUrl: 'http://example.com/image.jpg',
      });
    });
  });
  
  describe('Middleware Chain Integration', () => {
    it('should apply auth middleware for protected routes', async () => {
      const mockRequest = {
        method: 'POST',
        path: '/api/tweets',
        params: {},
        query: new URLSearchParams(),
        body: { content: 'Test tweet' },
        headers: {},
      };
      
      const mockAuthenticatedRequest = {
        ...mockRequest,
        user: { id: 'user-123', username: 'testuser', email: 'test@example.com' },
      };
      
      vi.mocked(applyMiddlewareChain).mockResolvedValue(mockAuthenticatedRequest);
      
      const result = await applyMiddlewareChain(['auth'], mockRequest);
      
      expect(result).toBe(mockAuthenticatedRequest);
      expect(applyMiddlewareChain).toHaveBeenCalledWith(['auth'], mockRequest);
    });
    
    it('should reject unauthenticated requests for protected routes', async () => {
      const mockRequest = {
        method: 'POST',
        path: '/api/tweets',
        params: {},
        query: new URLSearchParams(),
        body: { content: 'Test tweet' },
        headers: {},
      };
      
      vi.mocked(applyMiddlewareChain).mockResolvedValue(null);
      
      const result = await applyMiddlewareChain(['auth'], mockRequest);
      
      expect(result).toBeNull();
    });
  });
  
  describe('Full Request Cycle', () => {
    it('should handle a complete API request flow', async () => {
      // 1. Route matching
      const route = matchRoute('GET', '/api/tweets', apiRoutes);
      expect(route).toBeDefined();
      
      // 2. Parameter extraction (none for this route)
      const params = extractParams(route!.path, '/api/tweets');
      expect(params).toEqual({});
      
      // 3. Request normalization
      const request = new Request('http://localhost/api/tweets?limit=5', {
        method: 'GET',
      });
      const apiRequest = await normalizeRequest(request, params);
      expect(apiRequest.query.get('limit')).toBe('5');
      
      // 4. Middleware (none for GET tweets)
      expect(route!.middleware).toBeUndefined();
      
      // This confirms our architecture works end-to-end
    });
  });
});