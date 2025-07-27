import { useState, useEffect } from 'react';
import { useNavigate, useActionData, useLoaderData, useFetcher, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import { useUser } from '../hooks/useUser';
import { verifyToken } from '../lib/auth.server';
import { db } from '../db/drizzle';
import { users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

interface UserData {
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Settings page will handle authentication on the client side
  // This allows navigation without Authorization headers
  return { user: null };
}

export default function Settings() {
  const { user: initialData } = useLoaderData() as { user: UserData };
  const { user, isLoading: isAuthLoading } = useUser();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  
  const [userData, setUserData] = useState<UserData>({
    username: '',
    displayName: '',
    bio: '',
    avatar: ''
  });
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  const isLoading = fetcher.state === 'submitting';
  const actionData = fetcher.data as { error?: string; success?: boolean };
  const error = actionData?.error || null;
  const success = actionData?.success || false;

  useEffect(() => {
    // Only redirect after auth loading is complete
    if (!isAuthLoading && !user) {
      navigate('/login');
      return;
    }

    if (!user || isAuthLoading) {
      return; // Still loading
    }

    // Fetch user data from API
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
        setUserData({
          username: data.username || '',
          displayName: data.displayName || '',
          bio: data.bio || '',
          avatar: data.avatar || ''
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Store token in a cookie or use client action
    const formData = new FormData();
    formData.append('displayName', userData.displayName);
    formData.append('username', userData.username);
    formData.append('bio', userData.bio || '');
    formData.append('avatar', userData.avatar || '');
    formData.append('token', token); // Pass token as form field

    fetcher.submit(formData, {
      method: 'POST',
      action: '/settings',
      encType: 'application/x-www-form-urlencoded'
    });
  };

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
            {(isLoadingUser || isAuthLoading) ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  Profile updated successfully!
                </div>
              )}

              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={userData.displayName}
                  onChange={(e) => setUserData({ ...userData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={50}
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={userData.username}
                  onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  pattern="[a-zA-Z0-9_]+"
                  title="Username can only contain letters, numbers, and underscores"
                  maxLength={15}
                  required
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={userData.bio}
                  onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={160}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  id="avatar"
                  name="avatar"
                  value={userData.avatar}
                  onChange={(e) => setUserData({ ...userData, avatar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save changes'}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate(`/users/${user?.username || ''}`)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
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

    const displayName = formData.get('displayName') as string;
    const username = formData.get('username') as string;
    const bio = formData.get('bio') as string;
    const avatar = formData.get('avatar') as string;

    if (!displayName || !username) {
      return Response.json({ error: 'Display name and username are required' }, { status: 400 });
    }

    if (username.length > 15) {
      return Response.json({ error: 'Username must be 15 characters or less' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return Response.json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 });
    }

    if (bio && bio.length > 160) {
      return Response.json({ error: 'Bio must be 160 characters or less' }, { status: 400 });
    }

    // Check if username is already taken by another user
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));

    const conflictingUser = existingUsers.find(u => u.id !== userPayload.userId);
    if (conflictingUser) {
      return Response.json({ error: 'Username is already taken' }, { status: 400 });
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