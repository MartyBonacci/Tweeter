import type { LoaderFunctionArgs, ActionFunctionArgs } from '@react-router/node';
import { apiRoutes } from '~/api/router';
import { matchRoute, extractParams, normalizeRequest } from '~/api/utils';
import { applyMiddlewareChain } from '~/api/middleware';
import { sanitizeInput } from '~/lib/middleware/security';
import type { ApiRequest, ApiResponse } from '~/api/types';

/**
 * Handle GET requests
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  return handleRequest('GET', request, params);
}

/**
 * Handle POST, PUT, DELETE requests
 */
export async function action({ request, params }: ActionFunctionArgs) {
  return handleRequest(request.method, request, params);
}

/**
 * Main request handler
 * Converts React Router requests to our framework-agnostic format
 */
async function handleRequest(
  method: string,
  request: Request,
  routeParams: any
): Promise<Response> {
  const url = new URL(request.url);
  
  // Find matching route
  const route = matchRoute(method, url.pathname, apiRoutes);
  
  if (!route) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  
  try {
    // Extract path parameters
    const pathParams = extractParams(route.path, url.pathname);
    
    // Create normalized request
    let apiRequest: ApiRequest = await normalizeRequest(request, pathParams);
    
    // Apply sanitization to body if present
    if (apiRequest.body && typeof apiRequest.body === 'object') {
      apiRequest.body = sanitizeRequestBody(apiRequest.body);
    }
    
    // Apply middleware chain
    if (route.middleware && route.middleware.length > 0) {
      const result = await applyMiddlewareChain(route.middleware, apiRequest);
      
      if (!result) {
        // Middleware rejected the request
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      apiRequest = result;
    }
    
    // Call the handler
    const response: ApiResponse = await route.handler(apiRequest);
    
    // Convert ApiResponse to React Router Response
    return createReactRouterResponse(response);
    
  } catch (error) {
    console.error('API handler error:', error);
    
    // Handle validation errors specially
    if (error instanceof Error && error.name === 'ZodError') {
      return Response.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Sanitize request body recursively
 */
function sanitizeRequestBody(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeRequestBody(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeRequestBody(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Convert our ApiResponse to a React Router Response
 */
function createReactRouterResponse(apiResponse: ApiResponse): Response {
  const headers: HeadersInit = {};
  
  // Add any headers from the API response
  if (apiResponse.headers) {
    Object.entries(apiResponse.headers).forEach(([key, value]) => {
      headers[key] = value;
    });
  }
  
  // Add cookies if present
  if (apiResponse.cookies && apiResponse.cookies.length > 0) {
    // Create response with cookies
    const response = Response.json(apiResponse.body, {
      status: apiResponse.status,
      headers,
    });
    
    // Add cookies
    apiResponse.cookies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });
    
    return response;
  }
  
  // Standard JSON response
  return Response.json(apiResponse.body, {
    status: apiResponse.status,
    headers,
  });
}