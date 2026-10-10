import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { checkReport, clampProgress, isReportKind } from '../_shared/commandProtocol.ts';
import { agentFromKey, rest, touchHeartbeat } from '../_shared/restDb.ts';

// Agent backend -> AgentHQ. Auth: x-agent-key.
// Body: { commandId?, kind, message?, progress?, step?, clientKey? }
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const agent = await agentFromKey(req);
  if (!agent) return jsonResponse({ error: 'invalid_agent_key' }, 401);

  let body: { commandId?: string; kind?: string; message?: string; progress?: number; step?: unknown; clientKey?: string };
  try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid_json' }, 400); }

  if (!isReportKind(body.kind)) return jsonResponse({ error: 'invalid_kind' }, 400);
  const kind = body.kind;
  const clientKey = body.clientKey?.trim() || null;

  await touchHeartbeat(agent.id);

  if (clientKey) {
    const dup = await rest(`agent_reports?agent_id=eq.${agent.id}&client_key=eq.${encodeURIComponent(clientKey)}&select=id&limit=1`);
    if (Array.isArray(dup.data) && dup.data.length > 0) return jsonResponse({ ok: true, deduplicated: true });
  }

  let commandId: string | null = null;
  let current: string | null = null;
  if (kind !== 'heartbeat') {
    commandId = body.commandId?.trim() || null;
    if (!commandId) return jsonResponse({ error: 'command_id_required' }, 400);
    const cmd = await rest(`agent_commands?id=eq.${encodeURIComponent(commandId)}&agent_id=eq.${agent.id}&select=status&limit=1`);
    const row = Array.isArray(cmd.data) ? (cmd.data[0] as { status: string } | undefined) : undefined;
    if (!row) return jsonResponse({ error: 'command_not_found' }, 404);
    current = row.status;
  }

  const check = checkReport(kind, current);
  if (!check.ok) return jsonResponse({ error: check.error }, check.status);

  const progress = clampProgress(body.progress);
  const message = typeof body.message === 'string' ? body.message.slice(0, 4000) : null;

  const ins = await rest('agent_reports', {
    method: 'POST',
    body: {
      command_id: commandId, agent_id: agent.id, user_id: agent.user_id, kind,
      message, progress, step: body.step ?? null, client_key: clientKey,
    },
  });
  if (!ins.ok) return jsonResponse({ error: 'report_failed' }, 500);

  if (commandId && check.nextStatus) {
    const patch: Record<string, unknown> = { status: check.nextStatus, updated_at: new Date().toISOString() };
    if (progress !== null) patch.progress = progress;
    if (kind === 'result') { patch.result = message; patch.progress = 100; }
    // Guard: only move a command that is still open.
    await rest(`agent_commands?id=eq.${commandId}&status=not.in.(done,failed,needs_review,cancelled)`, {
      method: 'PATCH', body: patch,
    });
  }
  return jsonResponse({ ok: true, deduplicated: false });
});
