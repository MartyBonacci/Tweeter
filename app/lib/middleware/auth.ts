import { verifyToken } from '../auth/jwt';
import { db } from '../db/connection';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export async function authenticateRequest(request: Request): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : getCookieValue(request, 'access_token');

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    
    // Verify user still exists
    const user = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    
    if (user.length === 0) {
      return null;
    }

    return {
      id: user[0].id,
      email: user[0].email,
      username: user[0].username,
    };
  } catch (error) {
    return null;
  }
}

export function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<Response>) {
  return async (request: Request) => {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authRequest = request as AuthenticatedRequest;
    authRequest.user = user;
    
    return handler(authRequest);
  };
}

export function optionalAuth(handler: (request: AuthenticatedRequest) => Promise<Response>) {
  return async (request: Request) => {
    const user = await authenticateRequest(request);
    
    const authRequest = request as AuthenticatedRequest;
    authRequest.user = user || undefined;
    
    return handler(authRequest);
  };
}