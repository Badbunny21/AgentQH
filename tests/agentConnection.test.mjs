import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connectionFromStatus, connectionLabel} from '../src/lib/agentConnection.ts';
test('only verified connection booleans select platform labels', () => {
  assert.equal(connectionFromStatus(false, false), 'none');
  assert.equal(connectionFromStatus(true, false), 'telegram');
  assert.equal(connectionFromStatus(false, true), 'discord');
  assert.equal(connectionFromStatus(true, true), 'both');
  assert.equal(connectionLabel('none'), 'Not connected');
  assert.equal(connectionLabel('checking'), 'Checking connection');
});
