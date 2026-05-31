import { supabase } from './supabase';

export interface DiscordBotInfo {
  botUsername: string;
  botDisplayName: string;
  botId: string;
}

export interface DiscordImportResult {
  agentId: string;
  botUsername: string;
  memoryCount: number;
  messageCount: number;
  liveSync: boolean;
}

export async function validateDiscordBot(botToken: string): Promise<{ data: DiscordBotInfo | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('discord-validate', {
    body: { botToken },
  });

  if (error) return { data: null, error: error.message };
  if (data?.error) return { data: null, error: data.error as string };
  return { data: data as DiscordBotInfo, error: null };
}

export interface DiscordImportInput {
  botToken: string;
  name: string;
  role: string;
  bio: string;
  memoriesText: string;
  conversationText: string;
  channelId: string;
}

export async function importDiscordAgent(
  input: DiscordImportInput
): Promise<{ data: DiscordImportResult | null; error: string | null; partialAgentId?: string }> {
  const { data, error } = await supabase.functions.invoke('discord-import', {
    body: input,
  });

  if (error) return { data: null, error: error.message };
  if (data?.error) {
    return {
      data: null,
      error: data.error as string,
      partialAgentId: data.agentId as string | undefined,
    };
  }
  return { data: data as DiscordImportResult, error: null };
}

export async function syncDiscordMessages(
  agentId: string,
  autoReply = false
): Promise<{ synced: number; replied: number; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('discord-sync', {
    body: { agentId, autoReply },
  });

  if (error) return { synced: 0, replied: 0, error: error.message };
  if (data?.error) return { synced: 0, replied: 0, error: data.error as string };
  return {
    synced: (data?.synced as number) ?? 0,
    replied: (data?.replied as number) ?? 0,
    error: null,
  };
}

export async function syncAllDiscordAgents(
  agentIds: string[],
  autoReply = false
): Promise<void> {
  await Promise.all(agentIds.map(id => syncDiscordMessages(id, autoReply)));
}

export async function relayDiscordMessage(
  agentId: string,
  role: 'user' | 'agent',
  text: string
): Promise<{ messageId: string | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('discord-send', {
    body: { agentId, text, role },
  });

  if (error) return { messageId: null, error: error.message };
  if (data?.error) return { messageId: null, error: data.error as string };
  return { messageId: (data?.messageId as string) ?? null, error: null };
}

/** @deprecated Use relayDiscordMessage */
export async function sendDiscordMessage(agentId: string, text: string): Promise<{ error: string | null }> {
  const result = await relayDiscordMessage(agentId, 'agent', text);
  return { error: result.error };
}
