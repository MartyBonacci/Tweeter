import { useState, useEffect } from 'react';

interface CurrentUser {
  userId: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  email?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Parse token to get username
        const payload = JSON.parse(atob(token.split('.')[1]));
        const username = payload.username;

        // Fetch complete user profile
        const response = await fetch(`/api/users/${username}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser({
            userId: data.user.id,
            username: data.user.username,
            displayName: data.user.displayName,
            bio: data.user.bio,
            avatar: data.user.avatar,
            email: data.user.email
          });
        } else {
          setError('Failed to fetch user profile');
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        setError('Failed to fetch user profile');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();

    // Listen for storage changes (login/logout)
    window.addEventListener('storage', fetchCurrentUser);
    
    // Custom event for token changes
    window.addEventListener('tokenChanged', fetchCurrentUser);

    return () => {
      window.removeEventListener('storage', fetchCurrentUser);
      window.removeEventListener('tokenChanged', fetchCurrentUser);
    };
  }, []);

  return { user, isLoading, error };
}