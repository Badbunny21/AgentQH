import { corsHeaders, jsonResponse, optionsResponse } from '../_shared/cors.ts';
import {
  assertAgentOwner,
  getProjectFunctionsBaseUrl,
  getSupabaseAdmin,
  getUserFromRequest,
} from '../_shared/supabaseAdmin.ts';

interface ConnectBody {
  agentId?: string;
  botToken?: string;
}

function randomSecret() {
  return crypto.randomUUID().replace(/-/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body: ConnectBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const agentId = body.agentId?.trim();
  const botToken = body.botToken?.trim();

  if (!agentId || !botToken) {
    return jsonResponse({ error: 'agentId and botToken are required' }, 400);
  }

  const agent = await assertAgentOwner(agentId, user.id);
  if (!agent) return jsonResponse({ error: 'Agent not found' }, 404);

  const meResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const meData = await meResponse.json();

  if (!meData.ok) {
    return jsonResponse({ error: 'Invalid bot token. Check with @BotFather.' }, 400);
  }

  const botUsername = meData.result.username as string;
  const botId = meData.result.id as number;
  const webhookSecret = randomSecret();
  const webhookUrl =
    `${getProjectFunctionsBaseUrl()}/telegram-webhook?agentId=${agentId}&secret=${webhookSecret}`;

  const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    }),
  });
  const webhookData = await webhookResponse.json();

  if (!webhookData.ok) {
    return jsonResponse({ error: webhookData.description || 'Could not set Telegram webhook' }, 400);
  }

  const supabase = getSupabaseAdmin();
  const { error: upsertError } = await supabase.from('agent_telegram_connections').upsert({
    agent_id: agentId,
    user_id: user.id,
    bot_token: botToken,
    bot_username: botUsername,
    bot_id: botId,
    webhook_secret: webhookSecret,
    connected_at: new Date().toISOString(),
  });

  if (upsertError) {
    return jsonResponse({ error: upsertError.message }, 500);
  }

  await supabase.from('agents').update({ status: 'online', activity: 'Linked to Telegram' }).eq('id', agentId);

  return jsonResponse({
    connected: true,
    botUsername,
    botId,
  });
});
