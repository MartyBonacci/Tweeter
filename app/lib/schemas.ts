import { z } from "zod";

// User validation schemas
export const userRegistrationSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(50, "Username must be at most 50 characters long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .transform(val => val.toLowerCase()),
  
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform(val => val.toLowerCase()),
  
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters long")
    .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
    .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
    .regex(/(?=.*\d)/, "Password must contain at least one number"),
  
  displayName: z
    .string()
    .max(100, "Display name must be at most 100 characters long")
    .optional()
});

export const userLoginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .transform(val => val.toLowerCase()),
  
  password: z
    .string()
    .min(1, "Password is required")
});

// Tweet validation schemas
export const tweetContentSchema = z.object({
  content: z
    .string()
    .min(1, "Tweet content is required")
    .max(140, "Tweet must be 140 characters or less")
    .transform(val => val.trim())
});

// API parameter schemas
export const usernameParamSchema = z.object({
  username: z
    .string()
    .min(1, "Username parameter is required")
    .transform(val => val.toLowerCase())
});

export const tweetIdParamSchema = z.object({
  tweetId: z
    .string()
    .uuid("Invalid tweet ID format")
});

export const paginationQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val) : 20)
    .refine(val => val > 0 && val <= 100, "Limit must be between 1 and 100"),
  
  offset: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val) : 0)
    .refine(val => val >= 0, "Offset must be non-negative"),
  
  filter: z
    .enum(["all", "following"])
    .optional()
    .default("all")
});

// User profile update schema
export const userProfileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be at most 50 characters long")
    .trim(),
  
  username: z
    .string()
    .min(1, "Username is required")
    .max(15, "Username must be at most 15 characters long")  
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .transform(val => val.toLowerCase()),
  
  bio: z
    .string()
    .max(160, "Bio must be at most 160 characters long")
    .transform(val => val.trim() === "" ? "" : val)
    .optional(),
  
  avatar: z
    .string()
    .transform(val => val.trim() === "" ? "" : val)
    .refine(val => val === "" || /^https?:\/\/.+/.test(val), "Avatar URL must be a valid URL")
    .optional()
});

// Follow/unfollow schema
export const followActionSchema = z.object({
  action: z.enum(["follow", "unfollow"])
});

// Type exports for TypeScript
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type TweetContent = z.infer<typeof tweetContentSchema>;
export type UsernameParam = z.infer<typeof usernameParamSchema>;
export type TweetIdParam = z.infer<typeof tweetIdParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;
export type FollowAction = z.infer<typeof followActionSchema>;