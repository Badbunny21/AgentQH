import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { generateAgentKey, sha256Hex } from '../_shared/commandProtocol.ts';
import { rest, userFromRequest } from '../_shared/restDb.ts';

// App -> AgentHQ. Auth: user JWT. Body: { agentId }
// Issues (or rotates) the agent's API key. Only the SHA-256 hash is stored; the
// plaintext key is returned once.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const user = await userFromRequest(req);
  if (!user) return jsonResponse({ error: 'unauthorized' }, 401);

  let body: { agentId?: string };
  try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid_json' }, 400); }
  const agentId = body.agentId?.trim();
  if (!agentId) return jsonResponse({ error: 'agent_id_required' }, 400);

  const apiKey = generateAgentKey();
  const upd = await rest(`agents?id=eq.${encodeURIComponent(agentId)}&user_id=eq.${user.id}`, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: { api_key_hash: await sha256Hex(apiKey) },
  });
  if (!Array.isArray(upd.data) || upd.data.length === 0) return jsonResponse({ error: 'agent_not_found' }, 404);
  return jsonResponse({ apiKey });
});
