import { Request, Response, NextFunction } from 'express';

/**
 * Error handling middleware - catches and formats errors
 * Should be registered last in middleware chain
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  // Default error response
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}
