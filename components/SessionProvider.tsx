'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layouts/Header';

type User = {
  id: string;
  name?: string;
  email?: string;
  role: string;
} | null;

export default function SessionProvider() {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // Set initial user data from session
            setUser(data.user);
            
            // If we have a user ID, fetch the full profile
            if (data.user.id) {
              try {
                const profileResponse = await fetch(`/api/users/${data.user.id}`);
                if (profileResponse.ok) {
                  const profileData = await profileResponse.json();
                  setUser(prev => ({
                    ...prev,
                    ...profileData,
                  }));
                }
              } catch (error) {
                console.error('Failed to fetch user profile:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  if (isLoading) {
    return null;
  }

  return <Header user={user} />;
}