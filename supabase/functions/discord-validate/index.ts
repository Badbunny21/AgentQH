import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { discordBotGetMe, discordDisplayName } from '../_shared/discordApi.ts';
import { getUserFromRequest } from '../_shared/supabaseAdmin.ts';

interface ValidateBody {
  botToken?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body: ValidateBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const botToken = body.botToken?.trim();
  if (!botToken) return jsonResponse({ error: 'botToken is required' }, 400);

  const me = await discordBotGetMe(botToken);
  if (!me.ok) {
    return jsonResponse({ error: 'Invalid bot token. Copy it from the Discord Developer Portal.' }, 400);
  }

  return jsonResponse({
    botUsername: me.data.username,
    botDisplayName: discordDisplayName(me.data),
    botId: me.data.id,
  });
});
