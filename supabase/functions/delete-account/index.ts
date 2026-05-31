import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { getStripe } from '../_shared/stripe.ts';
import { getSupabaseAdmin, getUserFromRequest } from '../_shared/supabaseAdmin.ts';

async function deleteUserAvatars(supabase: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const { data: files, error: listError } = await supabase.storage.from('agent-avatars').list(userId);
  if (listError) {
    console.warn('[delete-account] avatar list:', listError.message);
    return;
  }
  if (!files?.length) return;

  const paths = files.map(f => `${userId}/${f.name}`);
  const { error: removeError } = await supabase.storage.from('agent-avatars').remove(paths);
  if (removeError) {
    console.warn('[delete-account] avatar remove:', removeError.message);
  }
}

async function cancelStripeSubscription(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id, stripe_subscription_status')
    .eq('id', userId)
    .maybeSingle();

  if (!profile?.stripe_subscription_id) return;

  try {
    const stripe = getStripe();
    const status = profile.stripe_subscription_status;
    if (status === 'active' || status === 'trialing' || status === 'past_due') {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    }
  } catch (e) {
    console.warn('[delete-account] stripe cancel:', e instanceof Error ? e.message : e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const supabase = getSupabaseAdmin();

  try {
    await cancelStripeSubscription(supabase, user.id);
    await deleteUserAvatars(supabase, user.id);

    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return jsonResponse({ error: deleteError.message }, 500);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not delete account';
    return jsonResponse({ error: message }, 500);
  }
});
