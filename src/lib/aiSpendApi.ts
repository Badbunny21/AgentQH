import { supabase } from './supabase';
// Recorded activity is not a bill. Costs remain null until a usage source exists.
export interface AgentSpendRow { agentId: string; replies: number; taskRuns: number; cost: null }
export async function fetchMonthlyAgentUsage(userId: string): Promise<AgentSpendRow[]> {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const [messages, tasks] = await Promise.all([
    supabase.from('messages').select('agent_id').eq('user_id', userId).eq('role', 'agent').gte('created_at', start.toISOString()),
    supabase.from('tasks').select('agent_id').eq('user_id', userId).not('executed_at', 'is', null).gte('executed_at', start.toISOString()),
  ]);
  if (messages.error || tasks.error) throw new Error('Could not load monthly usage.');
  const rows = new Map<string, AgentSpendRow>();
  const row = (id: string) => { if (!rows.has(id)) rows.set(id, { agentId: id, replies: 0, taskRuns: 0, cost: null }); return rows.get(id)!; };
  for (const item of messages.data ?? []) if (item.agent_id) row(item.agent_id).replies++;
  for (const item of tasks.data ?? []) if (item.agent_id) row(item.agent_id).taskRuns++;
  return [...rows.values()];
}
