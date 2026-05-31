import { getStripe, planFromSubscriptionStatus } from '../_shared/stripe.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import type Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

async function updateUserPlan(
  userId: string,
  plan: 'free' | 'pro',
  subscriptionId: string | null,
  subscriptionStatus: string | null,
  customerId?: string | null
) {
  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = {
    plan,
    stripe_subscription_id: subscriptionId,
    stripe_subscription_status: subscriptionStatus,
    updated_at: new Date().toISOString(),
  };
  if (customerId) update.stripe_customer_id = customerId;

  await supabase.from('profiles').update(update).eq('id', userId);
}

async function resolveUserId(
  userIdFromMeta: string | null | undefined,
  customerId: string | null | undefined
): Promise<string | null> {
  if (userIdFromMeta) return userIdFromMeta;
  if (!customerId) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  return data?.id ?? null;
}

function customerIdFrom(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('OK', { status: 200 });
  }

  const stripe = getStripe();
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid signature';
    return new Response(message, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = await resolveUserId(
        session.metadata?.supabase_user_id || session.client_reference_id,
        customerIdFrom(session.customer)
      );
      if (!userId) break;

      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id ?? null;

      let subscriptionStatus = 'active';
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        subscriptionStatus = sub.status;
      }

      await updateUserPlan(
        userId,
        planFromSubscriptionStatus(subscriptionStatus),
        subscriptionId,
        subscriptionStatus,
        customerIdFrom(session.customer)
      );
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await resolveUserId(
        subscription.metadata?.supabase_user_id,
        customerIdFrom(subscription.customer)
      );
      if (!userId) break;

      await updateUserPlan(
        userId,
        planFromSubscriptionStatus(subscription.status),
        subscription.id,
        subscription.status
      );
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await resolveUserId(
        subscription.metadata?.supabase_user_id,
        customerIdFrom(subscription.customer)
      );
      if (!userId) break;

      await updateUserPlan(userId, 'free', null, 'canceled');
      break;
    }

    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
