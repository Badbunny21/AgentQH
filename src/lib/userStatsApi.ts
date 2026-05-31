import { supabase } from './supabase';
import { Agent } from '../constants/agents';
import { Profile } from '../types/database';
import { getChatLimit, PLAN_MONTHLY_PRICES } from '../constants/plans';

export interface ConversationBackupStats {
  messageCount: number;
  threadCount: number;
  platformCount: number;
  lastSyncAt: string | null;
  lastSyncLabel: string;
}

export interface MemoryStats {
  factCount: number;
  contributorCount: number;
  topicCount: number;
}

export interface AgentUsageRow {
  agentId: string;
  messages: number;
  taskRuns: number;
}

export interface AiUsageStats {
  chatMessagesUsed: number;
  chatLimit: number;
  taskRunsThisMonth: number;
  totalAiActions: number;
  planMonthlyCost: number;
  planLabel: string;
  agentUsage: AgentUsageRow[];
}

function monthStartIso(date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

function effectiveUsageStart(profile: Profile): string {
  const periodStart = profile.usage_period_start ? new Date(profile.usage_period_start) : new Date(0);
  const currentMonthStart = new Date(monthStartIso());
  return (periodStart < currentMonthStart ? currentMonthStart : periodStart).toISOString();
}

export function formatLastSync(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (date.toDateString() === now.toDateString()) {
    return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export async function fetchMemoryStats(userId: string): Promise<MemoryStats> {
  const { data, error } = await supabase
    .from('memories')
    .select('agent_id, category')
    .eq('user_id', userId);

  if (error) {
    console.error('[stats] memories:', error.message);
    return { factCount: 0, contributorCount: 0, topicCount: 0 };
  }

  const rows = data ?? [];
  const contributors = new Set(rows.map(r => r.agent_id).filter(Boolean));
  const topics = new Set(rows.map(r => r.category || 'general'));

  return {
    factCount: rows.length,
    contributorCount: contributors.size,
    topicCount: topics.size,
  };
}

export async function fetchConversationBackupStats(
  userId: string,
  agents: Agent[]
): Promise<ConversationBackupStats> {
  const { data, error } = await supabase
    .from('messages')
    .select('agent_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[stats] backup:', error.message);
    return { messageCount: 0, threadCount: 0, platformCount: 0, lastSyncAt: null, lastSyncLabel: 'Never' };
  }

  const rows = data ?? [];
  const threadIds = new Set(rows.map(r => r.agent_id));
  const agentById = new Map(agents.map(a => [a.id, a]));
  const platformOrigins = new Set<string>();

  for (const agentId of threadIds) {
    const agent = agentById.get(agentId);
    if (agent?.origin) platformOrigins.add(agent.origin);
  }

  const lastSyncAt = rows[0]?.created_at ?? null;

  return {
    messageCount: rows.length,
    threadCount: threadIds.size,
    platformCount: platformOrigins.size,
    lastSyncAt,
    lastSyncLabel: formatLastSync(lastSyncAt),
  };
}

export async function fetchAiUsageStats(userId: string, profile: Profile, agents: Agent[]): Promise<AiUsageStats> {
  const usageStart = effectiveUsageStart(profile);
  const chatMessagesUsed = profile.chat_messages_used ?? 0;
  const chatLimit = getChatLimit(profile.plan);
  const planKey = profile.plan as keyof typeof PLAN_MONTHLY_PRICES;
  const planMonthlyCost = PLAN_MONTHLY_PRICES[planKey] ?? 0;
  const planLabel = profile.plan.toUpperCase();

  const [{ data: messages, error: msgError }, { data: tasks, error: taskError }] = await Promise.all([
    supabase.from('messages').select('agent_id, role, created_at').eq('user_id', userId).gte('created_at', usageStart),
    supabase
      .from('tasks')
      .select('agent_id, executed_at')
      .eq('user_id', userId)
      .not('executed_at', 'is', null)
      .gte('executed_at', usageStart),
  ]);

  if (msgError) console.error('[stats] usage messages:', msgError.message);
  if (taskError) console.error('[stats] usage tasks:', taskError.message);

  const agentUsageMap = new Map<string, AgentUsageRow>();
  const ensure = (agentId: string) => {
    if (!agentUsageMap.has(agentId)) {
      agentUsageMap.set(agentId, { agentId, messages: 0, taskRuns: 0 });
    }
    return agentUsageMap.get(agentId)!;
  };

  for (const row of messages ?? []) {
    if (row.role === 'agent') {
      ensure(row.agent_id).messages += 1;
    }
  }

  for (const row of tasks ?? []) {
    if (row.agent_id) ensure(row.agent_id).taskRuns += 1;
  }

  const agentUsage = agents
    .map(a => agentUsageMap.get(a.id) ?? { agentId: a.id, messages: 0, taskRuns: 0 })
    .filter(row => row.messages > 0 || row.taskRuns > 0)
    .sort((a, b) => b.messages + b.taskRuns - (a.messages + a.taskRuns));

  const taskRunsThisMonth = (tasks ?? []).length;
  const totalAiActions = chatMessagesUsed + taskRunsThisMonth;

  return {
    chatMessagesUsed,
    chatLimit,
    taskRunsThisMonth,
    totalAiActions,
    planMonthlyCost,
    planLabel,
    agentUsage,
  };
}

export async function fetchUserDashboardStats(userId: string, profile: Profile, agents: Agent[]) {
  const [memory, backup, usage] = await Promise.all([
    fetchMemoryStats(userId),
    fetchConversationBackupStats(userId, agents),
    fetchAiUsageStats(userId, profile, agents),
  ]);
  return { memory, backup, usage };
}
