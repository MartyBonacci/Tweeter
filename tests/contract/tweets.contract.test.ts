import { describe, test, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/api/server.js';

describe('POST /api/tweets', () => {
  test('creates tweet and returns 201 when authenticated', async () => {
    // Register and get session cookie
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'tweettest' + Date.now(),
        password: 'password123',
      });

    const sessionCookie = regRes.headers['set-cookie'];

    // Post tweet
    const res = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'My first tweet!' });

    expect(res.status).toBe(201);
    expect(res.body.tweet).toHaveProperty('id');
    expect(res.body.tweet).toHaveProperty('userId');
    expect(res.body.tweet.content).toBe('My first tweet!');
    expect(res.body.tweet).toHaveProperty('createdAt');
    expect(res.body.tweet).toHaveProperty('updatedAt');
  });

  test('rejects empty tweet with 400', async () => {
    // Register and get session cookie
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'emptytest' + Date.now(),
        password: 'password123',
      });

    const sessionCookie = regRes.headers['set-cookie'];

    // Post empty tweet
    const res = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  test('rejects tweet exceeding 141 chars with 400', async () => {
    // Register and get session cookie
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'longtest' + Date.now(),
        password: 'password123',
      });

    const sessionCookie = regRes.headers['set-cookie'];

    // Post tweet exceeding limit
    const res = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'a'.repeat(142) });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  test('rejects whitespace-only tweet with 400', async () => {
    // Register and get session cookie
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'whitespacetest' + Date.now(),
        password: 'password123',
      });

    const sessionCookie = regRes.headers['set-cookie'];

    // Post whitespace-only tweet
    const res = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  test('rejects unauthenticated request with 401', async () => {
    // Post tweet without session cookie
    const res = await request(app)
      .post('/api/tweets')
      .send({ content: 'Unauthorized tweet' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});

describe('GET /api/tweets/user/:userId', () => {
  test('returns tweets in reverse chronological order', async () => {
    // Register user and get userId
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'viewtest' + Date.now(),
        password: 'password123',
      });

    const sessionCookie = regRes.headers['set-cookie'];
    const userId = regRes.body.user.id;

    // Post tweets
    await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'First tweet' });

    await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Second tweet' });

    // View tweets
    const res = await request(app).get(`/api/tweets/user/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body.tweets).toHaveLength(2);
    expect(res.body.tweets[0].content).toBe('Second tweet'); // Newest first
    expect(res.body.tweets[1].content).toBe('First tweet');
    expect(res.body.count).toBe(2);
  });

  test('returns empty array for user with no tweets', async () => {
    // Register user with no tweets
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'notweets' + Date.now(),
        password: 'password123',
      });

    const userId = regRes.body.user.id;

    // View tweets
    const res = await request(app).get(`/api/tweets/user/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body.tweets).toHaveLength(0);
    expect(res.body.count).toBe(0);
  });

  test('allows anonymous access (no auth required)', async () => {
    // Register and post tweet
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'anontest' + Date.now(),
        password: 'password123',
      });

    const sessionCookie = regRes.headers['set-cookie'];
    const userId = regRes.body.user.id;

    await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Public tweet' });

    // View as anonymous (no cookie)
    const res = await request(app).get(`/api/tweets/user/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body.tweets).toHaveLength(1);
  });
});
