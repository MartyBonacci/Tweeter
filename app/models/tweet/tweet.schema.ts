import { z } from 'zod';

export const tweetSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content is required')
    .max(140, 'Tweet must be 140 characters or less'),
});

export const tweetUpdateSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content is required')
    .max(140, 'Tweet must be 140 characters or less'),
});

export const paginationSchema = z.object({
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100).default(20)),
  offset: z
    .string()
    .transform(Number)
    .pipe(z.number().min(0).default(0)),
});

export type TweetData = z.infer<typeof tweetSchema>;
export type TweetUpdateData = z.infer<typeof tweetUpdateSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;