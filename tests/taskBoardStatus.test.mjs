import test from 'node:test';
import assert from 'node:assert/strict';
import { taskBoardLabel } from '../src/lib/taskBoardStatus.ts';
test('Board only labels stored task states, not fabricated execution', () => {
  const task = { status: 'open', done: false, executionError: null };
  assert.equal(taskBoardLabel(task), null);
  assert.equal(taskBoardLabel({...task,result:'text'}),null);
  assert.equal(taskBoardLabel({...task,status:'doing'}), 'In progress');
  assert.equal(taskBoardLabel({...task,status:'review'}), 'Review');
  assert.equal(taskBoardLabel({...task,executionError:'Failed'}), 'Error');
  assert.equal(taskBoardLabel({...task,status:'review',done:true}),null);
});
