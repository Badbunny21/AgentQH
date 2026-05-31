export type Plan = 'free' | 'pro' | 'team';

export interface Profile {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  onboarding_complete: boolean;
  chat_messages_used?: number;
  usage_period_start?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_subscription_status?: string | null;
  push_notifications_enabled?: boolean;
  created_at: string;
  updated_at: string;
}
