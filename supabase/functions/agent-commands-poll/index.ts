import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { agentFromKey, rest, touchHeartbeat } from '../_shared/restDb.ts';

// Agent backend -> AgentHQ. Auth: x-agent-key. Returns pending commands and marks
// them claimed (a receipt, not agreement).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST' && req.method !== 'GET') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const agent = await agentFromKey(req);
  if (!agent) return jsonResponse({ error: 'invalid_agent_key' }, 401);
  await touchHeartbeat(agent.id);

  const pending = await rest(
    `agent_commands?agent_id=eq.${agent.id}&status=eq.pending&select=id,command,created_at&order=created_at.asc&limit=10`
  );
  const rows = Array.isArray(pending.data) ? (pending.data as { id: string }[]) : [];
  if (rows.length === 0) return jsonResponse({ commands: [] });

  // Only claim rows that are still pending, so two polls never both receive one command.
  const ids = rows.map(r => r.id).join(',');
  const claimed = await rest(`agent_commands?id=in.(${ids})&status=eq.pending`, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: { status: 'claimed', updated_at: new Date().toISOString() },
  });
  const got = Array.isArray(claimed.data) ? (claimed.data as { id: string; command: string; created_at: string }[]) : [];
  return jsonResponse({
    commands: got.map(c => ({ id: c.id, command: c.command, created_at: c.created_at })),
  });
});
