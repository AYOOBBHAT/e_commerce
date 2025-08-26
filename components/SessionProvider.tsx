'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type User = {
  id: string;
  name?: string;
  email?: string;
  role: string;
} | null;

export const SessionContext = createContext<{
  user: User;
  refreshSession: () => Promise<void>;
}>({
  user: null,
  refreshSession: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
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
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      setUser(null);
      console.error('Failed to fetch session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const refreshSession = async () => {
    setIsLoading(true);
    await checkSession();
  };

  if (isLoading) {
    return null;
  }

  return (
    <SessionContext.Provider value={{ user, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}