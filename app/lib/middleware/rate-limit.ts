interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (request: Request) => string;
}

const defaultOptions: RateLimitOptions = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const opts = { ...defaultOptions, ...options };
  
  return async (request: Request, handler: () => Promise<Response>) => {
    const key = opts.keyGenerator ? opts.keyGenerator(request) : getClientIP(request);
    const now = Date.now();
    
    let entry = rateLimits.get(key);
    
    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + opts.windowMs };
      rateLimits.set(key, entry);
    } else {
      entry.count++;
    }
    
    if (entry.count > opts.maxRequests) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
          },
        }
      );
    }
    
    const response = await handler();
    
    // Add rate limit headers
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', opts.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', Math.max(0, opts.maxRequests - entry.count).toString());
    headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    
    return new Response(response.body, { ...response, headers });
  };
}

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a basic identifier
  return 'unknown';
}

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetTime) {
      rateLimits.delete(key);
    }
  }
}, 60 * 60 * 1000);