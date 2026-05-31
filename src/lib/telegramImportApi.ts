import { supabase } from './supabase';

export interface TelegramBotInfo {
  botUsername: string;
  botFirstName: string;
  botId: number;
}

export interface TelegramImportResult {
  agentId: string;
  botUsername: string;
  memoryCount: number;
  messageCount: number;
}

export async function validateTelegramBot(botToken: string): Promise<{ data: TelegramBotInfo | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('telegram-validate', {
    body: { botToken },
  });

  if (error) return { data: null, error: error.message };
  if (data?.error) return { data: null, error: data.error as string };
  return { data: data as TelegramBotInfo, error: null };
}

export interface TelegramImportInput {
  botToken: string;
  name: string;
  role: string;
  bio: string;
  memoriesText: string;
  conversationText: string;
}

export async function importTelegramAgent(
  input: TelegramImportInput
): Promise<{ data: TelegramImportResult | null; error: string | null; partialAgentId?: string }> {
  const { data, error } = await supabase.functions.invoke('telegram-import', {
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
  return { data: data as TelegramImportResult, error: null };
}
