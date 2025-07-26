import { useState, useEffect } from 'react';

interface User {
  userId: string;
  username: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const updateUser = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // JWT tokens have 3 parts separated by dots
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            userId: payload.userId,
            username: payload.username
          });
        } catch (error) {
          console.error('Invalid token:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    updateUser();

    // Listen for storage changes (login/logout)
    window.addEventListener('storage', updateUser);
    
    // Custom event for token changes
    window.addEventListener('tokenChanged', updateUser);

    return () => {
      window.removeEventListener('storage', updateUser);
      window.removeEventListener('tokenChanged', updateUser);
    };
  }, []);

  return user;
}