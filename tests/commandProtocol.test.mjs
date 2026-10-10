import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../supabase/functions/_shared/commandProtocol.ts';

test('report kinds map to statuses', () => {
  assert.equal(P.statusForReport('ack'), 'acknowledged');
  assert.equal(P.statusForReport('progress'), 'in_progress');
  assert.equal(P.statusForReport('result'), 'done');
  assert.equal(P.statusForReport('error'), 'failed');
  assert.equal(P.statusForReport('stop'), 'needs_review');
  assert.equal(P.statusForReport('heartbeat'), null);
});

test('closed commands reject reports with 409', () => {
  for (const s of ['done', 'failed', 'needs_review', 'cancelled']) {
    const r = P.checkReport('progress', s);
    assert.equal(r.ok, false);
    assert.equal(r.status, 409);
    assert.equal(r.error, 'command_already_closed');
  }
  assert.equal(P.checkReport('progress', 'claimed').ok, true);
  assert.equal(P.checkReport('heartbeat', null).ok, true);
});

test('agent key format and hashing', async () => {
  const k = P.generateAgentKey();
  assert.match(k, /^ahq_[0-9a-f]{48}$/);
  assert.equal(P.looksLikeAgentKey(k), true);
  assert.equal(P.looksLikeAgentKey('nope'), false);
  const h = await P.sha256Hex(k);
  assert.equal(h.length, 64);
  assert.notEqual(h, k);
});

test('staleness after 10 minutes without heartbeat', () => {
  const now = Date.parse('2026-10-05T12:00:00Z');
  assert.equal(P.isStale(null, now), true);
  assert.equal(P.isStale('2026-10-05T11:55:00Z', now), false);
  assert.equal(P.isStale('2026-10-05T11:49:00Z', now), true);
});

test('progress is clamped', () => {
  assert.equal(P.clampProgress(150), 100);
  assert.equal(P.clampProgress(-5), 0);
  assert.equal(P.clampProgress('x'), null);
});
