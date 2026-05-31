import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { getStripe, planFromSubscriptionStatus } from '../_shared/stripe.ts';
import { getSupabaseAdmin, getUserFromRequest } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  try {
    const stripe = getStripe();
    const supabase = getSupabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, plan')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse({ error: 'Profile not found' }, 404);
    }

    const customerId = profile.stripe_customer_id as string | null;
    if (!customerId) {
      return jsonResponse({
        plan: profile.plan ?? 'free',
        synced: false,
        message: 'No Stripe customer yet. Complete checkout first.',
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 5,
    });

    const activeSub = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    if (activeSub) {
      const plan = planFromSubscriptionStatus(activeSub.status);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan,
          stripe_subscription_id: activeSub.id,
          stripe_subscription_status: activeSub.status,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        return jsonResponse({ error: updateError.message }, 500);
      }

      return jsonResponse({
        plan,
        synced: true,
        subscriptionStatus: activeSub.status,
      });
    }

    const latest = subscriptions.data[0];
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: 'free',
        stripe_subscription_id: latest?.id ?? null,
        stripe_subscription_status: latest?.status ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500);
    }

    return jsonResponse({
      plan: 'free',
      synced: true,
      subscriptionStatus: latest?.status ?? null,
      message: 'No active subscription found in Stripe.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Stripe sync error';
    return jsonResponse({ error: message }, 500);
  }
});
