import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export async function startProCheckout(): Promise<{ error: string | null; success?: boolean }> {
  const { data, error } = await supabase.functions.invoke('stripe-create-checkout');

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error as string };
  if (!data?.url) return { error: 'No checkout URL returned' };

  const result = await WebBrowser.openAuthSessionAsync(
    data.url as string,
    'agenthq://upgrade/success'
  );

  if (result.type === 'success') {
    return { error: null, success: true };
  }
  return { error: null, success: false };
}

export async function verifyStripeSetup(): Promise<{
  ok: boolean;
  checks: Record<string, { ok: boolean; detail: string }>;
  checkoutReady?: boolean;
  webhookUrl?: string;
  error: string | null;
}> {
  const { data, error } = await supabase.functions.invoke('stripe-verify', { method: 'GET' });

  if (error) return { ok: false, checks: {}, error: error.message };
  if (data?.error) return { ok: false, checks: data.checks ?? {}, error: data.error as string };

  return {
    ok: !!data?.ok,
    checks: (data?.checks as Record<string, { ok: boolean; detail: string }>) ?? {},
    checkoutReady: data?.checkoutReady as boolean | undefined,
    webhookUrl: data?.webhookUrl as string | undefined,
    error: null,
  };
}

export async function pollUntilProPlan(userId: string, maxAttempts = 8): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await supabase.from('profiles').select('plan').eq('id', userId).single();
    if (data?.plan === 'pro') return true;
    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
}

export async function syncSubscriptionFromStripe(): Promise<{
  plan: string | null;
  synced: boolean;
  error: string | null;
}> {
  const { data, error } = await supabase.functions.invoke('stripe-sync');

  if (error) return { plan: null, synced: false, error: error.message };
  if (data?.error) return { plan: null, synced: false, error: data.error as string };

  return {
    plan: (data?.plan as string) ?? null,
    synced: !!data?.synced,
    error: null,
  };
}

export async function openBillingPortal(): Promise<{ error: string | null; success?: boolean }> {
  const { data, error } = await supabase.functions.invoke('stripe-portal');

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error as string };
  if (!data?.url) return { error: 'No portal URL returned' };

  const result = await WebBrowser.openAuthSessionAsync(
    data.url as string,
    'agenthq://upgrade/success'
  );

  if (result.type === 'success') {
    return { error: null, success: true };
  }
  return { error: null, success: false };
}
