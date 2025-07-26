import { test, expect } from 'vitest';
import { userRegistrationSchema } from './user';

test('user registration schema validates correct data', () => {
  const validUserData = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123'
  };

  expect(() => userRegistrationSchema.parse(validUserData)).not.toThrow();
});

test('user registration schema rejects invalid email', () => {
  const invalidUserData = {
    email: 'invalid-email',
    username: 'testuser',
    password: 'password123'
  };

  expect(() => userRegistrationSchema.parse(invalidUserData)).toThrow();
});

test('user registration schema rejects short password', () => {
  const invalidUserData = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'pass'
  };

  expect(() => userRegistrationSchema.parse(invalidUserData)).toThrow();
});

test('user registration schema rejects short username', () => {
  const invalidUserData = {
    email: 'test@example.com',
    username: 'tu',
    password: 'password123'
  };

  expect(() => userRegistrationSchema.parse(invalidUserData)).toThrow();
});