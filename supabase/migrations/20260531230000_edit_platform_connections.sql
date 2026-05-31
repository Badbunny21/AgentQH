-- Edit platform connections without re-importing agents

create or replace function public.update_agent_discord_channel(p_agent_id uuid, p_channel_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.agent_discord_connections
  set
    discord_channel_id = nullif(trim(p_channel_id), ''),
    last_synced_message_id = null,
    last_sync_at = null
  where agent_id = p_agent_id and user_id = auth.uid();

  if not found then
    raise exception 'Discord connection not found';
  end if;
end;
$$;

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
    'hasChannel', discord_channel_id is not null,
    'channelId', discord_channel_id,
    'lastSyncAt', last_sync_at
  )
  into result
  from public.agent_discord_connections
  where agent_id = p_agent_id and user_id = auth.uid();

  return coalesce(result, json_build_object('connected', false));
end;
$$;

grant execute on function public.update_agent_discord_channel(uuid, text) to authenticated;
