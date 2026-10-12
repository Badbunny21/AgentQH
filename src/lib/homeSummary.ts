/** Task errors are the only existing task field that explicitly needs attention.
 * An open task is not evidence that an external agent is running or needs review.
 */
export function countNeedsAttention(tasks: readonly { done: boolean; executionError: string | null }[]): number {
  return tasks.filter(task => !task.done && !!task.executionError?.trim()).length;
}

export function rosterStatusLabel(status: string): string {
  const labels: Record<string, string> = { online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline' };
  return labels[status] || 'Unknown';
}
