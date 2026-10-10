import { supabase } from './supabase';

export type CommandStatus =
  | 'pending' | 'claimed' | 'acknowledged' | 'in_progress'
  | 'done' | 'failed' | 'needs_review' | 'cancelled';

export interface AgentCommand {
  id: string;
  agentId: string;
  command: string;
  status: CommandStatus;
  progress: number | null;
  result: string | null;
  createdAt: string;
}

export interface AgentReport {
  id: string;
  commandId: string | null;
  kind: 'ack' | 'progress' | 'result' | 'error' | 'stop' | 'heartbeat';
  message: string | null;
  progress: number | null;
  createdAt: string;
}

export const STATUS_LABEL: Record<CommandStatus, string> = {
  pending: 'Waiting for agent',
  claimed: 'Agent received it',
  acknowledged: 'Agent accepted',
  in_progress: 'Working',
  done: 'Done',
  failed: 'Failed',
  needs_review: 'Needs your review',
  cancelled: 'Stopped by you',
};

export const OPEN_STATUSES: CommandStatus[] = ['pending', 'claimed', 'acknowledged', 'in_progress'];

const STALE_AFTER_MS = 10 * 60 * 1000;

export function isAgentStale(lastHeartbeatAt: string | null | undefined): boolean {
  if (!lastHeartbeatAt) return true;
  const t = Date.parse(lastHeartbeatAt);
  return Number.isNaN(t) || Date.now() - t > STALE_AFTER_MS;
}

function rowToCommand(r: any): AgentCommand {
  return {
    id: r.id, agentId: r.agent_id, command: r.command, status: r.status,
    progress: r.progress ?? null, result: r.result ?? null, createdAt: r.created_at,
  };
}

export async function sendCommand(agentId: string, command: string): Promise<{ command: AgentCommand | null; error: string | null }> {
  const clientKey = `app-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const { data, error } = await supabase.functions.invoke('agent-commands-create', {
    body: { agentId, command, clientKey },
  });
  if (error) return { command: null, error: error.message };
  if (data?.error) return { command: null, error: String(data.error) };
  return { command: rowToCommand(data.command), error: null };
}

export async function fetchCommands(agentId: string, limit = 10): Promise<AgentCommand[]> {
  const { data, error } = await supabase
    .from('agent_commands').select('*').eq('agent_id', agentId)
    .order('created_at', { ascending: false }).limit(limit);
  if (error) { console.error('[commands] fetch:', error.message); return []; }
  return (data ?? []).map(rowToCommand);
}

export async function fetchReports(commandId: string): Promise<AgentReport[]> {
  const { data, error } = await supabase
    .from('agent_reports').select('*').eq('command_id', commandId)
    .order('created_at', { ascending: true });
  if (error) { console.error('[reports] fetch:', error.message); return []; }
  return (data ?? []).map((r: any) => ({
    id: r.id, commandId: r.command_id, kind: r.kind, message: r.message ?? null,
    progress: r.progress ?? null, createdAt: r.created_at,
  }));
}

/** Stop a command. RLS only lets the owner set status = cancelled. */
export async function cancelCommand(commandId: string): Promise<string | null> {
  const { error } = await supabase
    .from('agent_commands')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', commandId)
    .in('status', OPEN_STATUSES);
  return error ? error.message : null;
}

/** Issue or rotate the agent's API key. Shown once; only the hash is stored. */
export async function issueAgentKey(agentId: string): Promise<{ apiKey: string | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('agent-key-issue', { body: { agentId } });
  if (error) return { apiKey: null, error: error.message };
  if (data?.error) return { apiKey: null, error: String(data.error) };
  return { apiKey: data.apiKey as string, error: null };
}
