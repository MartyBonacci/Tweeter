import { data, type ActionFunctionArgs } from 'react-router';
import { requireAuth } from '../lib/middleware';
import { db } from '../db/drizzle';
import { tweets } from '../db/schema/tweets';
import { validateTweetContent } from '../lib/validation';
import { z } from 'zod';

const createTweetSchema = z.object({
  content: z.string().min(1).max(140),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const content = formData.get('content');

    if (!content || typeof content !== 'string') {
      return data({ error: 'Content is required' }, { status: 400 });
    }

    const validation = validateTweetContent(content);
    if (!validation.isValid) {
      return data({ error: validation.errors[0].message }, { status: 400 });
    }

    const [tweet] = await db.insert(tweets)
      .values({
        user_id: user.userId,
        content: content.trim(),
      })
      .returning();

    return data({ tweet });
  } catch (error) {
    console.error('Error creating tweet:', error);
    return data({ error: 'Failed to create tweet' }, { status: 500 });
  }
}