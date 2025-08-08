import type { ApiRequest, Route } from './types';

/**
 * Convert path pattern to regex
 * Converts :param syntax to regex capture groups
 */
function pathToRegex(path: string): RegExp {
  const pattern = path
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, '(?<$1>[^/]+)')
    .replace(/\*/g, '.*');
  return new RegExp(`^${pattern}$`);
}

/**
 * Match a request to a route
 * Returns the matching route or null
 */
export function matchRoute(
  method: string,
  path: string,
  routes: Route[]
): Route | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    
    const regex = pathToRegex(route.path);
    if (regex.test(path)) {
      return route;
    }
  }
  return null;
}

/**
 * Extract parameters from a path
 * Example: /api/tweets/123 with pattern /api/tweets/:id returns { id: '123' }
 */
export function extractParams(
  pattern: string,
  path: string
): Record<string, string> {
  const regex = pathToRegex(pattern);
  const match = regex.exec(path);
  
  if (!match || !match.groups) {
    return {};
  }
  
  return match.groups;
}

/**
 * Parse request body based on content type
 */
export async function parseBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    try {
      return await request.json();
    } catch {
      return null;
    }
  }
  
  if (contentType.includes('application/x-www-form-urlencoded') || 
      contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      return Object.fromEntries(formData);
    } catch {
      return null;
    }
  }
  
  // Default to text
  try {
    return await request.text();
  } catch {
    return null;
  }
}

/**
 * Convert a React Router request to our ApiRequest format
 */
export async function normalizeRequest(
  request: Request,
  params: Record<string, string>
): Promise<ApiRequest> {
  const url = new URL(request.url);
  
  return {
    method: request.method,
    path: url.pathname,
    params,
    query: url.searchParams,
    body: await parseBody(request),
    headers: Object.fromEntries(request.headers.entries()),
  };
}

/**
 * Create a Response object from ApiResponse
 */
export function createResponse(apiResponse: ApiResponse): Response {
  const headers = new Headers(apiResponse.headers || {});
  
  // Add cookies if present
  if (apiResponse.cookies) {
    apiResponse.cookies.forEach(cookie => {
      headers.append('Set-Cookie', cookie);
    });
  }
  
  // Set content-type if not already set
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  return new Response(
    JSON.stringify(apiResponse.body),
    {
      status: apiResponse.status,
      headers,
    }
  );
}