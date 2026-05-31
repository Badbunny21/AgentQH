import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import {
  getProjectFunctionsBaseUrl,
  getSupabaseAdmin,
  getUserFromRequest,
} from '../_shared/supabaseAdmin.ts';
import {
  parseConversationPaste,
  parseMemoryLines,
  pickAgentStyle,
  randomSecret,
  ParsedMessage,
} from '../_shared/importUtils.ts';

interface ImportBody {
  botToken?: string;
  name?: string;
  role?: string;
  bio?: string;
  memoriesText?: string;
  conversationText?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body: ImportBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const botToken = body.botToken?.trim();
  const name = body.name?.trim();
  const role = body.role?.trim();
  const bio = body.bio?.trim() || '';

  if (!botToken || !name || !role) {
    return jsonResponse({ error: 'botToken, name, and role are required' }, 400);
  }

  const meResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const meData = await meResponse.json();
  if (!meData.ok) {
    return jsonResponse({ error: 'Invalid bot token' }, 400);
  }

  const botUsername = meData.result.username as string;
  const botId = meData.result.id as number;
  const style = pickAgentStyle(name);
  const supabase = getSupabaseAdmin();

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .insert({
      user_id: user.id,
      name,
      role,
      origin: 'Telegram',
      bio,
      emblem: style.emblem,
      grad_key: style.gradKey,
      status: 'online',
      activity: `Imported · @${botUsername}`,
    })
    .select('id')
    .single();

  if (agentError || !agent) {
    return jsonResponse({ error: agentError?.message || 'Could not create agent' }, 500);
  }

  const agentId = agent.id as string;
  const memories = parseMemoryLines(body.memoriesText || '');
  const conversation = parseConversationPaste(body.conversationText || '', name);

  if (memories.length > 0) {
    const memoryRows = memories.map(text => ({
      user_id: user.id,
      agent_id: agentId,
      text,
      category: 'imported',
    }));
    const { error: memError } = await supabase.from('memories').insert(memoryRows);
    if (memError) {
      await supabase.from('agents').delete().eq('id', agentId);
      return jsonResponse({ error: memError.message }, 500);
    }
  }

  if (conversation.length > 0) {
    const messageRows = conversation.map((msg: ParsedMessage, index: number) => ({
      user_id: user.id,
      agent_id: agentId,
      role: msg.role,
      text: msg.text,
      channel: 'telegram',
      external_id: `import-${index}`,
    }));
    const { error: msgError } = await supabase.from('messages').insert(messageRows);
    if (msgError) {
      await supabase.from('agents').delete().eq('id', agentId);
      return jsonResponse({ error: msgError.message }, 500);
    }
  }

  const webhookSecret = randomSecret();
  const webhookUrl =
    `${getProjectFunctionsBaseUrl()}/telegram-webhook?agentId=${agentId}&secret=${webhookSecret}`;

  const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message'],
      drop_pending_updates: false,
    }),
  });
  const webhookData = await webhookResponse.json();

  if (!webhookData.ok) {
    return jsonResponse({
      error: webhookData.description || 'Agent created but Telegram webhook failed. Try reconnecting later.',
      agentId,
      partial: true,
    }, 400);
  }

  const { error: connectError } = await supabase.from('agent_telegram_connections').insert({
    agent_id: agentId,
    user_id: user.id,
    bot_token: botToken,
    bot_username: botUsername,
    bot_id: botId,
    webhook_secret: webhookSecret,
  });

  if (connectError) {
    return jsonResponse({ error: connectError.message, agentId, partial: true }, 500);
  }

  return jsonResponse({
    agentId,
    botUsername,
    memoryCount: memories.length,
    messageCount: conversation.length,
  });
});
