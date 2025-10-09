import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/api/server.js';

describe('POST /api/tweets/:tweetId/like', () => {
  let sessionCookie: string[];
  let tweetId: string;

  beforeEach(async () => {
    // Register user and post tweet
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'liketest' + Date.now(),
        password: 'password123',
      });
    sessionCookie = regRes.headers['set-cookie'];

    const tweetRes = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Test tweet for likes' });
    tweetId = tweetRes.body.tweet.id;
  });

  test('creates like and returns 201', async () => {
    const res = await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(201);
    expect(res.body.like).toHaveProperty('id');
    expect(res.body.like).toHaveProperty('userId');
    expect(res.body.like.tweetId).toBe(tweetId);
    expect(res.body.like).toHaveProperty('createdAt');
  });

  test('is idempotent (duplicate like returns existing)', async () => {
    const res1 = await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    const res2 = await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.like.id).toBe(res2.body.like.id);
  });

  test('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .post(`/api/tweets/${tweetId}/like`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('increments like count', async () => {
    // Like the tweet
    await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    // Check like count (with session cookie to check userLiked)
    const likesRes = await request(app)
      .get(`/api/tweets/${tweetId}/likes`)
      .set('Cookie', sessionCookie);

    expect(likesRes.status).toBe(200);
    expect(likesRes.body.count).toBe(1);
    expect(likesRes.body.userLiked).toBe(true);
  });
});

describe('DELETE /api/tweets/:tweetId/like', () => {
  let sessionCookie: string[];
  let tweetId: string;

  beforeEach(async () => {
    // Register user and post tweet
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'unliketest' + Date.now(),
        password: 'password123',
      });
    sessionCookie = regRes.headers['set-cookie'];

    const tweetRes = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Test tweet for unlikes' });
    tweetId = tweetRes.body.tweet.id;
  });

  test('removes like and returns 204', async () => {
    // Like first
    await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    // Unlike
    const res = await request(app)
      .delete(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(204);
  });

  test('is idempotent (unliking non-existent returns 204)', async () => {
    const res = await request(app)
      .delete(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(204);
  });

  test('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .delete(`/api/tweets/${tweetId}/like`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('decrements like count', async () => {
    // Like the tweet
    await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    // Unlike the tweet
    await request(app)
      .delete(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    // Check like count
    const likesRes = await request(app)
      .get(`/api/tweets/${tweetId}/likes`);

    expect(likesRes.status).toBe(200);
    expect(likesRes.body.count).toBe(0);
    expect(likesRes.body.userLiked).toBe(false);
  });
});

describe('GET /api/tweets/:tweetId/likes', () => {
  let sessionCookie: string[];
  let tweetId: string;

  beforeEach(async () => {
    // Register user and post tweet
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'viewlikes' + Date.now(),
        password: 'password123',
      });
    sessionCookie = regRes.headers['set-cookie'];

    const tweetRes = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Test tweet for viewing likes' });
    tweetId = tweetRes.body.tweet.id;
  });

  test('returns correct count and user like status', async () => {
    // Like the tweet
    await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    // Get likes
    const res = await request(app)
      .get(`/api/tweets/${tweetId}/likes`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.tweetId).toBe(tweetId);
    expect(res.body.count).toBe(1);
    expect(res.body.userLiked).toBe(true);
  });

  test('returns userLiked false when user has not liked', async () => {
    const res = await request(app)
      .get(`/api/tweets/${tweetId}/likes`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.userLiked).toBe(false);
  });

  test('allows anonymous access', async () => {
    // Like as authenticated user
    await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    // View as anonymous (no cookie)
    const res = await request(app)
      .get(`/api/tweets/${tweetId}/likes`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.userLiked).toBe(false); // Anonymous
  });

  test('returns count 0 for tweets with no likes', async () => {
    const res = await request(app)
      .get(`/api/tweets/${tweetId}/likes`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});
