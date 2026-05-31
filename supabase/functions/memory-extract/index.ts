import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { extractMemoryCandidates } from '../_shared/memoryExtract.ts';
import { assertAgentOwner, getSupabaseAdmin, getUserFromRequest } from '../_shared/supabaseAdmin.ts';

interface ExtractBody {
  agentId?: string;
  userMessage?: string;
  agentReply?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  if (!apiKey || apiKey.includes('your-')) {
    return jsonResponse({ error: 'Memory extraction is not configured on the server yet.' }, 503);
  }

  let body: ExtractBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const agentId = body.agentId?.trim();
  const userMessage = body.userMessage?.trim();
  const agentReply = body.agentReply?.trim();

  if (!agentId || !userMessage || !agentReply) {
    return jsonResponse({ error: 'agentId, userMessage, and agentReply are required' }, 400);
  }

  const owner = await assertAgentOwner(agentId, user.id);
  if (!owner) return jsonResponse({ error: 'Agent not found' }, 404);

  const supabase = getSupabaseAdmin();

  const { data: memoryRows } = await supabase
    .from('memories')
    .select('text')
    .eq('user_id', user.id)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true });

  const existingMemories = (memoryRows ?? []).map((row: { text: string }) => row.text);

  const result = await extractMemoryCandidates(apiKey, {
    userMessage,
    agentReply,
    existingMemories,
    agentName: owner.name,
  });

  if (result.error) {
    return jsonResponse({ error: result.error, candidates: [] }, 502);
  }

  return jsonResponse({ candidates: result.candidates });
});
