import { supabase } from './supabase';

export interface AgentStats {
  messagesTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export async function fetchAgentStats(userId: string, agentId: string): Promise<AgentStats> {
  const [messages, tasks] = await Promise.all([
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('agent_id', agentId),
    supabase.from('tasks').select('id, done').eq('user_id', userId).eq('agent_id', agentId),
  ]);
  if (messages.error || tasks.error) throw new Error('Could not load agent counts');
  return {
    messagesTotal: messages.count ?? 0,
    tasksCompleted: (tasks.data ?? []).filter(task => task.done).length,
    tasksTotal: (tasks.data ?? []).length,
  };
}
