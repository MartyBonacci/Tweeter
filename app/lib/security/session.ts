import { createId } from 'uuidv7';

export interface SessionData {
  userId: string;
  username: string;
  email: string;
  csrfToken: string;
  createdAt: number;
  lastActivity: number;
  ip: string;
  userAgent: string;
}

export interface SessionConfig {
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
}

const SESSION_CONFIG: SessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict',
};

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
const MAX_CONCURRENT_SESSIONS = 5;

// In-memory session store (use Redis or database in production)
const sessionStore = new Map<string, SessionData>();

/**
 * Create a new session
 */
export async function createSession(
  userData: Omit<SessionData, 'csrfToken' | 'createdAt' | 'lastActivity'>
): Promise<string> {
  const sessionId = createId();
  const csrfToken = createId();
  
  const sessionData: SessionData = {
    ...userData,
    csrfToken,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
  
  // Check concurrent sessions limit
  const userSessions = Array.from(sessionStore.entries())
    .filter(([, data]) => data.userId === userData.userId);
  
  if (userSessions.length >= MAX_CONCURRENT_SESSIONS) {
    // Remove oldest session
    const oldestSession = userSessions
      .sort(([, a], [, b]) => a.lastActivity - b.lastActivity)[0];
    
    if (oldestSession) {
      sessionStore.delete(oldestSession[0]);
    }
  }
  
  sessionStore.set(sessionId, sessionData);
  
  return sessionId;
}

/**
 * Get session data by session ID
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Check if session has expired
  if (Date.now() - session.createdAt > SESSION_CONFIG.maxAge) {
    sessionStore.delete(sessionId);
    return null;
  }
  
  // Check for inactivity timeout
  if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
    sessionStore.delete(sessionId);
    return null;
  }
  
  // Update last activity
  session.lastActivity = Date.now();
  
  return session;
}

/**
 * Destroy a session
 */
export async function destroySession(sessionId: string): Promise<void> {
  sessionStore.delete(sessionId);
}

/**
 * Destroy all sessions for a user
 */
export async function destroyUserSessions(userId: string): Promise<void> {
  for (const [sessionId, session] of Array.from(sessionStore.entries())) {
    if (session.userId === userId) {
      sessionStore.delete(sessionId);
    }
  }
}

/**
 * Refresh session (extend lifetime)
 */
export async function refreshSession(sessionId: string): Promise<string | null> {
  const session = await getSession(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Create new session with same data
  const newSessionId = createId();
  const newSessionData: SessionData = {
    ...session,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    csrfToken: createId(), // Generate new CSRF token
  };
  
  sessionStore.set(newSessionId, newSessionData);
  sessionStore.delete(sessionId);
  
  return newSessionId;
}

/**
 * Generate secure session ID
 */
export function generateSessionId(): string {
  return createId();
}

/**
 * Get session from request cookies
 */
export async function getSessionFromRequest(request: Request): Promise<SessionData | null> {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  let sessionId: string | null = null;

  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === 'session_id') {
      sessionId = decodeURIComponent(value);
      break;
    }
  }

  if (!sessionId) return null;

  return await getSession(sessionId);
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(response: Response, sessionId: string): Response {
  const headers = new Headers(response.headers);
  
  const cookieOptions = [
    `session_id=${sessionId}`,
    `HttpOnly`,
    `Secure=${SESSION_CONFIG.secure}`,
    `SameSite=${SESSION_CONFIG.sameSite}`,
    `Max-Age=${SESSION_CONFIG.maxAge / 1000}`,
    `Path=/`,
  ];
  
  if (SESSION_CONFIG.domain) {
    cookieOptions.push(`Domain=${SESSION_CONFIG.domain}`);
  }
  
  headers.append('Set-Cookie', cookieOptions.join('; '));
  
  return new Response(response.body, { ...response, headers });
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: Response): Response {
  const headers = new Headers(response.headers);
  
  headers.append('Set-Cookie', 
    `session_id=; HttpOnly; Secure=${SESSION_CONFIG.secure}; SameSite=${SESSION_CONFIG.sameSite}; Max-Age=0; Path=/`
  );
  
  return new Response(response.body, { ...response, headers });
}

/**
 * Validate session integrity
 */
export async function validateSessionIntegrity(
  sessionId: string,
  request: Request
): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) return false;
  
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Validate IP and User-Agent haven't changed
  return session.ip === clientIP && session.userAgent === userAgent;
}

/**
 * Get client IP address
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Session cleanup (remove expired sessions)
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  
  for (const [sessionId, session] of Array.from(sessionStore.entries())) {
    if (now - session.createdAt > SESSION_CONFIG.maxAge) {
      sessionStore.delete(sessionId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

/**
 * Session security middleware
 */
export async function sessionSecurityMiddleware(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  const session = await getSessionFromRequest(request);
  
  if (!session) {
    return handler();
  }
  
  // Validate session integrity
  const isValid = await validateSessionIntegrity(session.csrfToken, request);
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Session validation failed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return handler();
}