import { supabase } from './supabase';

export interface TelegramConnectionStatus {
  connected: boolean;
  botUsername?: string;
  connectedAt?: string;
  hasChat?: boolean;
}

export interface DiscordConnectionStatus {
  connected: boolean;
  botUsername?: string;
  connectedAt?: string;
  hasChannel?: boolean;
  channelId?: string | null;
  lastSyncAt?: string | null;
}

export async function fetchTelegramConnectionStatus(agentId: string): Promise<TelegramConnectionStatus> {
  const { data, error } = await supabase.rpc('get_agent_telegram_status', { p_agent_id: agentId });
  if (error) {
    console.error('[platform] telegram status:', error.message);
    return { connected: false };
  }
  return data as TelegramConnectionStatus;
}

export async function fetchDiscordConnectionStatus(agentId: string): Promise<DiscordConnectionStatus> {
  const { data, error } = await supabase.rpc('get_agent_discord_status', { p_agent_id: agentId });
  if (error) {
    console.error('[platform] discord status:', error.message);
    return { connected: false };
  }
  return data as DiscordConnectionStatus;
}

export async function updateDiscordChannel(
  agentId: string,
  channelId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('update_agent_discord_channel', {
    p_agent_id: agentId,
    p_channel_id: channelId.trim(),
  });
  return { error: error?.message ?? null };
}

export async function disconnectTelegram(agentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('disconnect_agent_telegram', { p_agent_id: agentId });
  return { error: error?.message ?? null };
}

export async function disconnectDiscord(agentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('disconnect_agent_discord', { p_agent_id: agentId });
  return { error: error?.message ?? null };
}
