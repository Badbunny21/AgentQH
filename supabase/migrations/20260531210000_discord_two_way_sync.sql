-- Discord two-way sync: track poll cursor per channel

alter table public.agent_discord_connections
  add column if not exists last_synced_message_id text;

alter table public.agent_discord_connections
  add column if not exists last_sync_at timestamptz;
