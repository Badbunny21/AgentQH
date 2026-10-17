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


export type AttentionFlag = 'failed' | 'stale';

/**
 * Per-agent attention flags for the dashboard dot.
 * 'failed' = the agent has a failed command. 'stale' = no heartbeat for 10+ minutes.
 * 'failed' wins when both are true. Missing from the map = nothing needs attention.
 */
export async function fetchAttentionFlags(userId: string): Promise<Record<string, AttentionFlag>> {
  const flags: Record<string, AttentionFlag> = {};
  const [cmds, agents] = await Promise.all([
    supabase.from('agent_commands').select('agent_id').eq('user_id', userId).eq('status', 'failed'),
    supabase.from('agents').select('id, last_heartbeat_at').eq('user_id', userId),
  ]);
  if (cmds.error) console.error('[attention] commands:', cmds.error.message);
  if (agents.error) console.error('[attention] agents:', agents.error.message);
  for (const a of (agents.data ?? []) as { id: string; last_heartbeat_at: string | null }[]) {
    if (isAgentStale(a.last_heartbeat_at)) flags[a.id] = 'stale';
  }
  for (const c of (cmds.data ?? []) as { agent_id: string }[]) {
    flags[c.agent_id] = 'failed';
  }
  return flags;
}

export interface AgentPulse {
  /** Latest human-readable thing the agent reported, e.g. "Analyzing results". */
  latestActivity: string | null;
  /** Jobs the agent is still working on. */
  running: number;
  /** A job failed or is waiting for approval. */
  needsHelp: boolean;
  /** The help it needs: 'approval' (needs_review) or 'failed'. */
  helpKind: 'approval' | 'failed' | null;
}

/**
 * Live pulse per agent for the dashboard counters and one-line activity.
 * Only real pushed data: open/failed/needs_review commands and the latest
 * non-heartbeat report message. Missing from the map = quiet agent.
 */
export async function fetchAgentPulses(userId: string): Promise<Record<string, AgentPulse>> {
  const pulses: Record<string, AgentPulse> = {};
  const [cmds, reports] = await Promise.all([
    supabase.from('agent_commands').select('agent_id, status').eq('user_id', userId),
    supabase.from('agent_reports').select('agent_id, message, created_at')
      .eq('user_id', userId).neq('kind', 'heartbeat')
      .order('created_at', { ascending: false }).limit(100),
  ]);
  if (cmds.error) console.error('[pulse] commands:', cmds.error.message);
  if (reports.error) console.error('[pulse] reports:', reports.error.message);
  const ensure = (id: string): AgentPulse =>
    (pulses[id] ??= { latestActivity: null, running: 0, needsHelp: false, helpKind: null });
  for (const c of (cmds.data ?? []) as { agent_id: string; status: string }[]) {
    const p = ensure(c.agent_id);
    if (OPEN_STATUSES.includes(c.status as CommandStatus)) p.running += 1;
    if (c.status === 'failed') { p.needsHelp = true; p.helpKind = 'failed'; }
    if (c.status === 'needs_review' && p.helpKind !== 'failed') { p.needsHelp = true; p.helpKind = 'approval'; }
  }
  for (const r of (reports.data ?? []) as { agent_id: string; message: string | null }[]) {
    const p = ensure(r.agent_id);
    if (p.latestActivity === null && r.message) p.latestActivity = r.message;
  }
  return pulses;
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
