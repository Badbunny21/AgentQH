// Dependency-free PostgREST + Auth helpers (no remote imports, so API-deployed
// functions that boot with --no-remote still work).
import { sha256Hex, looksLikeAgentKey } from './commandProtocol.ts';

const url = () => Deno.env.get('SUPABASE_URL') ?? '';
const key = () => Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function headers(extra: Record<string, string> = {}) {
  return { apikey: key(), Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json', ...extra };
}

export async function rest(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}) {
  const res = await fetch(`${url()}/rest/v1/${path}`, {
    method: init.method ?? 'GET',
    headers: headers(init.prefer ? { Prefer: init.prefer } : {}),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

export async function userFromRequest(req: Request): Promise<{ id: string } | null> {
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const res = await fetch(`${url()}/auth/v1/user`, { headers: { apikey: key(), Authorization: auth } });
  if (!res.ok) return null;
  const u = await res.json();
  return u?.id ? { id: u.id } : null;
}

export interface AgentAuth { id: string; user_id: string; name: string }

/** Resolve an agent from the x-agent-key header. Null = reject with 401. */
export async function agentFromKey(req: Request): Promise<AgentAuth | null> {
  const k = req.headers.get('x-agent-key');
  if (!looksLikeAgentKey(k)) return null;
  const hash = await sha256Hex(k);
  const r = await rest(`agents?api_key_hash=eq.${hash}&select=id,user_id,name&limit=1`);
  const row = Array.isArray(r.data) ? r.data[0] : null;
  return row ?? null;
}

export async function touchHeartbeat(agentId: string) {
  await rest(`agents?id=eq.${agentId}`, {
    method: 'PATCH',
    body: { last_heartbeat_at: new Date().toISOString(), status: 'online' },
  });
}
