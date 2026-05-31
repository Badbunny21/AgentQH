-- Telegram bot bridge for AgentHQ
-- Run in Supabase Dashboard → SQL Editor (after initial schema)

alter table public.messages
  add column if not exists channel text not null default 'app'
    check (channel in ('app', 'telegram'));

alter table public.messages
  add column if not exists external_id text;

create unique index if not exists messages_agent_external_id_unique
  on public.messages (agent_id, external_id)
  where external_id is not null;

create table if not exists public.agent_telegram_connections (
  agent_id uuid primary key references public.agents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  bot_token text not null,
  bot_username text not null default '',
  bot_id bigint,
  telegram_chat_id bigint,
  webhook_secret text not null,
  connected_at timestamptz not null default now()
);

alter table public.agent_telegram_connections enable row level security;

-- Tokens stay server-side only (Edge Functions use service role)

create or replace function public.get_agent_telegram_status(p_agent_id uuid)
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
    'hasChat', telegram_chat_id is not null
  )
  into result
  from public.agent_telegram_connections
  where agent_id = p_agent_id and user_id = auth.uid();

  return coalesce(result, json_build_object('connected', false));
end;
$$;

create or replace function public.disconnect_agent_telegram(p_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.agent_telegram_connections
  where agent_id = p_agent_id and user_id = auth.uid();
end;
$$;

grant execute on function public.get_agent_telegram_status(uuid) to authenticated;
grant execute on function public.disconnect_agent_telegram(uuid) to authenticated;
