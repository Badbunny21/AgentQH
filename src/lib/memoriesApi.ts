import { supabase } from './supabase';

export interface Memory {
  id: string;
  agentId: string | null;
  text: string;
  category: string;
  createdAt: string;
}

interface MemoryRow {
  id: string;
  user_id: string;
  agent_id: string | null;
  text: string;
  category: string;
  created_at: string;
}

function rowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    agentId: row.agent_id,
    text: row.text,
    category: row.category,
    createdAt: row.created_at,
  };
}

export async function fetchMemoriesForAgent(userId: string, agentId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[memories] fetch:', error.message);
    return [];
  }

  return (data as MemoryRow[]).map(rowToMemory);
}

export async function fetchAllMemories(userId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[memories] fetch all:', error.message);
    return [];
  }

  return (data as MemoryRow[]).map(rowToMemory);
}

export async function fetchMemoryTextsForAgent(userId: string, agentId: string): Promise<string[]> {
  const memories = await fetchMemoriesForAgent(userId, agentId);
  return memories.map(m => m.text);
}

export async function createMemory(
  userId: string,
  agentId: string,
  text: string,
  category = 'general'
): Promise<{ memory: Memory | null; error: string | null }> {
  const trimmed = text.trim();
  if (!trimmed) return { memory: null, error: 'Enter a fact to remember.' };

  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: userId,
      agent_id: agentId,
      text: trimmed,
      category,
    })
    .select()
    .single();

  if (error) return { memory: null, error: error.message };
  return { memory: rowToMemory(data as MemoryRow), error: null };
}

export async function deleteMemory(memoryId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('memories').delete().eq('id', memoryId);
  return { error: error?.message ?? null };
}
