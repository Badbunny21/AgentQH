import { supabase } from './supabase';

export interface Activity {
  id: string;
  agentId: string | null;
  taskId: string | null;
  type: string;
  summary: string;
  time: string;
  createdAt: string;
}

interface ActivityRow {
  id: string;
  user_id: string;
  agent_id: string | null;
  task_id: string | null;
  type: string;
  summary: string;
  created_at: string;
}

function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    agentId: row.agent_id,
    taskId: row.task_id,
    type: row.type,
    summary: row.summary,
    time: formatActivityTime(row.created_at),
    createdAt: row.created_at,
  };
}

export async function fetchActivities(userId: string, limit = 20): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[activities] fetch:', error.message);
    return [];
  }
  return (data as ActivityRow[]).map(rowToActivity);
}

export async function logActivity(
  userId: string,
  type: string,
  summary: string,
  options?: { agentId?: string | null; taskId?: string | null }
): Promise<void> {
  const { error } = await supabase.from('activities').insert({
    user_id: userId,
    agent_id: options?.agentId ?? null,
    task_id: options?.taskId ?? null,
    type,
    summary,
  });
  if (error) console.error('[activities] log:', error.message);
}
