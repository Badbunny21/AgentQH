import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export function getSupabaseAdmin() {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(url, key);
}

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const supabase = getSupabaseAdmin();
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function assertAgentOwner(agentId: string, userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('agents')
    .select('id, user_id, name')
    .eq('id', agentId)
    .single();

  if (error || !data || data.user_id !== userId) {
    return null;
  }
  return data;
}

export function getProjectFunctionsBaseUrl() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  return supabaseUrl.replace('.supabase.co', '.supabase.co/functions/v1');
}
