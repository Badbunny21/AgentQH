-- Command/Report Protocol v1
-- AgentHQ never thinks for the agent: it relays commands and records reports.

alter table public.agents
  add column if not exists api_key_hash text,
  add column if not exists last_heartbeat_at timestamptz;

create unique index if not exists agents_api_key_hash_idx
  on public.agents (api_key_hash) where api_key_hash is not null;

create table if not exists public.agent_commands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  command text not null check (char_length(command) between 1 and 4000),
  status text not null default 'pending'
    check (status in ('pending','claimed','acknowledged','in_progress','done','failed','needs_review','cancelled')),
  progress int check (progress between 0 and 100),
  result text,
  client_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists agent_commands_client_key_idx
  on public.agent_commands (agent_id, client_key) where client_key is not null;
create index if not exists agent_commands_agent_status_idx
  on public.agent_commands (agent_id, status, created_at);

create table if not exists public.agent_reports (
  id uuid primary key default gen_random_uuid(),
  command_id uuid references public.agent_commands(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('ack','progress','result','error','stop','heartbeat')),
  message text,
  progress int check (progress between 0 and 100),
  step jsonb,
  client_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists agent_reports_client_key_idx
  on public.agent_reports (agent_id, client_key) where client_key is not null;
create index if not exists agent_reports_command_idx
  on public.agent_reports (command_id, created_at);

alter table public.agent_commands enable row level security;
alter table public.agent_reports enable row level security;

-- App role: read own commands, create own, and cancel (status update only).
create policy "Users read own commands" on public.agent_commands
  for select using (auth.uid() = user_id);
create policy "Users create own commands" on public.agent_commands
  for insert with check (auth.uid() = user_id);
create policy "Users cancel own commands" on public.agent_commands
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id and status = 'cancelled');

-- Audit trail: append-only, the app can only read it.
create policy "Users read own reports" on public.agent_reports
  for select using (auth.uid() = user_id);
