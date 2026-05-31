import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { getProPriceId, getStripe } from '../_shared/stripe.ts';
import { getUserFromRequest } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const checks: Record<string, { ok: boolean; detail: string }> = {};

  try {
    getStripe();
    checks.secret_key = { ok: true, detail: 'STRIPE_SECRET_KEY is set' };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Missing secret key';
    checks.secret_key = { ok: false, detail: message };
    return jsonResponse({ ok: false, checks }, 503);
  }

  let priceId: string;
  try {
    priceId = getProPriceId();
    checks.price_id = { ok: true, detail: priceId };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Missing price ID';
    checks.price_id = { ok: false, detail: message };
    return jsonResponse({ ok: false, checks }, 503);
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
  checks.webhook_secret = webhookSecret
    ? { ok: true, detail: 'STRIPE_WEBHOOK_SECRET is set' }
    : { ok: false, detail: 'STRIPE_WEBHOOK_SECRET is not configured' };

  try {
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });

    const amount = price.unit_amount ?? 0;
    const currency = (price.currency ?? 'usd').toUpperCase();
    const interval = price.recurring?.interval ?? 'unknown';
    const productName =
      typeof price.product === 'object' && price.product && 'name' in price.product
        ? (price.product as { name: string }).name
        : 'AgentHQ Pro';

    checks.price_valid = {
      ok: price.active === true,
      detail: price.active
        ? `${productName} · ${currency} ${(amount / 100).toFixed(0)}/${interval}`
        : 'Price exists but is not active in Stripe',
    };

    if (price.type !== 'recurring') {
      checks.price_valid = { ok: false, detail: 'Price must be recurring (subscription)' };
    }

    const allOk = Object.values(checks).every(c => c.ok);
    return jsonResponse({
      ok: allOk,
      checks,
      checkoutReady: allOk,
      webhookUrl: 'https://bucmsetslcfmgbqwvilb.supabase.co/functions/v1/stripe-webhook',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not validate price';
    checks.price_valid = { ok: false, detail: message };
    return jsonResponse({ ok: false, checks, checkoutReady: false }, 502);
  }
});
