import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/api/server.js';

describe('POST /api/profiles', () => {
  let sessionCookie: string[];

  beforeEach(async () => {
    // Register and get session cookie
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'profiletest' + Date.now(),
        password: 'password123',
      });
    sessionCookie = res.headers['set-cookie'];
  });

  test('creates profile and returns 201 with profile data', async () => {
    const res = await request(app)
      .post('/api/profiles')
      .set('Cookie', sessionCookie)
      .send({
        displayName: 'Test User',
        bio: 'This is my test bio',
      });

    expect(res.status).toBe(201);
    expect(res.body.profile).toHaveProperty('id');
    expect(res.body.profile).toHaveProperty('userId');
    expect(res.body.profile.displayName).toBe('Test User');
    expect(res.body.profile.bio).toBe('This is my test bio');
    expect(res.body.profile).toHaveProperty('createdAt');
  });

  test('rejects unauthorized request with 401', async () => {
    const res = await request(app)
      .post('/api/profiles')
      .send({
        displayName: 'Test User',
        bio: 'Bio',
      });

    expect(res.status).toBe(401);
  });

  test('rejects bio exceeding 141 characters with 400', async () => {
    const longBio = 'a'.repeat(142);

    const res = await request(app)
      .post('/api/profiles')
      .set('Cookie', sessionCookie)
      .send({
        displayName: 'Test User',
        bio: longBio,
      });

    expect(res.status).toBe(400);
  });

  test('rejects duplicate profile creation with 409', async () => {
    // Create first profile
    await request(app)
      .post('/api/profiles')
      .set('Cookie', sessionCookie)
      .send({
        displayName: 'First Profile',
        bio: 'First bio',
      });

    // Try to create second profile
    const res = await request(app)
      .post('/api/profiles')
      .set('Cookie', sessionCookie)
      .send({
        displayName: 'Second Profile',
        bio: 'Second bio',
      });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/profiles/:username', () => {
  test('returns profile with 200 for existing user', async () => {
    // Register and create profile
    const username = 'viewtest' + Date.now();
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'password123' });

    const sessionCookie = regRes.headers['set-cookie'];

    await request(app)
      .post('/api/profiles')
      .set('Cookie', sessionCookie)
      .send({
        displayName: 'View Test User',
        bio: 'View test bio',
      });

    // View profile
    const res = await request(app).get(`/api/profiles/${username}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe(username);
    expect(res.body.profile.displayName).toBe('View Test User');
    expect(res.body.profile.bio).toBe('View test bio');
  });

  test('returns 404 for non-existent user', async () => {
    const res = await request(app).get('/api/profiles/nonexistentuser999');

    expect(res.status).toBe(404);
  });
});
