import { useState, useEffect } from 'react';
import { useNavigate, useActionData, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import { ProfileEditForm } from '../components/ProfileEditForm';
import { useUser } from '../hooks/useUser';
import { verifyToken } from '../lib/auth.server';
import { db } from '../db/drizzle';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { userProfileUpdateSchema } from '../lib/schemas';
import { validateFormData } from '../lib/validation-middleware';

interface UserData {
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
}

interface ActionData {
  error?: string;
  errors?: Array<{field: string; message: string}>;
  success?: boolean;
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Try to get token from cookie or Authorization header
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieHeader) {
      // Try to extract token from cookies if needed
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      if (tokenMatch) {
        token = tokenMatch[1];
      }
    }
    
    // If no token found, return null and let client handle auth
    // This is normal for initial page loads from client-side routing
    if (!token) {
      return { user: null, error: null };
    }
    
    // Verify token and get user data
    const userPayload = verifyToken(token);
    
    // Fetch user data from database
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        display_name: users.display_name,
        bio: users.bio,
        avatar_url: users.avatar_url,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, userPayload.userId))
      .limit(1);
    
    if (!user) {
      return { user: null, error: 'User not found' };
    }
    
    const userData = {
      username: user.username,
      displayName: user.display_name || '',
      bio: user.bio || '',
      avatar: user.avatar_url || ''
    };
    
    return { 
      user: userData, 
      error: null 
    };
  } catch (error) {
    // Return null user so client can handle auth
    return { user: null, error: null };
  }
}

export default function Settings() {
  const { user: initialData, error: loaderError } = useLoaderData() as { user: UserData | null; error: string | null };
  const { user, isLoading: isAuthLoading } = useUser();
  const navigate = useNavigate();
  const actionData = useActionData() as ActionData;
  
  const [token, setToken] = useState('');
  const [userData, setUserData] = useState<UserData | null>(initialData);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // Set token from localStorage on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '');
    }
  }, []);

  useEffect(() => {
    // Only redirect after auth loading is complete
    if (!isAuthLoading && !user) {
      navigate('/login');
      return;
    }

    if (!user || isAuthLoading) {
      return; // Still loading
    }

    // If no user data yet, fetch from API
    if (!userData) {
      setIsLoadingUserData(true);
      const fetchUserData = async () => {
        try {
          const token = localStorage.getItem('token');
          
          if (!token) {
            navigate('/login');
            return;
          }

          const response = await fetch(`/api/users/${user.username}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          const data = await response.json();
          
          // API returns data.user object with the user info
          const userInfo = data.user || data;
          const fetchedUserData = {
            username: userInfo.username || '',
            displayName: userInfo.displayName || '',
            bio: userInfo.bio || '',
            avatar: userInfo.avatar || ''
          };
          
          setUserData(fetchedUserData);
          
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoadingUserData(false);
        }
      };

      fetchUserData();
    }
  }, [user, navigate, userData, isAuthLoading]);


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex max-w-7xl mx-auto">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
          <div className="border-b border-gray-200 p-4">
            <h1 className="text-xl font-bold">Edit profile</h1>
          </div>

          <div className="max-w-lg mx-auto p-4">
            {(isLoadingUserData || isAuthLoading || !userData) ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <div className="text-gray-500">Loading your profile...</div>
                </div>
              </div>
            ) : (
              <ProfileEditForm
                userData={userData}
                token={token}
                actionData={actionData}
                onCancel={() => navigate(`/users/${user?.username || ''}`)}
              />
            )}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Get token from form data since React Router doesn't send custom headers
    const formData = await request.formData();
    const token = formData.get('token') as string;
    
    if (!token) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Manually verify the token
    let userPayload;
    try {
      userPayload = verifyToken(token);
    } catch (error) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Validate form data using Zod schema
    const validation = validateFormData(formData, userProfileUpdateSchema);
    
    if (!validation.isValid) {
      return Response.json({ errors: validation.errors }, { status: 400 });
    }
    
    const { displayName, username, bio, avatar } = validation.data;

    // Check if username is already taken by another user
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));

    const conflictingUser = existingUsers.find(u => u.id !== userPayload.userId);
    if (conflictingUser) {
      return Response.json({ 
        errors: [{ field: 'username', message: 'Username is already taken' }] 
      }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        display_name: displayName,
        username: username,
        bio: bio || null,
        avatar_url: avatar || null,
        updated_at: new Date()
      })
      .where(eq(users.id, userPayload.userId));

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.error('Error updating profile:', error);
    return Response.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}