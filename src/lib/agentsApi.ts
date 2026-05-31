import { supabase } from './supabase';
import { AgentRow, CreateAgentInput, pickAgentStyle, rowToAgent } from './agentUtils';
import { Agent } from '../constants/agents';

export async function fetchAgents(userId: string): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[agents] fetch:', error.message);
    return [];
  }

  return (data as AgentRow[]).map(rowToAgent);
}

export async function createAgent(userId: string, input: CreateAgentInput): Promise<{ agent: Agent | null; error: string | null }> {
  const style = pickAgentStyle(input.name);

  const { data, error } = await supabase
    .from('agents')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      role: input.role.trim(),
      origin: input.origin.trim(),
      bio: input.bio?.trim() || '',
      emblem: style.emblem,
      grad_key: style.gradKey,
      status: 'online',
      activity: 'Just joined your roster',
    })
    .select()
    .single();

  if (error) return { agent: null, error: error.message };
  return { agent: rowToAgent(data as AgentRow), error: null };
}

export async function deleteAgent(agentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('agents').delete().eq('id', agentId);
  return { error: error?.message ?? null };
}

export function getAgentById(agents: Agent[], agentId: string): Agent | undefined {
  return agents.find(a => a.id === agentId);
}
