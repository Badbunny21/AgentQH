import { callOpenAIChat, AgentChatContext, ChatTurn } from './agentChat.ts';
import { checkChatAllowed, incrementChatUsage, UsageProfile } from './planLimits.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export interface TaskExecuteResult {
  ok: boolean;
  result: string | null;
  error: string | null;
  limitReached?: boolean;
}

function buildTaskPrompt(taskTitle: string): string {
  return [
    'The user assigned you this task via AgentHQ mission control.',
    '',
    `Task: ${taskTitle}`,
    '',
    'Execute this task now. Provide a clear, concrete deliverable — summary, draft, plan, analysis, or steps completed.',
    'If you lack real-time data or access, say so briefly and still produce the best useful output you can (template, outline, recommendations).',
    'Structure longer answers with short headings or bullets. Stay in character.',
  ].join('\n');
}

export async function executeTaskWithAI(
  supabase: SupabaseClient,
  userId: string,
  profile: UsageProfile,
  apiKey: string,
  agent: AgentChatContext,
  taskId: string,
  taskTitle: string
): Promise<TaskExecuteResult> {
  const usageCheck = checkChatAllowed(profile);
  if (!usageCheck.allowed) {
    return {
      ok: false,
      result: null,
      error: usageCheck.error ?? 'Chat limit reached',
      limitReached: true,
    };
  }

  await supabase
    .from('tasks')
    .update({ status: 'doing', updated_at: new Date().toISOString() })
    .eq('id', taskId);

  const aiResult = await callOpenAIChat(
    apiKey,
    agent,
    [] as ChatTurn[],
    buildTaskPrompt(taskTitle),
    { maxTokens: 1200, temperature: 0.6 }
  );

  if (aiResult.error || !aiResult.reply) {
    await supabase
      .from('tasks')
      .update({
        status: 'open',
        execution_error: aiResult.error || 'Execution failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    return { ok: false, result: null, error: aiResult.error || 'Execution failed' };
  }

  const now = new Date().toISOString();

  await supabase
    .from('tasks')
    .update({
      status: 'review',
      done: false,
      result: aiResult.reply,
      execution_error: null,
      executed_at: now,
      updated_at: now,
    })
    .eq('id', taskId);

  await incrementChatUsage(supabase, userId, profile);

  return { ok: true, result: aiResult.reply, error: null };
}

export async function loadAgentContext(
  supabase: SupabaseClient,
  userId: string,
  agentId: string
): Promise<AgentChatContext | null> {
  const { data: agent, error } = await supabase
    .from('agents')
    .select('name, role, bio, origin')
    .eq('id', agentId)
    .single();

  if (error || !agent) return null;

  const { data: memoryRows } = await supabase
    .from('memories')
    .select('text')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true });

  return {
    name: agent.name,
    role: agent.role,
    bio: agent.bio ?? '',
    origin: agent.origin ?? '',
    memories: (memoryRows ?? []).map((row: { text: string }) => row.text),
  };
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: number | string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const tgData = await tgResponse.json();
  if (!tgData.ok) {
    return { ok: false, error: tgData.description || 'Telegram send failed' };
  }
  return { ok: true };
}
