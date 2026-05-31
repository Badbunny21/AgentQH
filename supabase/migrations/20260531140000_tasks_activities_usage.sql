-- Safe to re-run: activities + usage (fixes "policy already exists" error)
-- Run in Supabase SQL Editor

alter table public.profiles
  add column if not exists chat_messages_used int not null default 0;

alter table public.profiles
  add column if not exists usage_period_start timestamptz not null default date_trunc('month', now());

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  type text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;

drop policy if exists "Users can read own activities" on public.activities;
drop policy if exists "Users can insert own activities" on public.activities;

create policy "Users can read own activities"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "Users can insert own activities"
  on public.activities for insert
  with check (auth.uid() = user_id);

create index if not exists activities_user_created_idx
  on public.activities (user_id, created_at desc);

-- Ensure activity type constraint includes task types
alter table public.activities drop constraint if exists activities_type_check;
alter table public.activities
  add constraint activities_type_check
  check (type in (
    'task_assigned',
    'task_done',
    'task_dispatched',
    'task_executed',
    'chat_reply',
    'agent_created',
    'import'
  ));
