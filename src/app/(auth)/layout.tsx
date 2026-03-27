'use client';

import { useAuth } from '@/context/AuthContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  // While checking auth, show nothing (AuthContext will redirect if logged in)
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  // Already logged in — AuthContext route guard will redirect, render nothing
  if (isAuthenticated) return null;

  return <>{children}</>;
}
