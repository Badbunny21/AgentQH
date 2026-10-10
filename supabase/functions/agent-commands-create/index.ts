import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { rest, userFromRequest } from '../_shared/restDb.ts';

// App -> AgentHQ. Auth: user JWT. Body: { agentId, command, clientKey? }
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const user = await userFromRequest(req);
  if (!user) return jsonResponse({ error: 'unauthorized' }, 401);

  let body: { agentId?: string; command?: string; clientKey?: string };
  try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid_json' }, 400); }

  const agentId = body.agentId?.trim();
  const command = body.command?.trim();
  const clientKey = body.clientKey?.trim() || null;
  if (!agentId) return jsonResponse({ error: 'agent_id_required' }, 400);
  if (!command) return jsonResponse({ error: 'command_required' }, 400);
  if (command.length > 4000) return jsonResponse({ error: 'command_too_long' }, 400);

  const agent = await rest(`agents?id=eq.${encodeURIComponent(agentId)}&user_id=eq.${user.id}&select=id&limit=1`);
  if (!Array.isArray(agent.data) || agent.data.length === 0) return jsonResponse({ error: 'agent_not_found' }, 404);

  if (clientKey) {
    const existing = await rest(
      `agent_commands?agent_id=eq.${agentId}&client_key=eq.${encodeURIComponent(clientKey)}&select=*&limit=1`
    );
    if (Array.isArray(existing.data) && existing.data[0]) {
      return jsonResponse({ command: existing.data[0], deduplicated: true });
    }
  }

  const ins = await rest('agent_commands', {
    method: 'POST',
    prefer: 'return=representation',
    body: { user_id: user.id, agent_id: agentId, command, client_key: clientKey },
  });
  if (!ins.ok || !Array.isArray(ins.data)) return jsonResponse({ error: 'create_failed' }, 500);
  return jsonResponse({ command: ins.data[0], deduplicated: false }, 201);
});
