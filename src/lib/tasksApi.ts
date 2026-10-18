import { supabase } from './supabase';

export type TelegramTaskState =
  | 'SENT'
  | 'REPLY_RECEIVED'
  | 'NEEDS_REVIEW'
  | 'REVIEWED'
  | 'TIMED_OUT';

export interface Task {
  id: string;
  title: string;
  agentId: string | null;
  status: string;
  done: boolean;
  time: string;
  result: string | null;
  executionError: string | null;
  executedAt: string | null;
  telegramState: TelegramTaskState | null;
  telegramBotId: number | null;
  telegramChatId: number | null;
  telegramOutboundMessageId: number | null;
  telegramReplyMessageId: number | null;
  telegramReplyUpdateId: number | null;
  sentAt: string | null;
  replyReceivedAt: string | null;
  reviewedAt: string | null;
  replyDeadlineAt: string | null;
  timedOutAt: string | null;
}

interface TaskRow {
  id: string;
  user_id: string;
  agent_id: string | null;
  title: string;
  status: string;
  done: boolean;
  result: string | null;
  execution_error: string | null;
  executed_at: string | null;
  telegram_state: TelegramTaskState | null;
  telegram_bot_id: number | null;
  telegram_chat_id: number | null;
  telegram_outbound_message_id: number | null;
  telegram_reply_message_id: number | null;
  telegram_reply_update_id: number | null;
  sent_at: string | null;
  reply_received_at: string | null;
  reviewed_at: string | null;
  reply_deadline_at: string | null;
  timed_out_at: string | null;
  created_at: string;
  updated_at: string;
}

function formatTaskTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    agentId: row.agent_id,
    status: row.status,
    done: row.done,
    time: formatTaskTime(row.updated_at || row.created_at),
    result: row.result ?? null,
    executionError: row.execution_error ?? null,
    executedAt: row.executed_at ?? null,
    telegramState: row.telegram_state ?? null,
    telegramBotId: row.telegram_bot_id ?? null,
    telegramChatId: row.telegram_chat_id ?? null,
    telegramOutboundMessageId: row.telegram_outbound_message_id ?? null,
    telegramReplyMessageId: row.telegram_reply_message_id ?? null,
    telegramReplyUpdateId: row.telegram_reply_update_id ?? null,
    sentAt: row.sent_at ?? null,
    replyReceivedAt: row.reply_received_at ?? null,
    reviewedAt: row.reviewed_at ?? null,
    replyDeadlineAt: row.reply_deadline_at ?? null,
    timedOutAt: row.timed_out_at ?? null,
  };
}

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[tasks] fetch:', error.message);
    return [];
  }
  return (data as TaskRow[]).map(rowToTask);
}

export async function createTask(
  userId: string,
  title: string,
  agentId: string | null
): Promise<{ task: Task | null; error: string | null }> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: title.trim(),
      agent_id: agentId,
      status: 'open',
      done: false,
    })
    .select()
    .single();

  if (error) return { task: null, error: error.message };
  return { task: rowToTask(data as TaskRow), error: null };
}

export async function toggleTaskDone(
  taskId: string,
  done: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('tasks')
    .update({
      done,
      status: done ? 'done' : 'open',
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .is('telegram_state', null);

  return { error: error?.message ?? null };
}

export async function markTaskReviewed(
  userId: string,
  taskId: string
): Promise<{ task: Task | null; error: string | null }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('tasks')
    .update({
      telegram_state: 'REVIEWED',
      reviewed_at: now,
      status: 'done',
      done: true,
      updated_at: now,
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .in('telegram_state', ['REPLY_RECEIVED', 'NEEDS_REVIEW'])
    .select()
    .maybeSingle();

  if (error) return { task: null, error: error.message };
  if (!data) return { task: null, error: 'Task not found or not ready for review' };
  return { task: rowToTask(data as TaskRow), error: null };
}

export async function dispatchTask(taskId: string): Promise<{
  dispatched: boolean;
  executed: boolean;
  note: string;
  result: string | null;
  error: string | null;
  limitReached?: boolean;
}> {
  const { data, error } = await supabase.functions.invoke('task-dispatch', {
    body: { taskId },
  });

  if (error) return { dispatched: false, executed: false, note: '', result: null, error: error.message };
  if (data?.error) {
    return {
      dispatched: false,
      executed: !!data.executed,
      note: '',
      result: (data.result as string) ?? null,
      error: data.error as string,
      limitReached: data.code === 'CHAT_LIMIT_REACHED',
    };
  }
  return {
    dispatched: !!data?.dispatched,
    executed: !!data?.executed,
    note: (data?.note as string) ?? '',
    result: (data?.result as string) ?? null,
    error: null,
  };
}
