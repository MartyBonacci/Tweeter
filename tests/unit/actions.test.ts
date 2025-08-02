import { describe, it, expect, vi, beforeEach } from 'vitest';
import { json } from '@remix-run/node';
import { action as createPostAction } from '~/routes/posts.new';
import { action as createCommentAction } from '~/routes/posts.$postId.comments';
import { action as loginAction } from '~/routes/login';
import { action as registerAction } from '~/routes/register';
import { createMockContext, createMockRequest } from '../helpers/test-helpers';

vi.mock('~/lib/auth/session', () => ({
  getUserSession: vi.fn(),
  createUserSession: vi.fn(),
  destroySession: vi.fn(),
}));

vi.mock('~/lib/auth/jwt', () => ({
  verifyToken: vi.fn(),
  generateToken: vi.fn(),
}));

vi.mock('~/lib/db/connection', () => ({
  createPost: vi.fn(),
  createComment: vi.fn(),
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  validatePassword: vi.fn(),
}));

describe('Action Functions', () => {
  describe('create post action', () => {
    it('should create post with valid data', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      const mockPost = { 
        id: '1', 
        title: 'New Post', 
        content: 'Post content',
        authorId: mockUser.id 
      };

      const { getUserSession } = await import('~/lib/auth/session');
      const { createPost } = await import('~/lib/db/connection');
      
      vi.mocked(getUserSession).mockResolvedValue(mockUser);
      vi.mocked(createPost).mockResolvedValue(mockPost);

      const formData = new FormData();
      formData.append('title', 'New Post');
      formData.append('content', 'Post content');

      const request = createMockRequest({
        method: 'POST',
        formData
      });

      const response = await createPostAction({
        request,
        context: {},
        params: {}
      });

      expect(response).toEqual(json({ success: true, post: mockPost }));
    });

    it('should reject post creation without authentication', async () => {
      const { getUserSession } = await import('~/lib/auth/session');
      vi.mocked(getUserSession).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('title', 'New Post');
      formData.append('content', 'Post content');

      const request = createMockRequest({
        method: 'POST',
        formData
      });

      const response = await createPostAction({
        request,
        context: {},
        params: {}
      });

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      const { getUserSession } = await import('~/lib/auth/session');
      vi.mocked(getUserSession).mockResolvedValue(mockUser);

      const formData = new FormData();
      formData.append('title', ''); // Empty title

      const request = createMockRequest({
        method: 'POST',
        formData
      });

      const response = await createPostAction({
        request,
        context: {},
        params: {}
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        errors: { title: 'Title is required' }
      });
    });
  });

  describe('create comment action', () => {
    it('should create comment for authenticated user', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      const mockComment = {
        id: '1',
        content: 'Great post!',
        authorId: mockUser.id,
        postId: '1'
      };

      const { getUserSession } = await import('~/lib/auth/session');
      const { createComment } = await import('~/lib/db/connection');
      
      vi.mocked(getUserSession).mockResolvedValue(mockUser);
      vi.mocked(createComment).mockResolvedValue(mockComment);

      const formData = new FormData();
      formData.append('content', 'Great post!');

      const request = createMockRequest({
        method: 'POST',
        formData
      });

      const response = await createCommentAction({
        request,
        context: {},
        params: { postId: '1' }
      });

      expect(response).toEqual(json({ success: true, comment: mockComment }));
    });
  });

  describe('login action', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword'
      };

      const { getUserByEmail, validatePassword } = await import('~/lib/db/connection');
      const { createUserSession } = await import('~/lib/auth/session');
      
      vi.mocked(getUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(validatePassword).mockResolvedValue(true);
      vi.mocked(createUserSession).mockResolvedValue({});

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const request = createMockRequest({
        method: 'POST',
        formData
      });

      const response = await loginAction({
        request,
        context: {},
        params: {}
      });

      expect(response).toEqual(json({ success: true, user: mockUser }));
    });

    it('should reject invalid credentials', async () => {
      const { getUserByEmail, validatePassword } = await import('~/lib/db/connection');
      
      vi.mocked(getUserByEmail).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('email', 'invalid@example.com');
      formData.append('password', 'wrongpassword');

      const request = createMockRequest({
        method: 'POST',
        formData
      });

      const response = await loginAction({
        request,
        context: {},
        params: {}
      });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        errors: { general: 'Invalid email or password' }
      });
    });
  });

  describe('register action', () => {
    it('should create new user with valid data', async () => {
      const mockUser = {
        id: '1',
        email: 'new@example.com',
        username: 'newuser'
      };

      const { createUser } = await import('~/lib/db/connection');
      const { createUserSession } = await import('~/lib/auth/session');
      
      vi.mocked(createUser).mockResolvedValue(mockUser);
      vi.mocked(createUserSession).mockResolvedValue({});

      const formData = new FormData();
      formData.append('email', 'new@example.com');
      formData.append('username', 'newuser');
      formData.append('password', 'password123');

      const request = createMockRequest({
        method: 'POST',
        formData
      });

      const response = await registerAction({
        request,
        context: {},
        params: {}
      });

      expect(response).toEqual(json({ success: true, user: mockUser }));
    });

    it('should validate email format', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');
      formData.append('username', 'user');
      formData.append('password', 'password123');

      const request = createMockRequest({
        method: 'POST',
        formData
      });

      const response = await registerAction({
        request,
        context: {},
        params: {}
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        errors: { email: 'Invalid email format' }
      });
    });
  });
});