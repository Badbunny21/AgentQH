import { supabase } from './supabase';
import { ChatMessage, MessageRow, rowToChatMessage } from './messageUtils';

export async function fetchMessages(userId: string, agentId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[messages] fetch:', error.message);
    return [];
  }

  return (data as MessageRow[]).map(rowToChatMessage);
}

export async function insertMessage(
  userId: string,
  agentId: string,
  role: 'user' | 'agent',
  text: string
): Promise<{ message: ChatMessage | null; error: string | null }> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ user_id: userId, agent_id: agentId, role, text })
    .select()
    .single();

  if (error) return { message: null, error: error.message };
  return { message: rowToChatMessage(data as MessageRow), error: null };
}

export interface ThreadPreview {
  agentId: string;
  preview: string;
  time: string;
  role: 'user' | 'agent';
  createdAt: string;
}

export async function fetchThreadPreviews(userId: string): Promise<ThreadPreview[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[messages] previews:', error.message);
    return [];
  }

  const seen = new Set<string>();
  const previews: ThreadPreview[] = [];

  for (const row of data as MessageRow[]) {
    if (seen.has(row.agent_id)) continue;
    seen.add(row.agent_id);
    previews.push({
      agentId: row.agent_id,
      preview: row.text.split('\n')[0],
      time: rowToChatMessage(row).time,
      role: row.role,
      createdAt: row.created_at,
    });
  }

  return previews;
}
