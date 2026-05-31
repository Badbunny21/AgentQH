import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { sendPushToUser } from '../_shared/pushNotify.ts';
import { getSupabaseAdmin, getUserFromRequest } from '../_shared/supabaseAdmin.ts';

interface PushBody {
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body: PushBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const title = body.title?.trim();
  const pushBody = body.body?.trim();
  if (!title || !pushBody) {
    return jsonResponse({ error: 'title and body are required' }, 400);
  }

  const supabase = getSupabaseAdmin();
  await sendPushToUser(supabase, user.id, {
    title,
    body: pushBody,
    data: body.data,
  });

  return jsonResponse({ ok: true });
});
