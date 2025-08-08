import type { ApiRequest, MiddlewareFunction } from '../types';
import { authenticateRequest } from '../../lib/middleware/auth';
import { sanitizeInput } from '../../lib/middleware/security';

/**
 * Convert ApiRequest to a Request object for existing middleware
 */
function apiRequestToRequest(apiReq: ApiRequest): Request {
  const headers = new Headers(apiReq.headers);
  const url = new URL(apiReq.path, 'http://localhost'); // Base URL doesn't matter for our use
  
  // Add query params to URL
  apiReq.query.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  
  return new Request(url.toString(), {
    method: apiReq.method,
    headers,
    body: apiReq.body ? JSON.stringify(apiReq.body) : undefined,
  });
}

/**
 * Authentication middleware adapter
 */
export const authMiddleware: MiddlewareFunction = async (req: ApiRequest) => {
  // Convert to Request for existing auth middleware
  const request = apiRequestToRequest(req);
  const user = await authenticateRequest(request);
  
  if (!user) {
    return null; // Reject request
  }
  
  // Return request with user attached
  return {
    ...req,
    user,
  };
};

/**
 * Input sanitization middleware adapter
 */
export const sanitizeMiddleware: MiddlewareFunction = async (req: ApiRequest) => {
  // Sanitize body if present
  if (req.body && typeof req.body === 'object') {
    const sanitized = sanitizeInputObject(req.body);
    return {
      ...req,
      body: sanitized,
    };
  }
  
  return req;
};

/**
 * Recursively sanitize all string values in an object
 */
function sanitizeInputObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeInputObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeInputObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Middleware registry
 * Maps middleware names to functions
 */
export const middlewareRegistry: Record<string, MiddlewareFunction> = {
  auth: authMiddleware,
  sanitize: sanitizeMiddleware,
  // Rate limiting would be handled at the React Router adapter level
  // since it needs access to the actual request/response cycle
};

/**
 * Apply a chain of middleware to a request
 * Returns null if any middleware rejects the request
 */
export async function applyMiddlewareChain(
  middlewareNames: string[],
  request: ApiRequest
): Promise<ApiRequest | null> {
  let currentRequest = request;
  
  for (const name of middlewareNames) {
    const middleware = middlewareRegistry[name];
    if (!middleware) {
      console.warn(`Unknown middleware: ${name}`);
      continue;
    }
    
    const result = await middleware(currentRequest);
    if (!result) {
      return null; // Middleware rejected the request
    }
    
    currentRequest = result;
  }
  
  return currentRequest;
}