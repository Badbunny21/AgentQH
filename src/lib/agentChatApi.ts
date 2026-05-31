import { supabase, isSupabaseConfigured } from './supabase';
import { generateAgentReplyLocal, isLocalOpenAIConfigured } from './openaiLocal';
import { Agent } from '../constants/agents';
import { ChatMessage } from './messageUtils';

export function isChatConfigured(): boolean {
  return isSupabaseConfigured || isLocalOpenAIConfigured();
}

export async function generateAgentReply(
  agent: Agent,
  history: ChatMessage[],
  userMessage: string,
  memories: string[] = []
): Promise<{
  reply: string | null;
  error: string | null;
  source?: 'hosted' | 'local';
  limitReached?: boolean;
}> {
  if (isSupabaseConfigured) {
    const hosted = await generateHostedReply(agent.id, history, userMessage);
    if (hosted.reply) return { ...hosted, source: 'hosted' };
    if (hosted.limitReached) return hosted;
    if (!isLocalOpenAIConfigured()) return hosted;
  }

  if (isLocalOpenAIConfigured()) {
    const local = await generateAgentReplyLocal(agent, history, userMessage, memories);
    return { ...local, source: 'local' };
  }

  return {
    reply: null,
    error: 'Chat is unavailable. Sign in and try again.',
  };
}

async function generateHostedReply(
  agentId: string,
  history: ChatMessage[],
  userMessage: string
): Promise<{ reply: string | null; error: string | null; limitReached?: boolean }> {
  const { data, error } = await supabase.functions.invoke('agent-chat', {
    body: {
      agentId,
      userMessage,
      history: history.map(m => ({ role: m.role, text: m.text })),
    },
  });

  if (error) return { reply: null, error: error.message };
  if (data?.code === 'CHAT_LIMIT_REACHED') {
    return {
      reply: null,
      error: data.error as string,
      limitReached: true,
    };
  }
  if (data?.error) return { reply: null, error: data.error as string };
  return { reply: (data?.reply as string) ?? null, error: null };
}
