import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { getProPriceId, getStripe } from '../_shared/stripe.ts';
import { getSupabaseAdmin, getUserFromRequest } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  try {
    const stripe = getStripe();
    const priceId = getProPriceId();
    const supabase = getSupabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, name, stripe_customer_id, plan')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse({ error: 'Profile not found' }, 404);
    }

    if (profile.plan === 'pro') {
      return jsonResponse({ error: 'You are already on Pro. Use Manage subscription to change billing.' }, 400);
    }

    let customerId = profile.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || user.email || undefined,
        name: profile.name || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'agenthq://upgrade/success',
      cancel_url: 'agenthq://upgrade/cancel',
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id, plan: 'pro' },
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan: 'pro' },
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return jsonResponse({ error: 'Could not create checkout session' }, 500);
    }

    return jsonResponse({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Stripe error';
    return jsonResponse({ error: message }, 500);
  }
});
