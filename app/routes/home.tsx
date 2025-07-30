import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import { Timeline } from '../components/Timeline';
import { useUser } from '../hooks/useUser';
import { useEffect } from 'react';
import { useNavigate, data, type ActionFunctionArgs } from 'react-router';
import { verifyToken } from '../lib/auth.server';
import { db } from '../db/drizzle';
import { tweets } from '../db/schema/tweets';
import { tweetContentSchema } from '../lib/schemas';
import { validateFormData, createValidationErrorResponse } from '../lib/validation-middleware';

export default function Home() {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex max-w-7xl mx-auto">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
          <div className="border-b border-gray-200 p-4">
            <h1 className="text-xl font-bold">Home</h1>
          </div>
          
          <Timeline />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get token from form data since React Router doesn't send custom headers
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const content = formData.get('content');
    
    if (!token) {
      return data({ error: 'Authentication required' }, { status: 401 });
    }

    // Manually verify the token
    let userPayload;
    try {
      userPayload = verifyToken(token);
    } catch (error) {
      return data({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Create a new FormData with just the content for validation
    const contentFormData = new FormData();
    contentFormData.set('content', content as string);
    
    const validation = validateFormData(contentFormData, tweetContentSchema);
    if (!validation.isValid) {
      return data({ errors: validation.errors }, { status: 400 });
    }

    const [tweet] = await db.insert(tweets)
      .values({
        user_id: userPayload.userId,
        content: validation.data.content, // Already trimmed by Zod
      })
      .returning();

    return data({ tweet, success: true });
  } catch (error) {
    console.error('Error creating tweet:', error);
    return data({ error: 'Failed to create tweet' }, { status: 500 });
  }
}