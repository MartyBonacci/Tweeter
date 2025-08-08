import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleGetTweets,
  handleCreateTweet,
  handleGetTweetById,
  handleUpdateTweet,
  handleDeleteTweet,
  handleLikeTweet,
} from '../../handlers/tweets.handler';
import { createMockRequest, createAuthenticatedRequest, createQueryParams } from '../test-utils';

// Mock the model functions
vi.mock('../../../models/tweet', () => ({
  findAllTweets: vi.fn(),
  findTweetsByUserId: vi.fn(),
  findTweetById: vi.fn(),
  createTweet: vi.fn(),
  updateTweet: vi.fn(),
  deleteTweet: vi.fn(),
}));

vi.mock('../../../models/like', () => ({
  likeTweet: vi.fn(),
  unlikeTweet: vi.fn(),
  hasUserLikedTweet: vi.fn(),
}));

import * as tweetModel from '../../../models/tweet';
import * as likeModel from '../../../models/like';

describe('Tweet Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('handleGetTweets', () => {
    it('should return all tweets with default pagination', async () => {
      const mockTweets = [
        { id: '1', content: 'Tweet 1' },
        { id: '2', content: 'Tweet 2' },
      ];
      vi.mocked(tweetModel.findAllTweets).mockResolvedValue(mockTweets as any);
      
      const request = createMockRequest({
        method: 'GET',
        path: '/api/tweets',
      });
      
      const response = await handleGetTweets(request);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        tweets: mockTweets,
        pagination: {
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      });
      expect(tweetModel.findAllTweets).toHaveBeenCalledWith(20, 0);
    });
    
    it('should respect query parameters', async () => {
      vi.mocked(tweetModel.findAllTweets).mockResolvedValue([]);
      
      const request = createMockRequest({
        method: 'GET',
        path: '/api/tweets',
        query: createQueryParams({ limit: '10', offset: '20' }),
      });
      
      await handleGetTweets(request);
      
      expect(tweetModel.findAllTweets).toHaveBeenCalledWith(10, 20);
    });
    
    it('should filter by userId when provided', async () => {
      vi.mocked(tweetModel.findTweetsByUserId).mockResolvedValue([]);
      
      const request = createMockRequest({
        method: 'GET',
        path: '/api/tweets',
        query: createQueryParams({ userId: 'user-123' }),
      });
      
      await handleGetTweets(request);
      
      expect(tweetModel.findTweetsByUserId).toHaveBeenCalledWith('user-123', 20, 0);
      expect(tweetModel.findAllTweets).not.toHaveBeenCalled();
    });
    
    it('should limit max results to 100', async () => {
      vi.mocked(tweetModel.findAllTweets).mockResolvedValue([]);
      
      const request = createMockRequest({
        query: createQueryParams({ limit: '200' }),
      });
      
      await handleGetTweets(request);
      
      expect(tweetModel.findAllTweets).toHaveBeenCalledWith(100, 0);
    });
  });
  
  describe('handleCreateTweet', () => {
    it('should create a tweet for authenticated user', async () => {
      const mockTweet = { id: 'tweet-123', content: 'New tweet' };
      vi.mocked(tweetModel.createTweet).mockResolvedValue(mockTweet as any);
      
      const request = createAuthenticatedRequest(
        { id: 'user-123' },
        {
          method: 'POST',
          path: '/api/tweets',
          body: { content: 'New tweet' },
        }
      );
      
      const response = await handleCreateTweet(request);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        tweet: mockTweet,
        message: 'Tweet created successfully',
      });
      expect(tweetModel.createTweet).toHaveBeenCalledWith({
        content: 'New tweet',
        userId: 'user-123',
      });
    });
    
    it('should return 401 for unauthenticated user', async () => {
      const request = createMockRequest({
        method: 'POST',
        path: '/api/tweets',
        body: { content: 'New tweet' },
      });
      
      const response = await handleCreateTweet(request);
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
      expect(tweetModel.createTweet).not.toHaveBeenCalled();
    });
    
    it('should return 400 for invalid data', async () => {
      const request = createAuthenticatedRequest(
        { id: 'user-123' },
        {
          method: 'POST',
          path: '/api/tweets',
          body: { content: '' }, // Empty content should fail validation
        }
      );
      
      const response = await handleCreateTweet(request);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(tweetModel.createTweet).not.toHaveBeenCalled();
    });
  });
  
  describe('handleGetTweetById', () => {
    it('should return tweet by id', async () => {
      const mockTweet = { id: 'tweet-123', content: 'Test tweet' };
      vi.mocked(tweetModel.findTweetById).mockResolvedValue(mockTweet as any);
      
      const request = createMockRequest({
        method: 'GET',
        path: '/api/tweets/tweet-123',
        params: { id: 'tweet-123' },
      });
      
      const response = await handleGetTweetById(request);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ tweet: mockTweet });
      expect(tweetModel.findTweetById).toHaveBeenCalledWith('tweet-123');
    });
    
    it('should return 404 for non-existent tweet', async () => {
      vi.mocked(tweetModel.findTweetById).mockResolvedValue(null);
      
      const request = createMockRequest({
        method: 'GET',
        path: '/api/tweets/non-existent',
        params: { id: 'non-existent' },
      });
      
      const response = await handleGetTweetById(request);
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Tweet not found' });
    });
    
    it('should return 400 if id is missing', async () => {
      const request = createMockRequest({
        method: 'GET',
        path: '/api/tweets/',
        params: {},
      });
      
      const response = await handleGetTweetById(request);
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Tweet ID is required' });
    });
  });
  
  describe('handleLikeTweet', () => {
    it('should like a tweet if not already liked', async () => {
      vi.mocked(likeModel.hasUserLikedTweet).mockResolvedValue(false);
      vi.mocked(likeModel.likeTweet).mockResolvedValue(undefined);
      
      const request = createAuthenticatedRequest(
        { id: 'user-123' },
        {
          method: 'POST',
          path: '/api/tweets/tweet-123/like',
          params: { id: 'tweet-123' },
        }
      );
      
      const response = await handleLikeTweet(request);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Tweet liked successfully',
        liked: true,
      });
      expect(likeModel.likeTweet).toHaveBeenCalledWith('user-123', 'tweet-123');
      expect(likeModel.unlikeTweet).not.toHaveBeenCalled();
    });
    
    it('should unlike a tweet if already liked', async () => {
      vi.mocked(likeModel.hasUserLikedTweet).mockResolvedValue(true);
      vi.mocked(likeModel.unlikeTweet).mockResolvedValue(undefined);
      
      const request = createAuthenticatedRequest(
        { id: 'user-123' },
        {
          method: 'POST',
          path: '/api/tweets/tweet-123/like',
          params: { id: 'tweet-123' },
        }
      );
      
      const response = await handleLikeTweet(request);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Tweet unliked successfully',
        liked: false,
      });
      expect(likeModel.unlikeTweet).toHaveBeenCalledWith('user-123', 'tweet-123');
      expect(likeModel.likeTweet).not.toHaveBeenCalled();
    });
  });
});