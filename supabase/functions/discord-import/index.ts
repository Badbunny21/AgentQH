import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { discordBotGetMe, discordDisplayName } from '../_shared/discordApi.ts';
import { getSupabaseAdmin, getUserFromRequest } from '../_shared/supabaseAdmin.ts';
import {
  parseConversationPaste,
  parseMemoryLines,
  pickAgentStyle,
  ParsedMessage,
} from '../_shared/importUtils.ts';

interface ImportBody {
  botToken?: string;
  name?: string;
  role?: string;
  bio?: string;
  memoriesText?: string;
  conversationText?: string;
  channelId?: string;
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
  const channelId = body.channelId?.trim() || null;

  if (!botToken || !name || !role) {
    return jsonResponse({ error: 'botToken, name, and role are required' }, 400);
  }

  const me = await discordBotGetMe(botToken);
  if (!me.ok) {
    return jsonResponse({ error: 'Invalid bot token' }, 400);
  }

  const botUsername = me.data.username;
  const botId = me.data.id;
  const style = pickAgentStyle(name);
  const supabase = getSupabaseAdmin();

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .insert({
      user_id: user.id,
      name,
      role,
      origin: 'Discord',
      bio,
      emblem: style.emblem,
      grad_key: style.gradKey,
      status: 'online',
      activity: channelId ? `Imported · #${channelId.slice(-4)}` : `Imported · ${discordDisplayName(me.data)}`,
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
      channel: 'discord',
      external_id: `import-${index}`,
    }));
    const { error: msgError } = await supabase.from('messages').insert(messageRows);
    if (msgError) {
      await supabase.from('agents').delete().eq('id', agentId);
      return jsonResponse({ error: msgError.message }, 500);
    }
  }

  const { error: connectError } = await supabase.from('agent_discord_connections').insert({
    agent_id: agentId,
    user_id: user.id,
    bot_token: botToken,
    bot_username: botUsername,
    bot_id: botId,
    discord_channel_id: channelId,
  });

  if (connectError) {
    return jsonResponse({ error: connectError.message, agentId, partial: true }, 500);
  }

  return jsonResponse({
    agentId,
    botUsername,
    memoryCount: memories.length,
    messageCount: conversation.length,
    liveSync: !!channelId,
  });
});
