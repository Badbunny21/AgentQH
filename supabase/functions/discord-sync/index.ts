import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { syncDiscordChannel } from '../_shared/discordSync.ts';
import { assertAgentOwner, getSupabaseAdmin, getUserFromRequest } from '../_shared/supabaseAdmin.ts';

interface SyncBody {
  agentId?: string;
  autoReply?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body: SyncBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const agentId = body.agentId?.trim();
  if (!agentId) return jsonResponse({ error: 'agentId is required' }, 400);

  const agent = await assertAgentOwner(agentId, user.id);
  if (!agent) return jsonResponse({ error: 'Agent not found' }, 404);

  const supabase = getSupabaseAdmin();
  const { data: connection, error: connectionError } = await supabase
    .from('agent_discord_connections')
    .select('bot_token, bot_id, discord_channel_id, last_synced_message_id')
    .eq('agent_id', agentId)
    .eq('user_id', user.id)
    .single();

  if (connectionError || !connection) {
    return jsonResponse({ error: 'Discord not connected for this agent' }, 400);
  }

  if (!connection.discord_channel_id) {
    return jsonResponse({ synced: 0, replied: 0, message: 'No Discord channel configured for sync.' });
  }

  const result = await syncDiscordChannel(
    supabase,
    user.id,
    agentId,
    agent.name,
    connection,
    { autoReply: body.autoReply === true }
  );

  if (result.error) {
    return jsonResponse({ error: result.error }, 400);
  }

  return jsonResponse({ synced: result.synced, replied: result.replied });
});
