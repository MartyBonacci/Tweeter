import { z } from 'zod';

// Base validation schemas
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .transform(val => val.trim());

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(320, 'Email must be at most 320 characters')
  .transform(val => val.trim().toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters')
  .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform(val => val.trim());

// Sanitization helpers
export function sanitizeString(input: string): string {
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Tweet validation
export const tweetSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content is required')
    .max(280, 'Tweet must be at most 280 characters')
    .transform(val => sanitizeString(val)),
  mediaUrls: z
    .array(z.string().url('Invalid media URL'))
    .max(4, 'Maximum 4 media files allowed')
    .optional(),
  parentTweetId: z
    .string()
    .uuid('Invalid tweet ID')
    .optional(),
});

// User profile validation
export const userProfileSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  name: nameSchema,
  bio: z
    .string()
    .max(160, 'Bio must be at most 160 characters')
    .transform(val => sanitizeString(val))
    .optional(),
  location: z
    .string()
    .max(30, 'Location must be at most 30 characters')
    .transform(val => sanitizeString(val))
    .optional(),
  website: z
    .string()
    .url('Invalid website URL')
    .max(100, 'Website must be at most 100 characters')
    .optional()
    .or(z.literal('')),
});

// Authentication validation
export const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
});

// Pagination validation
export const paginationSchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100')),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z
    .object({
      size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
      type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    })
    .refine(file => file.size <= 5 * 1024 * 1024, 'File too large')
    .refine(file => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type), 'Invalid file type'),
});

// Validation utilities
export class ValidationError extends Error {
  constructor(public errors: z.ZodError) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  
  return result.data;
}

export function validateFormData<T>(
  schema: z.ZodSchema<T>, 
  formData: FormData
): T {
  const data = Object.fromEntries(formData.entries());
  
  // Convert file uploads
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof File) {
      data[key] = {
        size: value.size,
        type: value.type,
        name: value.name,
      };
    }
  }
  
  return validateInput(schema, data);
}

// Rate limiting schemas
export const rateLimitConfig = {
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

// Security headers schema
export const securityHeadersSchema = z.object({
  'Content-Security-Policy': z.string().optional(),
  'X-Content-Type-Options': z.string().optional(),
  'X-Frame-Options': z.string().optional(),
  'X-XSS-Protection': z.string().optional(),
  'Strict-Transport-Security': z.string().optional(),
  'Referrer-Policy': z.string().optional(),
  'Permissions-Policy': z.string().optional(),
});