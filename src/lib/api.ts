// Calls our Netlify functions with the signed-in user's token.
import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string, public plan?: string) {
    super(message);
  }
}

export async function api<T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const doFetch = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return fetch(`/api/${path}`, {
      method: init.method || (init.body ? 'POST' : 'GET'),
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  };

  let res = await doFetch();
  if (res.status === 401) {
    // A background tab can hold an expired token; refresh once and retry.
    const { error } = await supabase.auth.refreshSession();
    if (!error) res = await doFetch();
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON (a platform error page): fall through to a readable message.
  }
  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status}).`, res.status, data?.code, data?.plan);
  }
  return data as T;
}

export interface Account {
  profile: { id: string; email: string; full_name: string | null; role: 'user' | 'admin' };
  plan: 'free' | 'pro' | 'team';
  status: string;
  currentPeriodEnd: string | null;
  hasBilling: boolean;
  docsUsed: number;
  docsLimit: number | null;
  github: { login: string; scopes: string } | null;
}
