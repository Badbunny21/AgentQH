import { supabase, isSupabaseConfigured } from './supabase';
import { extractMemoryCandidatesLocal, isLocalOpenAIConfigured } from './openaiLocal';
import { MemoryCandidate } from './memoryUtils';

export async function suggestMemoriesFromChat(
  agentId: string,
  userMessage: string,
  agentReply: string,
  existingMemories: string[],
  agentName?: string
): Promise<{ candidates: MemoryCandidate[]; error: string | null }> {
  if (isSupabaseConfigured) {
    const hosted = await suggestHosted(agentId, userMessage, agentReply);
    if (hosted.candidates.length > 0 || !hosted.error) return hosted;
    if (!isLocalOpenAIConfigured()) return hosted;
  }

  if (isLocalOpenAIConfigured()) {
    return extractMemoryCandidatesLocal({
      userMessage,
      agentReply,
      existingMemories,
      agentName,
    });
  }

  return { candidates: [], error: null };
}

async function suggestHosted(
  agentId: string,
  userMessage: string,
  agentReply: string
): Promise<{ candidates: MemoryCandidate[]; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('memory-extract', {
    body: { agentId, userMessage, agentReply },
  });

  if (error) return { candidates: [], error: error.message };
  if (data?.error) return { candidates: [], error: data.error as string };

  const candidates = (data?.candidates ?? []) as MemoryCandidate[];
  return { candidates, error: null };
}
