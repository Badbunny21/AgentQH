import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_notifications_enabled')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.push_notifications_enabled === false) return;

  const { data: tokenRows } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);

  const tokens = (tokenRows ?? []).map((row: { token: string }) => row.token).filter(Boolean);
  if (tokens.length === 0) return;

  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title: payload.title.slice(0, 120),
    body: payload.body.slice(0, 240),
    data: payload.data ?? {},
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error('[push] expo send failed:', response.status, await response.text());
    }
  } catch (e) {
    console.error('[push] expo send error:', e instanceof Error ? e.message : e);
  }
}
