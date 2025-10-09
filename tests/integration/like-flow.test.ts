import { describe, test, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/api/server.js';

describe('Like Flow', () => {
  test('full flow: register → post → like → unlike', async () => {
    // Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'flowtest' + Date.now() + Math.floor(Math.random() * 10000),
        password: 'password123',
      });

    expect(regRes.status).toBe(201);
    const sessionCookie = regRes.headers['set-cookie'];

    // Post tweet
    const tweetRes = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Test tweet for like flow' });

    expect(tweetRes.status).toBe(201);
    const tweetId = tweetRes.body.tweet.id;

    // Like tweet
    const likeRes = await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    expect(likeRes.status).toBe(201);

    // Check like count
    let likesRes = await request(app)
      .get(`/api/tweets/${tweetId}/likes`)
      .set('Cookie', sessionCookie);

    expect(likesRes.status).toBe(200);
    expect(likesRes.body.count).toBe(1);
    expect(likesRes.body.userLiked).toBe(true);

    // Unlike tweet
    const unlikeRes = await request(app)
      .delete(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    expect(unlikeRes.status).toBe(204);

    // Check like count again
    likesRes = await request(app)
      .get(`/api/tweets/${tweetId}/likes`)
      .set('Cookie', sessionCookie);

    expect(likesRes.status).toBe(200);
    expect(likesRes.body.count).toBe(0);
    expect(likesRes.body.userLiked).toBe(false);
  });

  test('multiple users can like same tweet', async () => {
    // Create User A
    const userARes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'usera' + Date.now() + Math.floor(Math.random() * 10000),
        password: 'password123',
      });

    const userACookie = userARes.headers['set-cookie'];

    // User A posts tweet
    const tweetRes = await request(app)
      .post('/api/tweets')
      .set('Cookie', userACookie)
      .send({ content: 'Tweet to be liked by multiple users' });

    const tweetId = tweetRes.body.tweet.id;

    // User A likes their own tweet
    await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', userACookie);

    // Create User B
    const userBRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'userb' + Date.now() + Math.floor(Math.random() * 10000),
        password: 'password123',
      });

    const userBCookie = userBRes.headers['set-cookie'];

    // User B likes the tweet
    await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', userBCookie);

    // Check like count
    const likesRes = await request(app)
      .get(`/api/tweets/${tweetId}/likes`);

    expect(likesRes.status).toBe(200);
    expect(likesRes.body.count).toBe(2);
  });

  test('anonymous visitor can view like counts', async () => {
    // Create user and tweet
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'publiclikes' + Date.now() + Math.floor(Math.random() * 10000),
        password: 'password123',
      });

    const sessionCookie = regRes.headers['set-cookie'];

    const tweetRes = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Public tweet with likes' });

    const tweetId = tweetRes.body.tweet.id;

    // Like as authenticated user
    await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Cookie', sessionCookie);

    // View as anonymous (no session cookie)
    const likesRes = await request(app)
      .get(`/api/tweets/${tweetId}/likes`);

    expect(likesRes.status).toBe(200);
    expect(likesRes.body.count).toBe(1);
    expect(likesRes.body.userLiked).toBe(false); // Anonymous user
  });
});
