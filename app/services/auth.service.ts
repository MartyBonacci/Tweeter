import { db } from '~/lib/db/connection';
import { users } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { generateAccessToken, generateRefreshToken } from '~/lib/auth/jwt';
import { verifyPassword, hashPassword } from '~/lib/auth/password';
import { AppError, NotFoundError, UnauthorizedError } from '~/utils/error.util';
import { ResponseUtil } from '~/utils/response.util';
import type { LoginData, RegisterData } from '~/validators/auth.validator';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
}

export class AuthService {
  static async login(data: LoginData): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Find user by username
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .limit(1);

    if (user.length === 0) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const userData = user[0];

    // Verify password
    const isValidPassword = await verifyPassword(data.password, userData.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const accessToken = await generateAccessToken({
      userId: userData.id,
      email: userData.email,
      username: userData.username,
    });

    const refreshToken = await generateRefreshToken(userData.id);

    return {
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.displayName || userData.username,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  static async register(data: RegisterData): Promise<{ user: AuthUser }> {
    // Check if username exists
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .limit(1);

    if (existingUsername.length > 0) {
      throw new AppError('Username already taken', 400);
    }

    // Check if email exists
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingEmail.length > 0) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        id: uuidv7(),
        username: data.username,
        email: data.email,
        displayName: data.name,
        passwordHash,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
      });

    return {
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        email: newUser[0].email,
        name: newUser[0].displayName || newUser[0].username,
      },
    };
  }

  static async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.displayName,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user[0] || null;
  }

  static async findById(id: string): Promise<AuthUser | null> {
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.displayName,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user[0] || null;
  }

  static generateAuthCookies(accessToken: string, refreshToken: string): string[] {
    return [
      `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/`,
      `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`,
    ];
  }
}