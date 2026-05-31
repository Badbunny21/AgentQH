-- Agent-to-agent handoffs for Collaborate

create table if not exists public.handoffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  from_agent_id uuid not null references public.agents(id) on delete cascade,
  to_agent_id uuid not null references public.agents(id) on delete cascade,
  summary text not null,
  context text,
  task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  check (from_agent_id <> to_agent_id)
);

alter table public.handoffs enable row level security;

drop policy if exists "Users can read own handoffs" on public.handoffs;
drop policy if exists "Users can insert own handoffs" on public.handoffs;

create policy "Users can read own handoffs"
  on public.handoffs for select
  using (auth.uid() = user_id);

create policy "Users can insert own handoffs"
  on public.handoffs for insert
  with check (auth.uid() = user_id);

create index if not exists handoffs_user_created_idx
  on public.handoffs (user_id, created_at desc);

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
    'import',
    'handoff'
  ));
