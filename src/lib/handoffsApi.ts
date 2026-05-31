import { supabase } from './supabase';

export interface Handoff {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  summary: string;
  context: string | null;
  taskId: string | null;
  time: string;
  createdAt: string;
}

interface HandoffRow {
  id: string;
  user_id: string;
  from_agent_id: string;
  to_agent_id: string;
  summary: string;
  context: string | null;
  task_id: string | null;
  created_at: string;
}

function formatHandoffTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function rowToHandoff(row: HandoffRow): Handoff {
  return {
    id: row.id,
    fromAgentId: row.from_agent_id,
    toAgentId: row.to_agent_id,
    summary: row.summary,
    context: row.context,
    taskId: row.task_id,
    time: formatHandoffTime(row.created_at),
    createdAt: row.created_at,
  };
}

export async function fetchHandoffs(userId: string, limit = 50): Promise<Handoff[]> {
  const { data, error } = await supabase
    .from('handoffs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[handoffs] fetch:', error.message);
    return [];
  }
  return (data as HandoffRow[]).map(rowToHandoff);
}

export async function createHandoff(
  userId: string,
  input: {
    fromAgentId: string;
    toAgentId: string;
    summary: string;
    context?: string | null;
    taskId?: string | null;
  }
): Promise<{ handoff: Handoff | null; error: string | null }> {
  const { data, error } = await supabase
    .from('handoffs')
    .insert({
      user_id: userId,
      from_agent_id: input.fromAgentId,
      to_agent_id: input.toAgentId,
      summary: input.summary.trim(),
      context: input.context?.trim() || null,
      task_id: input.taskId ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[handoffs] create:', error.message);
    return { handoff: null, error: error.message };
  }
  return { handoff: rowToHandoff(data as HandoffRow), error: null };
}
