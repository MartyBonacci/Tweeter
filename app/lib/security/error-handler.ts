export interface SecurityError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

export class SecurityErrorHandler {
  private static isProduction = process.env.NODE_ENV === 'production';
  private static logLevel = process.env.LOG_LEVEL || 'info';

  /**
   * Handle security errors without exposing sensitive information
   */
  static handleError(error: unknown): SecurityError {
    const errorId = this.generateErrorId();
    
    if (error instanceof Error) {
      // Log full error details for debugging
      this.logError(error, errorId);
      
      // Return sanitized error based on type
      return this.sanitizeError(error, errorId);
    }
    
    // Handle non-Error objects
    this.logError(new Error('Unknown error'), errorId);
    
    return {
      code: 'UNKNOWN_ERROR',
      message: this.isProduction ? 'An unexpected error occurred' : 'Unknown error',
      statusCode: 500,
    };
  }

  /**
   * Sanitize error information for client response
   */
  private static sanitizeError(error: Error, errorId: string): SecurityError {
    if (error.name === 'ValidationError') {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        statusCode: 400,
        details: this.isProduction ? undefined : { error: error.message },
      };
    }

    if (error.name === 'AuthenticationError') {
      return {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
        statusCode: 401,
      };
    }

    if (error.name === 'AuthorizationError') {
      return {
        code: 'AUTHORIZATION_FAILED',
        message: 'Access denied',
        statusCode: 403,
      };
    }

    if (error.name === 'RateLimitError') {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        statusCode: 429,
      };
    }

    if (error.name === 'CSRFError') {
      return {
        code: 'CSRF_INVALID',
        message: 'Security validation failed',
        statusCode: 403,
      };
    }

    if (error.name === 'SessionError') {
      return {
        code: 'SESSION_INVALID',
        message: 'Session expired or invalid',
        statusCode: 401,
      };
    }

    if (error.message.includes('database') || error.message.includes('sql')) {
      return {
        code: 'DATABASE_ERROR',
        message: this.isProduction ? 'Service temporarily unavailable' : 'Database error',
        statusCode: 503,
      };
    }

    if (error.message.includes('network') || error.message.includes('timeout')) {
      return {
        code: 'NETWORK_ERROR',
        message: this.isProduction ? 'Service temporarily unavailable' : 'Network error',
        statusCode: 503,
      };
    }

    // Default error handling
    return {
      code: 'INTERNAL_ERROR',
      message: this.isProduction ? 'Service temporarily unavailable' : error.message,
      statusCode: 500,
      details: this.isProduction ? undefined : { errorId },
    };
  }

  /**
   * Log error securely without exposing sensitive data
   */
  private static logError(error: Error, errorId: string): void {
    if (this.logLevel === 'none') return;

    const logEntry = {
      errorId,
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      stack: this.isProduction ? undefined : error.stack,
      environment: process.env.NODE_ENV,
    };

    // In production, use proper logging service
    if (this.isProduction) {
      console.error('[SECURITY_ERROR]', JSON.stringify(logEntry));
    } else {
      console.error('Security Error:', logEntry);
    }
  }

  /**
   * Generate unique error ID for tracking
   */
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create secure error response
   */
  static createErrorResponse(error: SecurityError): Response {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    const responseBody = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && !this.isProduction && { details: error.details }),
      },
    };

    return new Response(JSON.stringify(responseBody), {
      status: error.statusCode,
      headers,
    });
  }

  /**
   * Handle validation errors from Zod
   */
  static handleValidationError(error: any): SecurityError {
    const errorId = this.generateErrorId();
    
    this.logError(new Error('Validation failed'), errorId);
    
    const details = this.isProduction ? undefined : {
      issues: error.issues,
    };

    return {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      statusCode: 400,
      details,
    };
  }

  /**
   * Handle rate limit errors
   */
  static handleRateLimitError(retryAfter: number): SecurityError {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      statusCode: 429,
      details: { retryAfter },
    };
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(message = 'Authentication failed'): SecurityError {
    return {
      code: 'AUTHENTICATION_FAILED',
      message,
      statusCode: 401,
    };
  }

  /**
   * Handle authorization errors
   */
  static handleAuthzError(message = 'Access denied'): SecurityError {
    return {
      code: 'AUTHORIZATION_FAILED',
      message,
      statusCode: 403,
    };
  }

  /**
   * Handle CSRF errors
   */
  static handleCSRFError(): SecurityError {
    return {
      code: 'CSRF_INVALID',
      message: 'Security validation failed',
      statusCode: 403,
    };
  }

  /**
   * Wrap async functions with error handling
   */
  static async wrapAsync<T>(
    fn: () => Promise<T>,
    customHandler?: (error: Error) => SecurityError
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (customHandler && error instanceof Error) {
        throw customHandler(error);
      }
      throw this.handleError(error);
    }
  }

  /**
   * Express-style error handler middleware
   */
  static errorHandler(): (request: Request, handler: () => Promise<Response>) => Promise<Response> {
    return async (request: Request, handler: () => Promise<Response>): Promise<Response> => {
      try {
        return await handler();
      } catch (error) {
        const securityError = this.handleError(error);
        return this.createErrorResponse(securityError);
      }
    };
  }
}

