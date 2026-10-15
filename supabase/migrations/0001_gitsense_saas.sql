-- GitSense docs SaaS schema.
-- Lives in the shared Supabase project (same one as Handoff Hero and russvitale),
-- so every table is prefixed gs_ and nothing touches the other apps' tables.
-- Not applied automatically: run it once in the SQL editor (or via MCP).

-- One row per GitSense user. Created lazily by the account function
-- (service role), never by the browser, so role/plan can't be self-assigned.
create table if not exists public.gs_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.gs_profiles enable row level security;
create policy "gs_profiles: read own" on public.gs_profiles
  for select to authenticated using (auth.uid() = id);

-- Billing state, written only by the Stripe webhook (service role).
create table if not exists public.gs_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  status text not null default 'inactive',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.gs_subscriptions enable row level security;
create policy "gs_subscriptions: read own" on public.gs_subscriptions
  for select to authenticated using (auth.uid() = user_id);

-- GitHub OAuth token (AES-256-GCM encrypted by the functions with
-- GS_TOKEN_KEY). No client policy at all: only the service role reads it.
create table if not exists public.gs_github_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  github_login text,
  scopes text,
  token_ciphertext text not null,
  updated_at timestamptz not null default now()
);
alter table public.gs_github_tokens enable row level security;

-- Every generated document. Inserted by docs-start, filled in by the
-- background generator. The browser reads its own rows (polling for status).
create table if not exists public.gs_docs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  repo_full_name text not null,
  repo_private boolean not null default false,
  ref text,
  kind text not null check (kind in ('readme', 'architecture', 'onboarding', 'changelog')),
  options jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  title text,
  content text,
  error text,
  model text,
  input_tokens integer,
  output_tokens integer,
  share_token text unique,
  pr_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gs_docs_user_created on public.gs_docs (user_id, created_at desc);
alter table public.gs_docs enable row level security;
create policy "gs_docs: read own" on public.gs_docs
  for select to authenticated using (auth.uid() = user_id);
create policy "gs_docs: delete own" on public.gs_docs
  for delete to authenticated using (auth.uid() = user_id);

-- Saved results from the older free tools (Repo Explorer, Code Summarizer).
create table if not exists public.gs_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  repository_url text not null,
  analysis_type text not null check (analysis_type in ('structure', 'code_summary', 'ai_enhanced')),
  content jsonb,
  created_at timestamptz not null default now()
);
alter table public.gs_analyses enable row level security;
create policy "gs_analyses: own rows" on public.gs_analyses
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
