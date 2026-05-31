-- Discord bot bridge for AgentHQ
-- Run in Supabase Dashboard → SQL Editor (after telegram migration)

alter table public.messages drop constraint if exists messages_channel_check;
alter table public.messages add constraint messages_channel_check
  check (channel in ('app', 'telegram', 'discord'));

create table if not exists public.agent_discord_connections (
  agent_id uuid primary key references public.agents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  bot_token text not null,
  bot_username text not null default '',
  bot_id text not null,
  discord_channel_id text,
  connected_at timestamptz not null default now()
);

alter table public.agent_discord_connections enable row level security;

create or replace function public.get_agent_discord_status(p_agent_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select json_build_object(
    'connected', true,
    'botUsername', bot_username,
    'connectedAt', connected_at,
    'hasChannel', discord_channel_id is not null
  )
  into result
  from public.agent_discord_connections
  where agent_id = p_agent_id and user_id = auth.uid();

  return coalesce(result, json_build_object('connected', false));
end;
$$;

create or replace function public.disconnect_agent_discord(p_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.agent_discord_connections
  where agent_id = p_agent_id and user_id = auth.uid();
end;
$$;

grant execute on function public.get_agent_discord_status(uuid) to authenticated;
grant execute on function public.disconnect_agent_discord(uuid) to authenticated;
