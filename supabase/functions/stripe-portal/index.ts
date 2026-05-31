import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { getStripe } from '../_shared/stripe.ts';
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
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return jsonResponse({ error: 'No billing account found. Subscribe to Pro first.' }, 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: 'agenthq://upgrade/success',
    });

    return jsonResponse({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Stripe error';
    return jsonResponse({ error: message }, 500);
  }
});
