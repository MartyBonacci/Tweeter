import { verifyToken, extractTokenFromHeader } from "./auth.server";

export interface AuthRequest {
  user?: {
    userId: string;
    username: string;
  };
}

export async function requireAuth(request: Request) {
  const token = extractTokenFromHeader(request.headers.get('Authorization'));
  
  if (!token) {
    throw new Response(JSON.stringify({ message: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = verifyToken(token);
    return {
      userId: payload.userId,
      username: payload.username,
    };
  } catch (error) {
    throw new Response(JSON.stringify({ message: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function optionalAuth(request: Request) {
  const token = extractTokenFromHeader(request.headers.get('Authorization'));
  
  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    return {
      userId: payload.userId,
      username: payload.username,
    };
  } catch (error) {
    return null;
  }
}