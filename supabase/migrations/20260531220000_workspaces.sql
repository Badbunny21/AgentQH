-- Custom workspaces: group agents by project or client

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_agents (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workspace_id, agent_id)
);

create unique index if not exists workspace_agents_agent_unique
  on public.workspace_agents (agent_id);

create index if not exists workspaces_user_id_idx on public.workspaces (user_id, created_at asc);

alter table public.workspaces enable row level security;
alter table public.workspace_agents enable row level security;

create policy "Users can manage own workspaces"
  on public.workspaces for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own workspace agents"
  on public.workspace_agents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
