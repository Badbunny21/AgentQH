# Stripe setup for AgentHQ Pro subscriptions

## 1. Create product in Stripe Dashboard

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. **Add product** → Name: `AgentHQ Pro`
3. Add a **recurring price**: $12/month
4. Copy the **Price ID** (starts with `price_`)

## 2. Set Supabase secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_PRO_PRICE_ID=price_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

Use **test keys** while developing (`sk_test_`, `price_` from test mode).

## 3. Deploy functions

```bash
supabase functions deploy stripe-create-checkout
supabase functions deploy stripe-portal
supabase functions deploy stripe-webhook
```

## 4. Configure Stripe webhook

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://bucmsetslcfmgbqwvilb.supabase.co/functions/v1/stripe-webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET`

## 5. Run SQL migration

Run `supabase/migrations/20260531150000_stripe_billing.sql` in Supabase SQL Editor.

## 6. Enable Customer Portal (optional but recommended)

Stripe Dashboard → **Settings → Billing → Customer portal** → Enable

## 7. Test flow

1. Open app → **You → See plans** (or hit chat limit → Upgrade)
2. Tap **Upgrade to Pro**
3. Use test card: `4242 4242 4242 4242`, any future date, any CVC
4. Return to app → profile should show **PRO**

## 8. Verify setup (in app)

Open **You → See plans**. The **Stripe status** panel at the bottom runs automatically and checks:

| Check | What it means |
|-------|----------------|
| Secret key | `STRIPE_SECRET_KEY` is set in Supabase secrets |
| Price ID | `STRIPE_PRO_PRICE_ID` is set |
| Webhook secret | `STRIPE_WEBHOOK_SECRET` is set |
| Price valid | Price exists in Stripe, is active, and is recurring |

All four must show ✓ before checkout works reliably.

### Manual webhook check (Stripe Dashboard)

1. [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Confirm endpoint URL: `https://bucmsetslcfmgbqwvilb.supabase.co/functions/v1/stripe-webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Click the endpoint → **Send test event** → `checkout.session.completed`
5. Should return **200** (not 400/500)

If you get **400 Missing signature**, the endpoint is live — real events from Stripe include the signature automatically.

### CLI verification (optional)

```bash
supabase secrets list --project-ref bucmsetslcfmgbqwvilb
# Should show STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID, STRIPE_WEBHOOK_SECRET

supabase functions list --project-ref bucmsetslcfmgbqwvilb
# Should show stripe-create-checkout, stripe-portal, stripe-webhook, stripe-verify as ACTIVE
```

## Deep links

The app uses `agenthq://upgrade/success` to return after checkout. Rebuild/reload Expo after adding the URL scheme.
