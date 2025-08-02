import { randomBytes } from 'crypto';

export interface CSRFToken {
  token: string;
  expiresAt: number;
}

const CSRF_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(): CSRFToken {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const expiresAt = Date.now() + CSRF_TOKEN_EXPIRY;
  
  return { token, expiresAt };
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(request: Request, expectedToken: string): boolean {
  // Check multiple sources for CSRF token
  const csrfHeader = request.headers.get('X-CSRF-Token');
  const csrfForm = getFormCSRFToken(request);
  
  const providedToken = csrfHeader || csrfForm;
  
  if (!providedToken) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return secureCompare(providedToken, expectedToken);
}

/**
 * Extract CSRF token from form data
 */
async function getFormCSRFToken(request: Request): Promise<string | null> {
  try {
    const formData = await request.clone().formData();
    return formData.get('_csrf') as string || null;
  } catch {
    return null;
  }
}

/**
 * Get CSRF token from cookies
 */
export function getCSRFTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === 'csrf_token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Set CSRF token in response headers
 */
export function setCSRFToken(response: Response, token: string): Response {
  const headers = new Headers(response.headers);
  
  headers.append('Set-Cookie', 
    `csrf_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/`
  );
  
  return new Response(response.body, { ...response, headers });
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * CSRF middleware for Remix routes
 */
export async function csrfMiddleware(
  request: Request, 
  handler: () => Promise<Response>
): Promise<Response> {
  // Skip CSRF for safe HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return handler();
  }
  
  const csrfToken = getCSRFTokenFromCookies(request);
  if (!csrfToken) {
    return new Response(
      JSON.stringify({ error: 'CSRF token missing' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  if (!validateCSRFToken(request, csrfToken)) {
    return new Response(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return handler();
}