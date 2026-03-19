import React from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuthStore } from '../store/auth';
import { Header } from './layout/Header';
import { Button } from './ui/Button';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface AdminGateProps {
  children: React.ReactNode;
}

export const AdminGate: React.FC<AdminGateProps> = ({ children }) => {
  const isAdmin = useAdmin();
  const { user } = useAuthStore();

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-lg mx-auto py-24 px-4 text-center">
        <Lock className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Admin Access Required
        </h1>
        <p className="text-gray-600 mb-8">
          This tool is only available to administrators.
        </p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
};
