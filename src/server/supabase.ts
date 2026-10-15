// Service-role Supabase client and request authentication for the functions.
// The browser never gets the service role key; every function checks the
// caller's JWT first and only then reads or writes on their behalf.
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { HandlerEvent } from '@netlify/functions';
import { HttpError } from './http';
import { planFor, Plan, startOfMonthIso } from '../lib/plans';

let admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase server env is not set');
    admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return admin;
}

export async function requireUser(event: HandlerEvent): Promise<User> {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Please sign in.');
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Your session expired. Please sign in again.');
  return data.user;
}

export async function ensureProfile(user: User) {
  const db = supabaseAdmin();
  const { data } = await db.from('gs_profiles').select('*').eq('id', user.id).maybeSingle();
  if (data) return data;
  const row = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
  };
  const { data: created, error } = await db.from('gs_profiles').upsert(row).select('*').single();
  if (error) throw error;
  return created;
}

export async function getSubscription(userId: string) {
  const { data } = await supabaseAdmin()
    .from('gs_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function getPlan(userId: string): Promise<Plan> {
  const sub = await getSubscription(userId);
  return planFor(sub?.plan, sub?.status);
}

// Documents that count against this month's allowance (failed ones don't).
export async function docsUsedThisMonth(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from('gs_docs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'failed')
    .gte('created_at', startOfMonthIso());
  if (error) throw error;
  return count || 0;
}
