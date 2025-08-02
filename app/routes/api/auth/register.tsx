import type { ActionFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { z } from 'zod';
import { db } from '~/lib/db/connection';
import { users } from '~/lib/db/schema';
import { hashPassword } from '~/lib/auth/password';
import { uuidv7 } from 'uuidv7';
import { eq } from 'drizzle-orm';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z
    .string()
    .email('Invalid email address')
    .max(320, 'Email must be at most 320 characters'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const validatedData = registerSchema.parse(data);
    
    // Check if username already exists
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, validatedData.username))
      .limit(1);
    
    if (existingUsername.length > 0) {
      return json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);
    
    if (existingEmail.length > 0) {
      return json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create user
    const user = await db.insert(users).values({
      id: uuidv7(),
      username: validatedData.username,
      email: validatedData.email,
      displayName: validatedData.name,
      passwordHash: hashedPassword,
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
    });
    
    return json(
      {
        message: 'User registered successfully',
        user: user[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}