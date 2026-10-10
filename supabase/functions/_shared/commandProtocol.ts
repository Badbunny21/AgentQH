// Pure, dependency-free protocol rules for Command/Report Protocol v1.

export type CommandStatus =
  | 'pending' | 'claimed' | 'acknowledged' | 'in_progress'
  | 'done' | 'failed' | 'needs_review' | 'cancelled';

export type ReportKind = 'ack' | 'progress' | 'result' | 'error' | 'stop' | 'heartbeat';

export const CLOSED_STATUSES: CommandStatus[] = ['done', 'failed', 'needs_review', 'cancelled'];

export const REPORT_KINDS: ReportKind[] = ['ack', 'progress', 'result', 'error', 'stop', 'heartbeat'];

const KIND_TO_STATUS: Record<Exclude<ReportKind, 'heartbeat'>, CommandStatus> = {
  ack: 'acknowledged',
  progress: 'in_progress',
  result: 'done',
  error: 'failed',
  stop: 'needs_review',
};

export const STALE_AFTER_MS = 10 * 60 * 1000;

export function isClosed(status: string): boolean {
  return (CLOSED_STATUSES as string[]).includes(status);
}

export function isReportKind(v: unknown): v is ReportKind {
  return typeof v === 'string' && (REPORT_KINDS as string[]).includes(v);
}

/** Status a report moves a command to. null = no change (heartbeat). */
export function statusForReport(kind: ReportKind): CommandStatus | null {
  return kind === 'heartbeat' ? null : KIND_TO_STATUS[kind];
}

export type ReportCheck =
  | { ok: true; nextStatus: CommandStatus | null }
  | { ok: false; status: number; error: string };

/** Validate a report against the command's current status. */
export function checkReport(kind: ReportKind, currentStatus: string | null): ReportCheck {
  if (kind === 'heartbeat') return { ok: true, nextStatus: null };
  if (!currentStatus) return { ok: false, status: 400, error: 'command_id_required' };
  if (isClosed(currentStatus)) return { ok: false, status: 409, error: 'command_already_closed' };
  return { ok: true, nextStatus: statusForReport(kind) };
}

export function clampProgress(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function isStale(lastHeartbeatAt: string | null | undefined, now = Date.now()): boolean {
  if (!lastHeartbeatAt) return true;
  const t = Date.parse(lastHeartbeatAt);
  return Number.isNaN(t) || now - t > STALE_AFTER_MS;
}

export const AGENT_KEY_PREFIX = 'ahq_';

export function generateAgentKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return AGENT_KEY_PREFIX + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function looksLikeAgentKey(v: unknown): v is string {
  return typeof v === 'string' && /^ahq_[0-9a-f]{48}$/.test(v);
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}
