import { describe, test, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/api/server.js';

describe('POST /api/auth/register', () => {
  test('creates user and returns 201 with user data and session', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser' + Date.now(),
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('username');
    expect(res.body.user).toHaveProperty('createdAt');
    expect(res.body.session).toHaveProperty('expires');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('rejects duplicate username with 409', async () => {
    const username = 'duplicate' + Date.now();

    // First registration
    await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'password123' });

    // Duplicate attempt
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'different123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  test('rejects password shorter than 8 characters with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'shortpass' + Date.now(),
        password: 'short',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  test('rejects invalid username format with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'ab', // Too short (min 3)
        password: 'password123',
      });

    expect(res.status).toBe(400);
  });

  test('rejects username with special characters with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user@name',
        password: 'password123',
      });

    expect(res.status).toBe(400);
  });

  test('rejects missing fields with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'onlyusername' });

    expect(res.status).toBe(400);
  });

  test('accepts valid email and confirmPassword', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'emailuser' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('username');
    expect(res.body.user).toHaveProperty('createdAt');
  });

  test('rejects duplicate email with 409', async () => {
    const email = 'duplicate' + Date.now() + '@example.com';

    // First registration
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user1' + Date.now(),
        email,
        password: 'password123',
        confirmPassword: 'password123',
      });

    // Duplicate email attempt
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user2' + Date.now(),
        email,
        password: 'password123',
        confirmPassword: 'password123',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already in use');
  });

  test('rejects mismatched passwords with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'mismatchuser' + Date.now(),
        email: 'mismatch' + Date.now() + '@example.com',
        password: 'password123',
        confirmPassword: 'differentpass',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeDefined();
  });

  test('rejects invalid email format with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'invalidemail' + Date.now(),
        email: 'not-an-email',
        password: 'password123',
        confirmPassword: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});
