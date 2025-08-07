import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TweetService } from '../tweet.service';
import { db } from '~/lib/db/connection';
import { tweets, users, likes } from '~/lib/db/schema';

vi.mock('~/lib/db/connection');

const mockTweet = {
  id: 'tweet-123',
  content: 'Test tweet content',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  userId: 'user-123',
  user: {
    id: 'user-123',
    username: 'testuser',
    name: 'Test User',
  },
  likeCount: 5,
};

describe('TweetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new tweet', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'tweet-123' }]),
      });

      const mockSelect = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockTweet]),
      });

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await TweetService.create({
        content: 'Test tweet content',
        userId: 'user-123',
      });

      expect(result).toEqual(mockTweet);
    });
  });

  describe('findById', () => {
    it('should find tweet by id', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockTweet]),
      });

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await TweetService.findById('tweet-123');
      expect(result).toEqual(mockTweet);
    });

    it('should return null for non-existent tweet', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await TweetService.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find tweets by user id', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockTweet]),
        offset: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      });

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await TweetService.findByUserId('user-123', 10, 0);
      expect(result).toEqual([mockTweet]);
    });
  });

  describe('update', () => {
    it('should update tweet if user is owner', async () => {
      const mockFind = vi.spyOn(TweetService, 'findById').mockResolvedValue({
        ...mockTweet,
        userId: 'user-123',
      });

      const mockUpdate = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'tweet-123' }]),
      });

      const mockSelect = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ ...mockTweet, content: 'Updated content' }]),
      });

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);
      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await TweetService.update('tweet-123', 'user-123', {
        content: 'Updated content',
      });

      expect(result.content).toBe('Updated content');
      mockFind.mockRestore();
    });

    it('should throw error if user is not owner', async () => {
      vi.spyOn(TweetService, 'findById').mockResolvedValue({
        ...mockTweet,
        userId: 'other-user',
      });

      await expect(
        TweetService.update('tweet-123', 'user-123', { content: 'Updated' })
      ).rejects.toThrow('Unauthorized to update this tweet');
    });
  });

  describe('delete', () => {
    it('should delete tweet if user is owner', async () => {
      vi.spyOn(TweetService, 'findById').mockResolvedValue({
        ...mockTweet,
        userId: 'user-123',
      });

      const mockDelete = vi.fn().mockReturnValue({ count: 1 });
      vi.mocked(db.delete).mockReturnValue(mockDelete as any);

      await TweetService.delete('tweet-123', 'user-123');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error if tweet does not exist', async () => {
      vi.spyOn(TweetService, 'findById').mockResolvedValue(null);

      await expect(TweetService.delete('non-existent', 'user-123'))
        .rejects.toThrow('Tweet not found');
    });
  });
});