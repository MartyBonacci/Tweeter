import { Request, Response, NextFunction } from 'express';

// Extend Express session type
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

/**
 * Authentication middleware - validates user session
 * Enforces that request has valid session with userId
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
