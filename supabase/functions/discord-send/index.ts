import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { relayMessageToDiscord } from '../_shared/discordSync.ts';
import { assertAgentOwner, getSupabaseAdmin, getUserFromRequest } from '../_shared/supabaseAdmin.ts';

interface SendBody {
  agentId?: string;
  text?: string;
  role?: 'user' | 'agent';
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
  const role = body.role === 'agent' ? 'agent' : 'user';

  if (!agentId || !text) {
    return jsonResponse({ error: 'agentId and text are required' }, 400);
  }

  const agent = await assertAgentOwner(agentId, user.id);
  if (!agent) return jsonResponse({ error: 'Agent not found' }, 404);

  const supabase = getSupabaseAdmin();
  const result = await relayMessageToDiscord(supabase, user.id, agentId, role, text);

  if (result.error) {
    return jsonResponse({ error: result.error }, 400);
  }

  return jsonResponse({ ok: true, messageId: result.messageId });
});
