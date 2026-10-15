// src/store/auth.ts - Add social login methods
import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { api, Account } from '../lib/api';

// Keeps the old profile shape the Header and older pages read.
function toProfile(account: Account) {
  return {
    full_name: account.profile.full_name,
    role: account.profile.role,
    subscription_tier: account.plan,
    usage_count: account.docsUsed,
  };
}

interface AuthState {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithProvider: (provider: 'github' | 'google') => Promise<void>;
  signOut: () => Promise<void>;
  account: Account | null;
  refreshAccount: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;

    // Profile will be created automatically by the trigger
  },

  signInWithProvider: async (provider: 'github' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/app/`,
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, profile: null, account: null });
  },

  account: null,

  refreshAccount: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const account = await api<Account>('account');
      set({ account, profile: toProfile(account) });
    } catch (error) {
      console.error('Could not load account', error);
    }
  },

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        set({ user: session.user, loading: false });
        // Plan, usage and role come from the server (service role), so a
        // browser can't grant itself a plan by writing to a table.
        await get().refreshAccount();
      } else {
        set({ user: null, profile: null, account: null, loading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ loading: false });
    }
  },
}));

// Listen to auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  const { initialize } = useAuthStore.getState();
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    await initialize();
  }
});
