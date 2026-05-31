import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export type PlanId = 'free' | 'pro' | 'team';

export const PLAN_CHAT_LIMITS: Record<PlanId, number> = {
  free: 50,
  pro: 2000,
  team: 10000,
};

export function getChatLimit(plan: string): number {
  const key = plan as PlanId;
  return PLAN_CHAT_LIMITS[key] ?? PLAN_CHAT_LIMITS.free;
}

export interface UsageProfile {
  plan: string;
  chat_messages_used: number;
  usage_period_start: string;
}

export function resetUsageIfNeeded(profile: UsageProfile): { used: number; periodStart: string; reset: boolean } {
  const periodStart = new Date(profile.usage_period_start);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  if (periodStart < monthStart) {
    return { used: 0, periodStart: monthStart.toISOString(), reset: true };
  }
  return { used: profile.chat_messages_used, periodStart: profile.usage_period_start, reset: false };
}

export function checkChatAllowed(profile: UsageProfile): { allowed: boolean; used: number; limit: number; error?: string } {
  const limit = getChatLimit(profile.plan);
  const { used } = resetUsageIfNeeded(profile);

  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      error: `Monthly chat limit reached (${limit} messages on ${profile.plan} plan). Upgrade to Pro for more.`,
    };
  }

  return { allowed: true, used, limit };
}

export async function incrementChatUsage(
  supabase: SupabaseClient,
  userId: string,
  profile: UsageProfile
): Promise<void> {
  const reset = resetUsageIfNeeded(profile);
  const nextUsed = reset.reset ? 1 : reset.used + 1;

  await supabase
    .from('profiles')
    .update({
      chat_messages_used: nextUsed,
      usage_period_start: reset.periodStart,
    })
    .eq('id', userId);
}
