'use client';

import {
  createContext, useContext, useEffect,
  useState, useCallback, useRef,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_PATHS = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const router   = useRouter();
  const pathname = usePathname();
  const checked  = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    refreshUser();
  }, [refreshUser]);

  // Route guard — fires after loading resolves
  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
    if (!user && !isPublic) {
      router.replace('/login');
    }
    if (user && isPublic) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, pathname, router]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    setUser(data.user);
    router.push('/dashboard');
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      isAuthenticated: !!user,
      login, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
