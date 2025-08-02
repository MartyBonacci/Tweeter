import type { ActionFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { z } from 'zod';
import { db } from '~/lib/db/connection';
import { users } from '~/lib/db/schema';
import { verifyPassword } from '~/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '~/lib/auth/jwt';
import { eq } from 'drizzle-orm';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const validatedData = loginSchema.parse(data);
    
    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);
    
    if (user.length === 0) {
      return json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const userData = user[0];
    
    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, userData.password);
    
    if (!isValidPassword) {
      return json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate tokens
    const accessToken = await generateAccessToken({
      userId: userData.id,
      email: userData.email,
      username: userData.username,
    });
    
    const refreshToken = await generateRefreshToken(userData.id);
    
    // Create response
    const response = json({
      message: 'Login successful',
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name,
      },
      accessToken,
    });
    
    // Set cookies
    const headers = new Headers(response.headers);
    headers.append('Set-Cookie', `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/`);
    headers.append('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`);
    
    return new Response(response.body, { ...response, headers });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Login error:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}