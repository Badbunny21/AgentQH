import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { callOpenAIChat, ChatTurn } from '../_shared/agentChat.ts';
import { checkChatAllowed, incrementChatUsage } from '../_shared/planLimits.ts';
import { assertAgentOwner, getSupabaseAdmin, getUserFromRequest } from '../_shared/supabaseAdmin.ts';

interface ChatBody {
  agentId?: string;
  userMessage?: string;
  history?: ChatTurn[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  if (!apiKey || apiKey.includes('your-')) {
    return jsonResponse({ error: 'Chat is not configured on the server yet.' }, 503);
  }

  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const agentId = body.agentId?.trim();
  const userMessage = body.userMessage?.trim();
  const history = body.history ?? [];

  if (!agentId || !userMessage) {
    return jsonResponse({ error: 'agentId and userMessage are required' }, 400);
  }

  const owner = await assertAgentOwner(agentId, user.id);
  if (!owner) return jsonResponse({ error: 'Agent not found' }, 404);

  const supabase = getSupabaseAdmin();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan, chat_messages_used, usage_period_start')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return jsonResponse({ error: 'Profile not found' }, 404);
  }

  const usageCheck = checkChatAllowed(profile);
  if (!usageCheck.allowed) {
    return jsonResponse({
      error: usageCheck.error,
      code: 'CHAT_LIMIT_REACHED',
      used: usageCheck.used,
      limit: usageCheck.limit,
    }, 402);
  }

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('name, role, bio, origin')
    .eq('id', agentId)
    .single();

  if (agentError || !agent) {
    return jsonResponse({ error: 'Agent not found' }, 404);
  }

  const { data: memoryRows } = await supabase
    .from('memories')
    .select('text')
    .eq('user_id', user.id)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true });

  const memories = (memoryRows ?? []).map((row: { text: string }) => row.text);

  const result = await callOpenAIChat(
    apiKey,
    {
      name: agent.name,
      role: agent.role,
      bio: agent.bio ?? '',
      origin: agent.origin ?? '',
      memories,
    },
    history,
    userMessage
  );

  if (result.error || !result.reply) {
    return jsonResponse({ error: result.error || 'Could not generate reply' }, 502);
  }

  await incrementChatUsage(supabase, user.id, profile);

  await supabase.from('activities').insert({
    user_id: user.id,
    agent_id: agentId,
    type: 'chat_reply',
    summary: `${agent.name} replied in chat`,
  });

  return jsonResponse({
    reply: result.reply,
    usage: { used: usageCheck.used + 1, limit: usageCheck.limit },
  });
});
