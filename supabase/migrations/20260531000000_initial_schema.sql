-- AgentHQ initial schema
-- Run this in Supabase Dashboard → SQL Editor

-- ─── Profiles ─────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  email text not null default '',
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Agents (ready for Phase 2) ───────────────────────────────
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  role text not null default '',
  emblem text not null default 'triStack',
  grad_key text not null default 'aa',
  status text not null default 'offline' check (status in ('online', 'away', 'busy', 'offline')),
  activity text not null default '',
  origin text not null default '',
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agents enable row level security;

create policy "Users can manage own agents"
  on public.agents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Tasks (ready for Phase 2) ────────────────────────────────
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  title text not null,
  status text not null default 'open' check (status in ('open', 'doing', 'review', 'done')),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Messages (ready for Phase 2) ─────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  role text not null check (role in ('user', 'agent')),
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can manage own messages"
  on public.messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Memories (ready for Phase 2) ─────────────────────────────
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  text text not null,
  category text not null default 'general',
  created_at timestamptz not null default now()
);

alter table public.memories enable row level security;

create policy "Users can manage own memories"
  on public.memories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
