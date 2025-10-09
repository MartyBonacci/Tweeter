import { describe, test, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/api/server.js';
import { sql } from '../../src/services/db.service.js';

describe('Registration Flow Integration', () => {
  test('full registration flow: register → verify session → verify user in DB', async () => {
    const username = 'flowtest' + Date.now();
    const password = 'password123';

    // 1. Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ username, password });

    expect(regRes.status).toBe(201);
    expect(regRes.body.user.username).toBe(username);

    // 2. Verify session cookie is set
    const sessionCookie = regRes.headers['set-cookie'];
    expect(sessionCookie).toBeDefined();

    // 3. Verify user exists in database
    const [user] = await sql`
      SELECT id, username, password_hash, created_at
      FROM users
      WHERE LOWER(username) = LOWER(${username})
    `;

    expect(user).toBeDefined();
    expect(user.username).toBe(username);
    expect(user.passwordHash).toBeDefined();
    expect(user.passwordHash).not.toBe(password); // Password should be hashed

    // 4. Verify session is active (try accessing protected endpoint - will add later)
    // For now, just verify we have a session cookie
    expect(sessionCookie[0]).toContain('connect.sid');
  });

  test('username is case-insensitive for uniqueness', async () => {
    const username = 'CaseSensitive' + Date.now();

    // Register with mixed case
    await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'password123' });

    // Try to register with lowercase
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: username.toLowerCase(), password: 'password123' });

    expect(res.status).toBe(409);
  });
});
