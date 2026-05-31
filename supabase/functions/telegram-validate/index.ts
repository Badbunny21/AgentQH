import { corsHeaders, jsonResponse, optionsResponse } from '../_shared/cors.ts';
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

  const meResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const meData = await meResponse.json();

  if (!meData.ok) {
    return jsonResponse({ error: 'Invalid bot token. Copy it from @BotFather.' }, 400);
  }

  const bot = meData.result;
  return jsonResponse({
    botUsername: bot.username as string,
    botFirstName: bot.first_name as string,
    botId: bot.id as number,
  });
});
