import type { Route } from './types';
import * as tweetHandlers from './handlers/tweets.handler';
import * as authHandlers from './handlers/auth.handler';
import * as userHandlers from './handlers/users.handler';
import * as timelineHandlers from './handlers/timeline.handler';

/**
 * API Route Registry
 * All API routes are defined here in a framework-agnostic way
 * This makes it easy to port to Express, Fastify, or any other framework
 */
export const apiRoutes: Route[] = [
  // Tweet routes
  { method: 'GET', path: '/api/tweets', handler: tweetHandlers.handleGetTweets },
  { method: 'POST', path: '/api/tweets', handler: tweetHandlers.handleCreateTweet, middleware: ['auth'] },
  { method: 'GET', path: '/api/tweets/:id', handler: tweetHandlers.handleGetTweetById },
  { method: 'PUT', path: '/api/tweets/:id', handler: tweetHandlers.handleUpdateTweet, middleware: ['auth'] },
  { method: 'DELETE', path: '/api/tweets/:id', handler: tweetHandlers.handleDeleteTweet, middleware: ['auth'] },
  { method: 'POST', path: '/api/tweets/:id/like', handler: tweetHandlers.handleLikeTweet, middleware: ['auth'] },
  
  // Auth routes
  { method: 'POST', path: '/api/auth/login', handler: authHandlers.handleLogin },
  { method: 'POST', path: '/api/auth/register', handler: authHandlers.handleRegister },
  { method: 'POST', path: '/api/auth/logout', handler: authHandlers.handleLogout, middleware: ['auth'] },
  
  // User routes
  { method: 'GET', path: '/api/users', handler: userHandlers.handleGetUsers },
  { method: 'GET', path: '/api/users/:id/tweets', handler: userHandlers.handleGetUserTweets },
  { method: 'POST', path: '/api/users/:id/follow', handler: userHandlers.handleFollowUser, middleware: ['auth'] },
  
  // Timeline
  { method: 'GET', path: '/api/timeline', handler: timelineHandlers.handleGetTimeline, middleware: ['auth'] },
];

/**
 * Helper function to find all routes matching a specific path prefix
 * Useful for debugging and documentation
 */
export function getRoutesByPrefix(prefix: string): Route[] {
  return apiRoutes.filter(route => route.path.startsWith(prefix));
}

/**
 * Helper function to find all routes requiring authentication
 */
export function getProtectedRoutes(): Route[] {
  return apiRoutes.filter(route => route.middleware?.includes('auth'));
}