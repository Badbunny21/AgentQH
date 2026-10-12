import test from 'node:test';
import assert from 'node:assert/strict';
import { countNeedsAttention, rosterStatusLabel } from '../src/lib/homeSummary.ts';

test('Needs you counts unresolved recorded errors, not open or completed tasks', () => {
  assert.equal(countNeedsAttention([]), 0);
  assert.equal(countNeedsAttention([
    { done: false, executionError: null },
    { done: false, executionError: 'Connection failed' },
    { done: true, executionError: 'Old failure' },
    { done: false, executionError: '  ' },
  ]), 1);
});

test('Stored roster status never becomes a fabricated execution state', () => {
  assert.equal(rosterStatusLabel('online'), 'Online');
  assert.equal(rosterStatusLabel('busy'), 'Busy');
  assert.equal(rosterStatusLabel('away'), 'Away');
  assert.equal(rosterStatusLabel('offline'), 'Offline');
  assert.equal(rosterStatusLabel('in_progress'), 'Unknown');
});
