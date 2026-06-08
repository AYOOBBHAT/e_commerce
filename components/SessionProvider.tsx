'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export type User = {
  id: string;
  name?: string;
  email?: string;
  role: string;
} | null;

type SessionContextValue = {
  user: User;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  setUser: (user: User) => void;
};

export const SessionContext = createContext<SessionContextValue>({
  user: null,
  isLoading: true,
  refreshSession: async () => {},
  setUser: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

async function fetchProfile(userId: string) {
  const profileResponse = await fetch(`/api/users/${userId}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!profileResponse.ok) return null;
  return profileResponse.json();
}

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const enrichUserProfile = useCallback(async (sessionUser: NonNullable<User>) => {
    try {
      const profileData = await fetchProfile(sessionUser.id);
      if (!mountedRef.current || !profileData) return;
      setUser((prev) =>
        prev?.id === sessionUser.id ? { ...prev, ...profileData } : prev,
      );
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        if (mountedRef.current) setUser(null);
        return;
      }

      const data = await response.json();
      if (!mountedRef.current) return;

      if (data.user) {
        const sessionUser = {
          id: data.user.id,
          role: data.user.role || 'user',
        };
        setUser(sessionUser);
        void enrichUserProfile(sessionUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      if (mountedRef.current) setUser(null);
      console.error('Failed to fetch session:', error);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [enrichUserProfile]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const refreshSession = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  return (
    <SessionContext.Provider value={{ user, isLoading, refreshSession, setUser }}>
      {children}
    </SessionContext.Provider>
  );
}
