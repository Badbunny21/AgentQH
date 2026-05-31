import { jsonResponse } from '../_shared/cors.ts';
import { callOpenAIChat, ChatTurn } from '../_shared/agentChat.ts';
import { checkChatAllowed, incrementChatUsage } from '../_shared/planLimits.ts';
import { sendPushToUser } from '../_shared/pushNotify.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { loadAgentContext, sendTelegramMessage } from '../_shared/taskExecute.ts';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    text?: string;
    from?: { id: number; is_bot?: boolean };
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ ok: true });

  const url = new URL(req.url);
  const agentId = url.searchParams.get('agentId');
  const secret = url.searchParams.get('secret');

  if (!agentId || !secret) {
    return jsonResponse({ error: 'Missing agentId or secret' }, 400);
  }

  const supabase = getSupabaseAdmin();
  const { data: connection, error: connectionError } = await supabase
    .from('agent_telegram_connections')
    .select('user_id, webhook_secret, bot_token, telegram_chat_id')
    .eq('agent_id', agentId)
    .single();

  if (connectionError || !connection || connection.webhook_secret !== secret) {
    return jsonResponse({ error: 'Invalid webhook' }, 403);
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return jsonResponse({ ok: true });
  }

  const message = update.message;
  if (!message?.text?.trim()) {
    return jsonResponse({ ok: true });
  }

  if (message.from?.is_bot) {
    return jsonResponse({ ok: true });
  }

  const externalId = String(message.message_id);
  const chatId = message.chat.id;
  const userText = message.text.trim();
  const userId = connection.user_id;

  await supabase
    .from('agent_telegram_connections')
    .update({ telegram_chat_id: chatId })
    .eq('agent_id', agentId);

  const { error: insertError } = await supabase.from('messages').insert({
    user_id: userId,
    agent_id: agentId,
    role: 'user',
    text: userText,
    channel: 'telegram',
    external_id: externalId,
  });

  if (insertError && !insertError.message.includes('duplicate')) {
    console.error('[telegram-webhook] insert user:', insertError.message);
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  if (!apiKey || apiKey.includes('your-')) {
    return jsonResponse({ ok: true });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, chat_messages_used, usage_period_start')
    .eq('id', userId)
    .single();

  if (!profile) return jsonResponse({ ok: true });

  const usageCheck = checkChatAllowed(profile);
  if (!usageCheck.allowed) {
    if (connection.telegram_chat_id || chatId) {
      await sendTelegramMessage(
        connection.bot_token,
        chatId,
        `⚠️ Monthly AI limit reached on AgentHQ. Open the app to upgrade.`
      );
    }
    return jsonResponse({ ok: true });
  }

  const agentContext = await loadAgentContext(supabase, userId, agentId);
  if (!agentContext) return jsonResponse({ ok: true });

  const { data: historyRows } = await supabase
    .from('messages')
    .select('role, text')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })
    .limit(20);

  const history: ChatTurn[] = (historyRows ?? []).map((row: { role: string; text: string }) => ({
    role: row.role === 'user' ? 'user' : 'agent',
    text: row.text,
  }));

  const aiResult = await callOpenAIChat(apiKey, agentContext, history, userText);

  if (!aiResult.reply) {
    return jsonResponse({ ok: true });
  }

  await incrementChatUsage(supabase, userId, profile);

  await supabase.from('messages').insert({
    user_id: userId,
    agent_id: agentId,
    role: 'agent',
    text: aiResult.reply,
    channel: 'telegram',
    external_id: `reply-${externalId}`,
  });

  await sendTelegramMessage(connection.bot_token, chatId, aiResult.reply);

  await supabase.from('activities').insert({
    user_id: userId,
    agent_id: agentId,
    type: 'chat_reply',
    summary: `${agentContext.name} replied on Telegram`,
  });

  await sendPushToUser(supabase, userId, {
    title: `${agentContext.name} replied on Telegram`,
    body: aiResult.reply.slice(0, 120),
    data: { type: 'chat_reply', agentId },
  });

  return jsonResponse({ ok: true });
});
