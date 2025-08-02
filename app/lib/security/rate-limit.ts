export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (request: Request) => string;
  message: string;
  statusCode: number;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

// Use Redis in production
const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: getClientIP,
  message: 'Too many requests, please try again later',
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * Rate limiting configurations for different endpoints
 */
export const rateLimitConfigs = {
  auth: {
    login: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
      message: 'Too many login attempts, please try again later',
    },
    register: {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
      message: 'Too many registration attempts, please try again later',
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
      message: 'Too many password reset attempts, please try again later',
    },
    emailVerification: {
      windowMs: 24 * 60 * 60 * 1000,
      maxRequests: 5,
      message: 'Too many email verification attempts, please try again later',
    },
  },
  api: {
    default: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
    },
    tweets: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 50,
    },
    mediaUpload: {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
    },
  },
  admin: {
    default: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 20,
    },
  },
};

/**
 * Create rate limiter with specific configuration
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const options: RateLimitConfig = { ...DEFAULT_CONFIG, ...config };

  return async (
    request: Request,
    handler: () => Promise<Response>
  ): Promise<Response> => {
    const key = options.keyGenerator(request);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + options.windowMs,
        firstRequestTime: now,
      };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }

    // Check if limit exceeded
    if (entry.count > options.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      const headers = new Headers({
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
      });

      if (options.standardHeaders) {
        headers.set('X-RateLimit-Limit', options.maxRequests.toString());
        headers.set('X-RateLimit-Remaining', '0');
        headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
      }

      if (options.legacyHeaders) {
        headers.set('X-RateLimit-Limit', options.maxRequests.toString());
        headers.set('X-RateLimit-Remaining', '0');
        headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
      }

      return new Response(
        JSON.stringify({
          error: options.message,
          retryAfter,
        }),
        { status: options.statusCode, headers }
      );
    }

    // Execute handler
    const response = await handler();

    // Add rate limit headers to successful response
    const headers = new Headers(response.headers);

    if (options.standardHeaders) {
      headers.set('X-RateLimit-Limit', options.maxRequests.toString());
      headers.set('X-RateLimit-Remaining', Math.max(0, options.maxRequests - entry.count).toString());
      headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    }

    return new Response(response.body, { ...response, headers });
  };
}

/**
 * IP-based rate limiter
 */
export const ipRateLimit = createRateLimiter({
  keyGenerator: getClientIP,
});

/**
 * User-based rate limiter
 */
export const userRateLimit = createRateLimiter({
  keyGenerator: (request: Request) => {
    // Extract user ID from session or token
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7); // JWT token
    }
    
    // Fallback to IP if no user ID
    return getClientIP(request);
  },
});

/**
 * API endpoint rate limiter
 */
export const apiRateLimit = createRateLimiter({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
});

/**
 * Authentication rate limiter
 */
export const authRateLimit = createRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many authentication attempts',
});

/**
 * Registration rate limiter
 */
export const registrationRateLimit = createRateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
  message: 'Too many registration attempts',
});

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimit = createRateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
  message: 'Too many password reset attempts',
});

/**
 * Media upload rate limiter
 */
export const mediaUploadRateLimit = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
  message: 'Too many media uploads',
});

/**
 * Tweet creation rate limiter
 */
export const tweetRateLimit = createRateLimiter({
  maxRequests: 50,
  windowMs: 15 * 60 * 1000,
  message: 'Too many tweets, please slow down',
});

/**
 * Get client IP address
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Generate a basic identifier for non-IP environments
  return `${request.headers.get('user-agent') || 'unknown'}-${Date.now()}`;
}

/**
 * Get user identifier for rate limiting
 */
export function getUserIdentifier(request: Request): string {
  // Check for authenticated user
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check for user ID in cookies/session
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'user_id') {
        return decodeURIComponent(value);
      }
    }
  }

  // Fallback to IP address
  return getClientIP(request);
}

/**
 * Advanced rate limiting with sliding window
 */
export function createSlidingWindowRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const options: RateLimitConfig = { ...DEFAULT_CONFIG, ...config };

  return async (
    request: Request,
    handler: () => Promise<Response>
  ): Promise<Response> => {
    const key = options.keyGenerator(request);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + options.windowMs,
        firstRequestTime: now,
      };
      rateLimitStore.set(key, entry);
    } else {
      // Sliding window: adjust count based on time elapsed
      const elapsed = now - entry.firstRequestTime;
      const decayFactor = Math.max(0, 1 - (elapsed / options.windowMs));
      entry.count = Math.floor(entry.count * decayFactor) + 1;
    }

    if (entry.count > options.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      return new Response(
        JSON.stringify({
          error: options.message,
          retryAfter,
        }),
        {
          status: options.statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    const response = await handler();

    return response;
  };
}

/**
 * Distributed rate limiting (Redis-based)
 * This is a placeholder for Redis implementation
 */
export class RedisRateLimiter {
  private redis: any; // Redis client

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async checkLimit(key: string, limit: number, window: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - window;

    const luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
      local current = redis.call('ZCARD', key)
      
      if current < limit then
        redis.call('ZADD', key, now, now)
        redis.call('EXPIRE', key, window)
        return {1, limit - current - 1}
      end
      
      return {0, 0}
    `;

    try {
      const result = await this.redis.eval(
        luaScript,
        1,
        key,
        limit,
        window,
        now
      );
      
      return result[0] === 1;
    } catch (error) {
      console.error('Rate limiting error:', error);
      return false;
    }
  }
}

/**
 * Cleanup expired rate limit entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

/**
 * Rate limiting middleware factory
 */
export function createRateLimitMiddleware(config: Partial<RateLimitConfig>) {
  const rateLimiter = createRateLimiter(config);
  
  return async (request: Request, handler: () => Promise<Response>) => {
    return rateLimiter(request, handler);
  };
}

/**
 * Rate limiting utilities
 */
export const rateLimitUtils = {
  reset: (key: string) => rateLimitStore.delete(key),
  get: (key: string) => rateLimitStore.get(key),
  clear: () => rateLimitStore.clear(),
  size: () => rateLimitStore.size,
};