import type { ActionFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import TweetForm from '~/components/TweetForm';
import Navigation from '~/components/Navigation';

export const meta: MetaFunction = () => {
  return [
    { title: 'Compose Tweet - Tweeter' },
    { name: 'description', content: 'Share your thoughts in 141 characters' },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const content = formData.get('content') as string;

  // Client-side validation already done, but double-check
  if (!content || content.trim().length === 0) {
    return json(
      { error: 'Tweet cannot be empty' },
      { status: 400 }
    );
  }

  if (content.length > 141) {
    return json(
      { error: 'Tweet cannot exceed 141 characters' },
      { status: 400 }
    );
  }

  try {
    // POST to backend API with session cookie
    const response = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/tweets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('Cookie') || '',
        },
        body: JSON.stringify({ content: content.trim() }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated - redirect to login
        return redirect('/login');
      }

      const error = await response.json();
      return json(
        { error: error.error || 'Failed to post tweet' },
        { status: response.status }
      );
    }

    // Success - redirect to home page
    // TODO: In Phase 8, we can get username from session and redirect to /@username
    return redirect('/');
  } catch (error) {
    return json(
      { error: 'Failed to connect to server' },
      { status: 500 }
    );
  }
}

export default function Compose() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="py-12 px-4">
        <TweetForm />
      </div>
    </div>
  );
}
