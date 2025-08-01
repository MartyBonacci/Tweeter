import { z } from 'zod';

export const createTweetSchema = z.object({
  content: z.string()
    .min(1, 'Tweet content is required')
    .max(140, 'Tweet must be 140 characters or less'),
});

export const updateTweetSchema = z.object({
  content: z.string()
    .min(1, 'Tweet content is required')
    .max(140, 'Tweet must be 140 characters or less'),
});

export const tweetQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().uuid().optional(),
  username: z.string().optional(),
});

export type CreateTweetInput = z.infer<typeof createTweetSchema>;
export type UpdateTweetInput = z.infer<typeof updateTweetSchema>;
export type TweetQueryParams = z.infer<typeof tweetQuerySchema>;