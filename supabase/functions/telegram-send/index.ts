import { corsHeaders, jsonResponse, optionsResponse } from '../_shared/cors.ts';
import {
  assertAgentOwner,
  getSupabaseAdmin,
  getUserFromRequest,
} from '../_shared/supabaseAdmin.ts';

interface SendBody {
  agentId?: string;
  text?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body: SendBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const agentId = body.agentId?.trim();
  const text = body.text?.trim();

  if (!agentId || !text) {
    return jsonResponse({ error: 'agentId and text are required' }, 400);
  }

  const agent = await assertAgentOwner(agentId, user.id);
  if (!agent) return jsonResponse({ error: 'Agent not found' }, 404);

  const supabase = getSupabaseAdmin();
  const { data: connection, error: connectionError } = await supabase
    .from('agent_telegram_connections')
    .select('bot_token, telegram_chat_id')
    .eq('agent_id', agentId)
    .eq('user_id', user.id)
    .single();

  if (connectionError || !connection) {
    return jsonResponse({ error: 'Telegram not connected for this agent' }, 400);
  }

  if (!connection.telegram_chat_id) {
    return jsonResponse({
      error: 'Send a message to your bot on Telegram first so we know where to deliver replies.',
    }, 400);
  }

  const tgResponse = await fetch(
    `https://api.telegram.org/bot${connection.bot_token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: connection.telegram_chat_id,
        text,
      }),
    }
  );
  const tgData = await tgResponse.json();

  if (!tgData.ok) {
    return jsonResponse({ error: tgData.description || 'Telegram send failed' }, 400);
  }

  return jsonResponse({ ok: true, messageId: tgData.result?.message_id });
});
