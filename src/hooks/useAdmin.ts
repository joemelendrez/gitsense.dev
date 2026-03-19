import { useAuthStore } from '../store/auth';

export function useAdmin(): boolean {
  const { profile } = useAuthStore();
  return profile?.role === 'admin';
}
