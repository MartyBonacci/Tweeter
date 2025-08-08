import type { LoaderFunctionArgs, ActionFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { z } from 'zod';
import type { AuthenticatedRequest } from '~/lib/middleware/auth';
import { requireAuth } from '~/lib/middleware/auth';
import { sanitizeInput } from '~/lib/middleware/security';
import { findTweetById, updateTweet, deleteTweet } from '~/models/tweet/tweet.model';
import { tweetUpdateSchema } from '~/models/tweet/tweet.validator';

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const tweetId = params.id;
    
    if (!tweetId) {
      return json({ error: 'Tweet ID is required' }, { status: 400 });
    }

    const tweet = await findTweetById(tweetId);

    if (!tweet) {
      return json({ error: 'Tweet not found' }, { status: 404 });
    }

    return json({ tweet });
  } catch (error) {
    console.error('Error fetching tweet:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const action = requireAuth(async ({ request, params }: ActionFunctionArgs & { request: AuthenticatedRequest }) => {
  try {
    const tweetId = params.id;
    
    if (!tweetId) {
      return json({ error: 'Tweet ID is required' }, { status: 400 });
    }

    const user = request.user!; // Safe because requireAuth ensures user exists

    const method = request.method;

    if (method === 'PUT') {
      const formData = await request.formData();
      const data = Object.fromEntries(formData);
      
      const validatedData = tweetUpdateSchema.parse({
        content: sanitizeInput(data.content || ''),
      });

      const updatedTweet = await updateTweet(tweetId, user.id, validatedData);

      return json({
        tweet: updatedTweet,
        message: 'Tweet updated successfully',
      });

    } else if (method === 'DELETE') {
      await deleteTweet(tweetId, user.id);

      return json({ message: 'Tweet deleted successfully' });
    }

    return json({ error: 'Method not allowed' }, { status: 405 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error handling tweet:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
});