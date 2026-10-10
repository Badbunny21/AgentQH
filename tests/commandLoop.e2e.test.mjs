// End-to-end loop test: runs the REAL edge function handlers against an in-memory
// PostgREST/Auth emulator. send command -> agent polls -> ack -> progress -> result.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { sha256Hex, generateAgentKey } from '../supabase/functions/_shared/commandProtocol.ts';

const USER = 'user-1';
const db = { agents: [], agent_commands: [], agent_reports: [] };
const handlers = {};

globalThis.Deno = {
  env: { get: k => ({ SUPABASE_URL: 'http://db.test', SUPABASE_SERVICE_ROLE_KEY: 'svc' })[k] },
  serve: fn => { globalThis.__last = fn; },
};

function match(row, filters) {
  return filters.every(([col, expr]) => {
    const [op, ...rest] = expr.split('.'); const val = rest.join('.');
    if (op === 'eq') return String(row[col]) === val;
    if (op === 'in') return val.slice(1, -1).split(',').includes(String(row[col]));
    if (op === 'not') { const m = val.match(/^in\.\((.*)\)$/); return !m[1].split(',').includes(String(row[col])); }
    throw new Error('op ' + op);
  });
}

globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url);
  if (u.pathname === '/auth/v1/user') {
    return init.headers.Authorization === 'Bearer user-jwt'
      ? new Response(JSON.stringify({ id: USER })) : new Response('{}', { status: 401 });
  }
  const table = u.pathname.replace('/rest/v1/', '');
  const filters = [...u.searchParams].filter(([k]) => !['select', 'order', 'limit'].includes(k));
  const method = init.method ?? 'GET';
  const body = init.body ? JSON.parse(init.body) : null;
  const ret = init.headers.Prefer === 'return=representation';
  const now = new Date().toISOString();
  if (method === 'GET') {
    let rows = db[table].filter(r => match(r, filters));
    if (u.searchParams.get('order')?.startsWith('created_at')) rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const lim = u.searchParams.get('limit'); if (lim) rows = rows.slice(0, +lim);
    return new Response(JSON.stringify(rows));
  }
  if (method === 'POST') {
    const row = { id: randomUUID(), created_at: now, status: 'pending', progress: null, result: null, ...body };
    if (body.client_key && db[table].some(r => r.agent_id === body.agent_id && r.client_key === body.client_key)) {
      return new Response('{}', { status: 409 });
    }
    db[table].push(row);
    return new Response(JSON.stringify(ret ? [row] : null), { status: 201 });
  }
  if (method === 'PATCH') {
    const rows = db[table].filter(r => match(r, filters));
    rows.forEach(r => Object.assign(r, body));
    return new Response(JSON.stringify(ret ? rows : null));
  }
};

for (const name of ['agent-commands-create', 'agent-commands-poll', 'agent-report', 'agent-key-issue']) {
  await import(`../supabase/functions/${name}/index.ts?${name}`);
  handlers[name] = globalThis.__last;
}

const call = (name, body, headers = {}) =>
  handlers[name](new Request('http://f.test/' + name, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }));
const json = async r => ({ status: r.status, ...(await r.json()) });
const user = { Authorization: 'Bearer user-jwt' };

test('full demo loop: command -> claimed -> ack -> progress -> done, with audit trail', async () => {
  const agentId = randomUUID();
  db.agents.push({ id: agentId, user_id: USER, name: 'Hermes', api_key_hash: null, last_heartbeat_at: null });

  const issued = await json(await call('agent-key-issue', { agentId }, user));
  assert.match(issued.apiKey, /^ahq_[0-9a-f]{48}$/);
  assert.equal(db.agents[0].api_key_hash, await sha256Hex(issued.apiKey));
  const key = { 'x-agent-key': issued.apiKey };

  const created = await json(await call('agent-commands-create', { agentId, command: 'Summarize my inbox', clientKey: 'k1' }, user));
  assert.equal(created.status, 201);
  assert.equal(created.command.status, 'pending');

  // duplicate protection
  const dup = await json(await call('agent-commands-create', { agentId, command: 'Summarize my inbox', clientKey: 'k1' }, user));
  assert.equal(dup.deduplicated, true);
  assert.equal(db.agent_commands.length, 1);

  // bad key
  assert.equal((await call('agent-commands-poll', {}, { 'x-agent-key': 'ahq_' + '0'.repeat(48) })).status, 401);

  const poll = await json(await call('agent-commands-poll', {}, key));
  assert.equal(poll.commands.length, 1);
  assert.equal(poll.commands[0].command, 'Summarize my inbox');
  assert.equal(db.agent_commands[0].status, 'claimed');
  assert.equal((await json(await call('agent-commands-poll', {}, key))).commands.length, 0);
  assert.equal(db.agents[0].status, 'online');
  assert.ok(db.agents[0].last_heartbeat_at);

  const id = created.command.id;
  assert.equal((await call('agent-report', { commandId: id, kind: 'ack', clientKey: 'r1' }, key)).status, 200);
  assert.equal(db.agent_commands[0].status, 'acknowledged');
  await call('agent-report', { commandId: id, kind: 'progress', progress: 50, message: 'Reading', clientKey: 'r2' }, key);
  assert.equal(db.agent_commands[0].status, 'in_progress');
  assert.equal(db.agent_commands[0].progress, 50);

  // duplicate report changes nothing
  const rd = await json(await call('agent-report', { commandId: id, kind: 'progress', progress: 50, clientKey: 'r2' }, key));
  assert.equal(rd.deduplicated, true);
  assert.equal(db.agent_reports.length, 2);

  await call('agent-report', { commandId: id, kind: 'result', message: '12 emails, 2 need you', clientKey: 'r3' }, key);
  assert.equal(db.agent_commands[0].status, 'done');
  assert.equal(db.agent_commands[0].result, '12 emails, 2 need you');

  // closed command rejects further reports
  const late = await json(await call('agent-report', { commandId: id, kind: 'progress', clientKey: 'r4' }, key));
  assert.equal(late.status, 409);
  assert.equal(late.error, 'command_already_closed');
  assert.deepEqual(db.agent_reports.map(r => r.kind), ['ack', 'progress', 'result']);
});

test('stop signal and failure surface visibly; other users cannot command an agent', async () => {
  const agentId = randomUUID();
  db.agents.push({ id: agentId, user_id: USER, name: 'A2', api_key_hash: null });
  const { apiKey } = await json(await call('agent-key-issue', { agentId }, user));
  const key = { 'x-agent-key': apiKey };
  const c = await json(await call('agent-commands-create', { agentId, command: 'Delete everything' }, user));
  await call('agent-commands-poll', {}, key);
  await call('agent-report', { commandId: c.command.id, kind: 'stop', message: 'Destructive action needs approval' }, key);
  assert.equal(db.agent_commands.find(x => x.id === c.command.id).status, 'needs_review');

  const c2 = await json(await call('agent-commands-create', { agentId, command: 'Do a thing' }, user));
  await call('agent-commands-poll', {}, key);
  await call('agent-report', { commandId: c2.command.id, kind: 'error', message: 'API down' }, key);
  assert.equal(db.agent_commands.find(x => x.id === c2.command.id).status, 'failed');

  const intruder = await json(await call('agent-commands-create', { agentId, command: 'x' }, { Authorization: 'Bearer nope' }));
  assert.equal(intruder.status, 401);
});
