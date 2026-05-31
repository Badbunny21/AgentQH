import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

export function getStripe() {
  const key = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

export function getProPriceId(): string {
  const priceId = Deno.env.get('STRIPE_PRO_PRICE_ID') ?? '';
  if (!priceId) throw new Error('STRIPE_PRO_PRICE_ID is not configured');
  return priceId;
}

export function planFromSubscriptionStatus(status: string | null | undefined): 'free' | 'pro' {
  if (status === 'active' || status === 'trialing') return 'pro';
  return 'free';
}
