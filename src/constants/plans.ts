export const PLAN_CHAT_LIMITS = {
  free: 50,
  pro: 2000,
  team: 10000,
} as const;

export type PlanId = keyof typeof PLAN_CHAT_LIMITS;

export function getChatLimit(plan: string): number {
  return PLAN_CHAT_LIMITS[plan as PlanId] ?? PLAN_CHAT_LIMITS.free;
}

export function formatUsage(used: number, limit: number): string {
  return `${used} / ${limit} messages this month`;
}

export const PLAN_MONTHLY_PRICES = {
  free: 0,
  pro: 12,
  team: 39,
} as const;
