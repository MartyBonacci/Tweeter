import type { AuthUser } from '../lib/middleware/auth';

/**
 * Framework-agnostic request object
 * This can be created from any HTTP framework (React Router, Express, etc.)
 */
export interface ApiRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
  user?: AuthUser;
  context?: Record<string, any>;
}

/**
 * Framework-agnostic response object
 * This can be converted to any HTTP framework response
 */
export interface ApiResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
  cookies?: string[];
}

/**
 * Route handler function type
 * Pure function that takes a request and returns a response
 */
export type RouteHandler = (req: ApiRequest) => Promise<ApiResponse>;

/**
 * Middleware function type
 * Returns modified request or null to reject
 */
export type MiddlewareFunction = (req: ApiRequest) => Promise<ApiRequest | null>;

/**
 * Route definition
 */
export interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
  middleware?: string[];
}

/**
 * Error response helper type
 */
export interface ApiError {
  error: string;
  details?: unknown;
  statusCode?: number;
}