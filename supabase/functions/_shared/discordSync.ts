import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { callOpenAIChat, ChatTurn } from './agentChat.ts';
import { checkChatAllowed, incrementChatUsage } from './planLimits.ts';
import { sendPushToUser } from './pushNotify.ts';
import { discordFetchChannelMessages, discordSendChannelMessage, DiscordMessage } from './discordApi.ts';
import { loadAgentContext } from './taskExecute.ts';

export const DISCORD_USER_PREFIX = '**You:** ';

export interface DiscordConnection {
  bot_token: string;
  bot_id: string;
  discord_channel_id: string | null;
  last_synced_message_id?: string | null;
}

export function isDiscordUserRelay(content: string): boolean {
  return content.startsWith(DISCORD_USER_PREFIX);
}

export function stripDiscordUserRelay(content: string): string {
  return content.startsWith(DISCORD_USER_PREFIX)
    ? content.slice(DISCORD_USER_PREFIX.length).trim()
    : content.trim();
}

function isNewerMessage(messageId: string, lastId: string | null | undefined): boolean {
  if (!lastId) return true;
  try {
    return BigInt(messageId) > BigInt(lastId);
  } catch {
    return messageId > lastId;
  }
}

function roleForDiscordMessage(
  msg: DiscordMessage,
  botId: string,
  content: string
): 'user' | 'agent' | null {
  if (!content.trim()) return null;

  if (msg.author.bot && msg.author.id === botId) {
    if (isDiscordUserRelay(content)) return 'user';
    return 'agent';
  }

  if (msg.author.bot) return null;
  return 'user';
}

export async function syncDiscordChannel(
  supabase: SupabaseClient,
  userId: string,
  agentId: string,
  agentName: string,
  connection: DiscordConnection,
  options: { autoReply?: boolean } = {}
): Promise<{ synced: number; replied: number; error: string | null }> {
  const channelId = connection.discord_channel_id;
  if (!channelId) {
    return { synced: 0, replied: 0, error: null };
  }

  const fetched = await discordFetchChannelMessages(connection.bot_token, channelId, 50);
  if (!fetched.ok) {
    return { synced: 0, replied: 0, error: 'Could not fetch Discord messages. Check channel ID and bot permissions.' };
  }

  const chronological = [...fetched.data].reverse();
  const lastId = connection.last_synced_message_id;
  const isInitialSync = !lastId;

  let synced = 0;
  let replied = 0;
  let newestId = lastId ?? null;

  for (const msg of chronological) {
    if (newestId === null || isNewerMessage(msg.id, newestId)) {
      newestId = msg.id;
    }

    if (!isNewerMessage(msg.id, lastId)) continue;

    const rawContent = msg.content?.trim() ?? '';
    const role = roleForDiscordMessage(msg, connection.bot_id, rawContent);
    if (!role) continue;

    const text = role === 'user' ? stripDiscordUserRelay(rawContent) : rawContent;
    if (!text) continue;

    const { error: insertError } = await supabase.from('messages').insert({
      user_id: userId,
      agent_id: agentId,
      role,
      text,
      channel: 'discord',
      external_id: msg.id,
    });

    if (insertError) {
      if (!insertError.message.includes('duplicate')) {
        console.error('[discord-sync] insert:', insertError.message);
      }
      continue;
    }

    synced += 1;

    if (
      options.autoReply &&
      role === 'user' &&
      !isInitialSync
    ) {
      const didReply = await replyOnDiscord(
        supabase,
        userId,
        agentId,
        agentName,
        connection,
        text
      );
      if (didReply) replied += 1;
    }
  }

  if (newestId) {
    await supabase
      .from('agent_discord_connections')
      .update({
        last_synced_message_id: newestId,
        last_sync_at: new Date().toISOString(),
      })
      .eq('agent_id', agentId)
      .eq('user_id', userId);
  }

  return { synced, replied, error: null };
}

async function replyOnDiscord(
  supabase: SupabaseClient,
  userId: string,
  agentId: string,
  agentName: string,
  connection: DiscordConnection,
  userText: string
): Promise<boolean> {
  const apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  if (!apiKey || apiKey.includes('your-')) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, chat_messages_used, usage_period_start')
    .eq('id', userId)
    .single();

  if (!profile) return false;

  const usageCheck = checkChatAllowed(profile);
  if (!usageCheck.allowed) {
    if (connection.discord_channel_id) {
      await discordSendChannelMessage(
        connection.bot_token,
        connection.discord_channel_id,
        '⚠️ Monthly AI limit reached on AgentHQ. Open the app to upgrade.'
      );
    }
    return false;
  }

  const agentContext = await loadAgentContext(supabase, userId, agentId);
  if (!agentContext) return false;

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
  if (!aiResult.reply || !connection.discord_channel_id) return false;

  const sent = await discordSendChannelMessage(
    connection.bot_token,
    connection.discord_channel_id,
    aiResult.reply
  );

  if (!sent.ok) return false;

  await incrementChatUsage(supabase, userId, profile);

  await supabase.from('messages').insert({
    user_id: userId,
    agent_id: agentId,
    role: 'agent',
    text: aiResult.reply,
    channel: 'discord',
    external_id: sent.data.id,
  });

  await supabase.from('activities').insert({
    user_id: userId,
    agent_id: agentId,
    type: 'chat_reply',
    summary: `${agentName} replied on Discord`,
  });

  await sendPushToUser(supabase, userId, {
    title: `${agentName} replied on Discord`,
    body: aiResult.reply.slice(0, 120),
    data: { type: 'chat_reply', agentId },
  });

  await supabase
    .from('agent_discord_connections')
    .update({
      last_synced_message_id: sent.data.id,
      last_sync_at: new Date().toISOString(),
    })
    .eq('agent_id', agentId)
    .eq('user_id', userId);

  return true;
}

export async function relayMessageToDiscord(
  supabase: SupabaseClient,
  userId: string,
  agentId: string,
  role: 'user' | 'agent',
  text: string
): Promise<{ messageId: string | null; error: string | null }> {
  const { data: connection, error: connectionError } = await supabase
    .from('agent_discord_connections')
    .select('bot_token, bot_id, discord_channel_id, last_synced_message_id')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .single();

  if (connectionError || !connection?.discord_channel_id) {
    return { messageId: null, error: 'Discord channel not configured for this agent.' };
  }

  const outbound = role === 'user' ? `${DISCORD_USER_PREFIX}${text}` : text;
  const sent = await discordSendChannelMessage(
    connection.bot_token,
    connection.discord_channel_id,
    outbound
  );

  if (!sent.ok) {
    return { messageId: null, error: sent.error };
  }

  await supabase.from('messages').insert({
    user_id: userId,
    agent_id: agentId,
    role,
    text,
    channel: 'discord',
    external_id: sent.data.id,
  });

  const lastId = connection.last_synced_message_id as string | null;
  if (!lastId || isNewerMessage(sent.data.id, lastId)) {
    await supabase
      .from('agent_discord_connections')
      .update({
        last_synced_message_id: sent.data.id,
        last_sync_at: new Date().toISOString(),
      })
      .eq('agent_id', agentId)
      .eq('user_id', userId);
  }

  return { messageId: sent.data.id, error: null };
}
