import { supabase } from './supabase';

export interface AgentStats {
  convos: number;
  accuracy: number | null;
  hoursThisWeek: number;
  messagesTotal: number;
  tasksCompleted: number;
  tasksRun: number;
}

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function fetchAgentStats(userId: string, agentId: string): Promise<AgentStats> {
  const weekStart = startOfWeek().toISOString();

  const [messagesRes, weekMessagesRes, tasksRes] = await Promise.all([
    supabase
      .from('messages')
      .select('id, role, created_at')
      .eq('user_id', userId)
      .eq('agent_id', agentId),
    supabase
      .from('messages')
      .select('id')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .gte('created_at', weekStart),
    supabase
      .from('tasks')
      .select('id, done, result, execution_error, executed_at')
      .eq('user_id', userId)
      .eq('agent_id', agentId),
  ]);

  const messages = messagesRes.data ?? [];
  const userMessages = messages.filter(m => m.role === 'user');
  const weekMessageCount = weekMessagesRes.data?.length ?? 0;
  const tasks = tasksRes.data ?? [];

  const tasksRun = tasks.filter(t => t.executed_at || t.result || t.execution_error).length;
  const tasksCompleted = tasks.filter(t => t.done || (t.result && !t.execution_error)).length;
  const tasksSuccessful = tasks.filter(t => t.result && !t.execution_error).length;

  let accuracy: number | null = null;
  if (tasksRun > 0) {
    accuracy = Math.round((tasksSuccessful / tasksRun) * 100);
  }

  const convos = userMessages.length;
  const hoursThisWeek = Math.max(
    weekMessageCount > 0 ? Math.round((weekMessageCount * 2) / 60 * 10) / 10 : 0,
    tasks.filter(t => t.executed_at && t.executed_at >= weekStart).length * 0.1
  );

  return {
    convos,
    accuracy,
    hoursThisWeek,
    messagesTotal: messages.length,
    tasksCompleted,
    tasksRun,
  };
}