// Custom error classes for specific scenarios
export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class CSRFError extends Error {
  constructor(message = 'CSRF validation failed') {
    super(message);
    this.name = 'CSRFError';
  }
}

export class SessionError extends Error {
  constructor(message = 'Session validation failed') {
    super(message);
    this.name = 'SessionError';
  }
}

export class ValidationError extends Error {
  public errors: any[];

  constructor(errors: any[], message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Error response utilities
 */
export const errorResponses = {
  badRequest: (message = 'Bad request') => 
    SecurityErrorHandler.createErrorResponse({
      code: 'BAD_REQUEST',
      message,
      statusCode: 400,
    }),

  unauthorized: (message = 'Unauthorized') => 
    SecurityErrorHandler.createErrorResponse({
      code: 'UNAUTHORIZED',
      message,
      statusCode: 401,
    }),

  forbidden: (message = 'Forbidden') => 
    SecurityErrorHandler.createErrorResponse({
      code: 'FORBIDDEN',
      message,
      statusCode: 403,
    }),

  notFound: (message = 'Not found') => 
    SecurityErrorHandler.createErrorResponse({
      code: 'NOT_FOUND',
      message,
      statusCode: 404,
    }),

  rateLimit: (retryAfter: number) => 
    SecurityErrorHandler.createErrorResponse(
      SecurityErrorHandler.handleRateLimitError(retryAfter)
    ),

  internal: (message = 'Internal server error') => 
    SecurityErrorHandler.createErrorResponse({
      code: 'INTERNAL_ERROR',
      message,
      statusCode: 500,
    }),

  serviceUnavailable: (message = 'Service temporarily unavailable') => 
    SecurityErrorHandler.createErrorResponse({
      code: 'SERVICE_UNAVAILABLE',
      message,
      statusCode: 503,
    }),
};

/**
 * Security headers for error responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
};

/**
 * Log security events
 */
export class SecurityLogger {
  static log(event: string, data: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...data,
      userAgent: data.userAgent || 'unknown',
      ip: data.ip || 'unknown',
    };

    if (process.env.NODE_ENV === 'production') {
      console.log('[SECURITY]', JSON.stringify(logEntry));
    } else {
      console.log('Security Event:', logEntry);
    }
  }

  static logAuthAttempt(data: {
    success: boolean;
    username?: string;
    email?: string;
    ip: string;
    userAgent: string;
    reason?: string;
  }): void {
    this.log('AUTH_ATTEMPT', data);
  }

  static logRateLimit(data: {
    key: string;
    limit: number;
    count: number;
    ip: string;
    userAgent: string;
  }): void {
    this.log('RATE_LIMIT', data);
  }

  static logCSRF(data: {
    ip: string;
    userAgent: string;
    expected?: string;
    provided?: string;
  }): void {
    this.log('CSRF_VIOLATION', data);
  }

  static logSession(data: {
    sessionId: string;
    userId: string;
    action: 'created' | 'refreshed' | 'destroyed' | 'timeout';
    ip: string;
  }): void {
    this.log('SESSION', data);
  }
}