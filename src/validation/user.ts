import { z } from 'zod';

export const userRegistrationSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }).max(50, { message: 'Username must be less than 50 characters' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }).max(100, { message: 'Password must be less than 100 characters' }),
});

export const userLoginSchema = z.object({
  identifier: z.string().min(1, { message: 'Username or email is required' }), // Can be either username or email
  password: z.string().min(1, { message: 'Password is required' }),
});

export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;