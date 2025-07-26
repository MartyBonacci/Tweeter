import { Request, Response } from 'express';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { userRegistrationSchema, userLoginSchema } from '../../validation/user';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { ZodError } from 'zod';

// Register a new user
export const registerUser = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = userRegistrationSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(
      eq(users.email, validatedData.email)
    ).limit(1);
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);
    
    // Create user
    const [newUser] = await db.insert(users).values({
      email: validatedData.email,
      username: validatedData.username,
      passwordHash: hashedPassword,
    }).returning();
    
    // Remove password hash from response
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };
    
    res.status(201).json({ user: userResponse });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
export const loginUser = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = userLoginSchema.parse(req.body);
    
    // Find user by email or username
    const userQuery = db.select().from(users).where(
      eq(users.email, validatedData.identifier)
    ).limit(1);
    
    const userResult = await userQuery;
    
    if (userResult.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult[0];
    
    // Check password
    const isPasswordValid = await compare(validatedData.password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1d' }
    );
    
    // Remove password hash from response
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(200).json({ user: userResponse, token });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};