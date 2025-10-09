import { z } from 'zod';

// Like schema for liking tweets
export const LikeSchema = z.object({
  tweetId: z.string().uuid('Invalid tweet ID format'),
});

// Export TypeScript type derived from Zod schema
export type LikeInput = z.infer<typeof LikeSchema>;
