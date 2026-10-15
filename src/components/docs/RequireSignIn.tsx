import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/auth';

// Shows a sign-in prompt instead of the page for signed-out visitors.
export const RequireSignIn: React.FC<{ children: React.ReactNode; message?: string }> = ({ children, message }) => {
  const { user, loading } = useAuthStore();
  if (loading) {
    return <div className="py-24 text-center text-gray-500">Loading…</div>;
  }
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Sign in to continue</h1>
        <p className="text-gray-600 mb-8">{message || 'Your docs workspace lives in your account.'}</p>
        <div className="flex justify-center gap-3">
          <Link href="/auth/signin">
            <Button variant="outline">Sign in</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Create a free account</Button>
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
