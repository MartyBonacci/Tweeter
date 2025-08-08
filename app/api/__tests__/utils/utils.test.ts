import { describe, it, expect } from 'vitest';
import { matchRoute, extractParams, parseBody } from '../../utils';
import type { Route } from '../../types';

describe('API Utils', () => {
  describe('matchRoute', () => {
    const mockHandler = async () => ({ status: 200, body: {} });
    const routes: Route[] = [
      { method: 'GET', path: '/api/tweets', handler: mockHandler },
      { method: 'GET', path: '/api/tweets/:id', handler: mockHandler },
      { method: 'POST', path: '/api/tweets/:id/like', handler: mockHandler },
      { method: 'GET', path: '/api/users/:userId/tweets', handler: mockHandler },
    ];
    
    it('should match exact paths', () => {
      const route = matchRoute('GET', '/api/tweets', routes);
      expect(route).toBeDefined();
      expect(route?.path).toBe('/api/tweets');
    });
    
    it('should match paths with parameters', () => {
      const route = matchRoute('GET', '/api/tweets/123', routes);
      expect(route).toBeDefined();
      expect(route?.path).toBe('/api/tweets/:id');
    });
    
    it('should match nested parameters', () => {
      const route = matchRoute('GET', '/api/users/456/tweets', routes);
      expect(route).toBeDefined();
      expect(route?.path).toBe('/api/users/:userId/tweets');
    });
    
    it('should respect HTTP methods', () => {
      const route = matchRoute('POST', '/api/tweets', routes);
      expect(route).toBeNull();
    });
    
    it('should return null for non-existent routes', () => {
      const route = matchRoute('GET', '/api/nonexistent', routes);
      expect(route).toBeNull();
    });
  });
  
  describe('extractParams', () => {
    it('should extract single parameter', () => {
      const params = extractParams('/api/tweets/:id', '/api/tweets/123');
      expect(params).toEqual({ id: '123' });
    });
    
    it('should extract multiple parameters', () => {
      const params = extractParams(
        '/api/users/:userId/tweets/:tweetId',
        '/api/users/456/tweets/789'
      );
      expect(params).toEqual({ userId: '456', tweetId: '789' });
    });
    
    it('should return empty object for paths without parameters', () => {
      const params = extractParams('/api/tweets', '/api/tweets');
      expect(params).toEqual({});
    });
    
    it('should handle special characters in parameter values', () => {
      const params = extractParams(
        '/api/users/:username',
        '/api/users/john_doe-123'
      );
      expect(params).toEqual({ username: 'john_doe-123' });
    });
  });
  
  describe('parseBody', () => {
    it('should parse JSON body', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      });
      
      const body = await parseBody(request);
      expect(body).toEqual({ test: 'data' });
    });
    
    it('should parse form data', async () => {
      const formData = new FormData();
      formData.append('field1', 'value1');
      formData.append('field2', 'value2');
      
      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });
      
      const body = await parseBody(request);
      expect(body).toEqual({ field1: 'value1', field2: 'value2' });
    });
    
    it('should parse text body', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'plain text',
      });
      
      const body = await parseBody(request);
      expect(body).toBe('plain text');
    });
    
    it('should return null for invalid JSON', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });
      
      const body = await parseBody(request);
      expect(body).toBeNull();
    });
  });
});