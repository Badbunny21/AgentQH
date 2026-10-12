/** These are stored task states, not live external-command telemetry. */
export function taskBoardLabel(task: { status: string; done: boolean; executionError: string | null }): string | null {
  if (task.done) return null;
  if (task.executionError?.trim()) return 'Error';
  if (task.status === 'review') return 'Review';
  if (task.status === 'doing') return 'In progress';
  return null;
}
