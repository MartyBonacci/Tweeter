import { describe, it, expect, vi, beforeEach } from 'vitest';
import { json } from '@remix-run/node';
import { loader as postsLoader } from '~/routes/posts';
import { loader as postLoader } from '~/routes/posts.$postId';
import { loader as profileLoader } from '~/routes/profile.$username';
import { createMockContext, createMockRequest } from '../helpers/test-helpers';

vi.mock('~/lib/db/connection', () => ({
  getPosts: vi.fn(),
  getPostById: vi.fn(),
  getUserByUsername: vi.fn(),
  getUserPosts: vi.fn(),
}));

describe('Post Loaders', () => {
  describe('posts loader', () => {
    it('should return all posts with pagination', async () => {
      const mockPosts = [
        { id: '1', title: 'Test Post', content: 'Test content', author: { username: 'testuser' } },
      ];
      const { getPosts } = await import('~/lib/db/connection');
      vi.mocked(getPosts).mockResolvedValue(mockPosts);

      const request = createMockRequest({ url: '/posts?page=1' });
      const response = await postsLoader({ request, context: {}, params: {} });
      
      expect(response).toEqual(json({ posts: mockPosts, hasMore: false }));
    });

    it('should handle empty posts list', async () => {
      const { getPosts } = await import('~/lib/db/connection');
      vi.mocked(getPosts).mockResolvedValue([]);

      const request = createMockRequest({ url: '/posts' });
      const response = await postsLoader({ request, context: {}, params: {} });
      
      expect(response).toEqual(json({ posts: [], hasMore: false }));
    });

    it('should handle database errors', async () => {
      const { getPosts } = await import('~/lib/db/connection');
      vi.mocked(getPosts).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({ url: '/posts' });
      
      await expect(postsLoader({ request, context: {}, params: {} }))
        .rejects.toThrow('Database error');
    });
  });

  describe('post detail loader', () => {
    it('should return post by id', async () => {
      const mockPost = { 
        id: '1', 
        title: 'Test Post', 
        content: 'Test content',
        author: { username: 'testuser' },
        comments: []
      };
      const { getPostById } = await import('~/lib/db/connection');
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const response = await postLoader({ 
        request: createMockRequest(), 
        context: {}, 
        params: { postId: '1' } 
      });
      
      expect(response).toEqual(json({ post: mockPost }));
    });

    it('should return 404 for non-existent post', async () => {
      const { getPostById } = await import('~/lib/db/connection');
      vi.mocked(getPostById).mockResolvedValue(null);

      await expect(postLoader({ 
        request: createMockRequest(), 
        context: {}, 
        params: { postId: '999' } 
      })).rejects.toThrow('Post not found');
    });
  });

  describe('profile loader', () => {
    it('should return user profile with posts', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        posts: [
          { id: '1', title: 'User Post' }
        ]
      };
      const { getUserByUsername, getUserPosts } = await import('~/lib/db/connection');
      vi.mocked(getUserByUsername).mockResolvedValue(mockUser);
      vi.mocked(getUserPosts).mockResolvedValue(mockUser.posts);

      const response = await profileLoader({ 
        request: createMockRequest(), 
        context: {}, 
        params: { username: 'testuser' } 
      });
      
      expect(response).toEqual(json({ user: mockUser, posts: mockUser.posts }));
    });
  });
});