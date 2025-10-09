import { Router } from 'express';
import { RegisterSchema, LoginSchema } from '../../schemas/auth.schema.js';
import {
  hashPassword,
  verifyPassword,
  generateUserId,
  getUserByUsername,
  getUserByEmail,
} from '../../services/auth.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { sql } from '../../services/db.service.js';
import type { User } from '../../types/index.js';

const router = Router();

/**
 * POST /api/auth/register
 * Create new user account and auto-login
 */
router.post('/register', validate(RegisterSchema), async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check for duplicate email
    if (email) {
      const existingEmailUser = await getUserByEmail(email);
      if (existingEmailUser) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = generateUserId();

    // Insert user into database (use null for undefined email)
    const [user] = await sql<User[]>`
      INSERT INTO users (id, username, email, password_hash)
      VALUES (${userId}, ${username.toLowerCase()}, ${email || null}, ${passwordHash})
      RETURNING id, username, created_at
    `;

    // Create session
    req.session.userId = user.id;

    // Return user data and session info
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
      session: {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (error: any) {
    // Handle unique constraint violation (duplicate username or email)
    if (error.code === '23505') {
      if (error.constraint?.includes('email')) {
        res.status(409).json({ error: 'Email already in use' });
      } else {
        res.status(409).json({ error: 'Username already exists' });
      }
      return;
    }
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user
 */
router.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Get user from database
    const user = await getUserByUsername(username);

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(user.passwordHash, password);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Create session
    req.session.userId = user.id;

    // Return user data and session info
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
      },
      session: {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * End user session
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

export default router;
