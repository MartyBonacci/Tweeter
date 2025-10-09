import { z } from 'zod';

// Registration schema
export const RegisterSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens'
      ),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .optional(),
  })
  .refine(
    (data) => {
      // If confirmPassword is provided, it must match password
      if (data.confirmPassword !== undefined) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

// Login schema
export const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Export TypeScript types derived from Zod schemas
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
