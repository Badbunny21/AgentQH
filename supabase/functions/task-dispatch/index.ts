import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { sendPushToUser } from '../_shared/pushNotify.ts';
import { assertAgentOwner, getSupabaseAdmin, getUserFromRequest } from '../_shared/supabaseAdmin.ts';
import {
  executeTaskWithAI,
  loadAgentContext,
  sendTelegramMessage,
} from '../_shared/taskExecute.ts';

interface DispatchBody {
  taskId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  if (!apiKey || apiKey.includes('your-')) {
    return jsonResponse({ error: 'AI execution is not configured on the server yet.' }, 503);
  }

  let body: DispatchBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const taskId = body.taskId?.trim();
  if (!taskId) return jsonResponse({ error: 'taskId is required' }, 400);

  const supabase = getSupabaseAdmin();
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, title, agent_id, user_id, status')
    .eq('id', taskId)
    .single();

  if (taskError || !task || task.user_id !== user.id) {
    return jsonResponse({ error: 'Task not found' }, 404);
  }

  if (!task.agent_id) {
    return jsonResponse({ error: 'Assign an agent before dispatching.' }, 400);
  }

  const agent = await assertAgentOwner(task.agent_id, user.id);
  if (!agent) return jsonResponse({ error: 'Agent not found' }, 404);

  const { data: agentRow } = await supabase
    .from('agents')
    .select('name, origin')
    .eq('id', task.agent_id)
    .single();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan, chat_messages_used, usage_period_start')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return jsonResponse({ error: 'Profile not found' }, 404);
  }

  const agentContext = await loadAgentContext(supabase, user.id, task.agent_id);
  if (!agentContext) {
    return jsonResponse({ error: 'Agent not found' }, 404);
  }

  const { data: tgConnection } = await supabase
    .from('agent_telegram_connections')
    .select('bot_token, telegram_chat_id')
    .eq('agent_id', task.agent_id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: dcConnection } = await supabase
    .from('agent_discord_connections')
    .select('bot_token, discord_channel_id')
    .eq('agent_id', task.agent_id)
    .eq('user_id', user.id)
    .maybeSingle();

  const hasTelegram = !!(tgConnection?.bot_token && tgConnection.telegram_chat_id);
  const hasDiscord = !!(dcConnection?.bot_token && dcConnection.discord_channel_id);

  // Notify platform that work is starting
  if (hasTelegram) {
    await sendTelegramMessage(
      tgConnection!.bot_token,
      tgConnection!.telegram_chat_id!,
      `📋 Task from AgentHQ\n\n${task.title}\n\nWorking on this now…`
    );
  } else if (hasDiscord) {
    await fetch(
      `https://discord.com/api/v10/channels/${dcConnection!.discord_channel_id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${dcConnection!.bot_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `📋 **Task from AgentHQ**\n\n${task.title}\n\nWorking on this now…`,
        }),
      }
    );
  }

  const execution = await executeTaskWithAI(
    supabase,
    user.id,
    profile,
    apiKey,
    agentContext,
    taskId,
    task.title
  );

  if (!execution.ok) {
    if (execution.limitReached) {
      return jsonResponse({
        error: execution.error,
        code: 'CHAT_LIMIT_REACHED',
        dispatched: false,
        executed: false,
      }, 402);
    }
    return jsonResponse({ error: execution.error, dispatched: false, executed: false }, 502);
  }

  const result = execution.result!;
  const agentName = agentRow?.name ?? 'Agent';
  let platformNote = 'Executed in AgentHQ';

  if (hasTelegram) {
    const sent = await sendTelegramMessage(
      tgConnection!.bot_token,
      tgConnection!.telegram_chat_id!,
      `✅ Task complete · ${agentName}\n\n${result}`
    );
    platformNote = sent.ok ? 'Executed · sent to Telegram' : 'Executed in app · Telegram delivery failed';

    if (sent.ok) {
      await supabase.from('messages').insert({
        user_id: user.id,
        agent_id: task.agent_id,
        role: 'agent',
        text: result,
        channel: 'telegram',
        external_id: `task-${taskId}`,
      });
    }
  } else if (hasDiscord) {
    const dcResponse = await fetch(
      `https://discord.com/api/v10/channels/${dcConnection!.discord_channel_id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${dcConnection!.bot_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: `✅ **Task complete** · ${agentName}\n\n${result}` }),
      }
    );
    platformNote = dcResponse.ok ? 'Executed · sent to Discord' : 'Executed in app · Discord delivery failed';
  }

  await supabase.from('messages').insert({
    user_id: user.id,
    agent_id: task.agent_id,
    role: 'agent',
    text: result,
    channel: 'app',
  });

  await supabase.from('activities').insert({
    user_id: user.id,
    agent_id: task.agent_id,
    task_id: taskId,
    type: 'task_done',
    summary: `${agentName} completed "${task.title}" — ${platformNote}`,
  });

  await sendPushToUser(supabase, user.id, {
    title: `${agentName} finished a task`,
    body: task.title,
    data: { type: 'task_done', taskId, agentId: task.agent_id },
  });

  return jsonResponse({
    dispatched: hasTelegram || hasDiscord,
    executed: true,
    note: platformNote,
    result,
  });
});
