import { describe, test, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/api/server.js';

describe('Tweet Posting Flow', () => {
  test('full flow: register → post tweet → view on profile', async () => {
    // 1. Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'flowtest' + Date.now(),
        password: 'password123',
      });

    expect(regRes.status).toBe(201);
    const sessionCookie = regRes.headers['set-cookie'];
    const userId = regRes.body.user.id;

    // 2. Post tweet
    const tweetRes = await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'My first tweet from integration test!' });

    expect(tweetRes.status).toBe(201);
    expect(tweetRes.body.tweet.content).toBe('My first tweet from integration test!');

    // 3. View tweets on profile
    const viewRes = await request(app).get(`/api/tweets/user/${userId}`);

    expect(viewRes.status).toBe(200);
    expect(viewRes.body.tweets).toHaveLength(1);
    expect(viewRes.body.tweets[0].content).toBe('My first tweet from integration test!');
  });

  test('anonymous visitor can view tweets', async () => {
    // 1. Create user and tweet
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'publictest' + Date.now(),
        password: 'password123',
      });

    const sessionCookie = regRes.headers['set-cookie'];
    const userId = regRes.body.user.id;

    await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Public tweet for everyone' });

    // 2. View as anonymous (no session cookie)
    const viewRes = await request(app).get(`/api/tweets/user/${userId}`);

    expect(viewRes.status).toBe(200);
    expect(viewRes.body.tweets[0].content).toBe('Public tweet for everyone');
  });

  test('multiple tweets display in correct order (newest first)', async () => {
    // 1. Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'multitest' + Date.now(),
        password: 'password123',
      });

    const sessionCookie = regRes.headers['set-cookie'];
    const userId = regRes.body.user.id;

    // 2. Post multiple tweets
    await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Tweet 1' });

    await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Tweet 2' });

    await request(app)
      .post('/api/tweets')
      .set('Cookie', sessionCookie)
      .send({ content: 'Tweet 3' });

    // 3. View tweets
    const viewRes = await request(app).get(`/api/tweets/user/${userId}`);

    expect(viewRes.status).toBe(200);
    expect(viewRes.body.tweets).toHaveLength(3);
    expect(viewRes.body.tweets[0].content).toBe('Tweet 3'); // Newest first
    expect(viewRes.body.tweets[1].content).toBe('Tweet 2');
    expect(viewRes.body.tweets[2].content).toBe('Tweet 1');
  });

  test('authenticated user can view another user\'s tweets', async () => {
    // 1. Create User A
    const userARes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'usera' + Date.now(),
        password: 'password123',
      });

    const userACookie = userARes.headers['set-cookie'];
    const userAId = userARes.body.user.id;

    // 2. User A posts tweet
    await request(app)
      .post('/api/tweets')
      .set('Cookie', userACookie)
      .send({ content: 'Tweet from User A' });

    // 3. Create User B
    const userBRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'userb' + Date.now(),
        password: 'password123',
      });

    const userBCookie = userBRes.headers['set-cookie'];

    // 4. User B views User A's tweets
    const viewRes = await request(app)
      .get(`/api/tweets/user/${userAId}`)
      .set('Cookie', userBCookie);

    expect(viewRes.status).toBe(200);
    expect(viewRes.body.tweets).toHaveLength(1);
    expect(viewRes.body.tweets[0].content).toBe('Tweet from User A');
  });
});
