import { z } from 'zod';

// Tweet schema for posting tweets
export const TweetSchema = z.object({
  content: z
    .string()
    .trim() // Remove leading/trailing whitespace
    .min(1, 'Tweet cannot be empty')
    .max(141, 'Tweet exceeds 141 characters'),
});

// Export TypeScript type derived from Zod schema
export type TweetInput = z.infer<typeof TweetSchema>;
