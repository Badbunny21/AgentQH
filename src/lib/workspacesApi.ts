import { supabase } from './supabase';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface WorkspaceRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
}

interface WorkspaceAgentRow {
  workspace_id: string;
  agent_id: string;
}

function rowToWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}

export async function fetchWorkspaces(userId: string): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[workspaces] fetch:', error.message);
    return [];
  }

  return (data as WorkspaceRow[]).map(rowToWorkspace);
}

export async function fetchWorkspaceAgentMap(userId: string): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('workspace_agents')
    .select('workspace_id, agent_id')
    .eq('user_id', userId);

  if (error) {
    console.error('[workspaces] fetch agents:', error.message);
    return {};
  }

  const map: Record<string, string[]> = {};
  for (const row of data as WorkspaceAgentRow[]) {
    if (!map[row.workspace_id]) map[row.workspace_id] = [];
    map[row.workspace_id].push(row.agent_id);
  }
  return map;
}

export async function fetchAgentWorkspaceMap(userId: string): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('workspace_agents')
    .select('workspace_id, agent_id')
    .eq('user_id', userId);

  if (error) {
    console.error('[workspaces] fetch agent map:', error.message);
    return {};
  }

  const map: Record<string, string> = {};
  for (const row of data as WorkspaceAgentRow[]) {
    map[row.agent_id] = row.workspace_id;
  }
  return map;
}

export async function createWorkspace(
  userId: string,
  name: string,
  description = ''
): Promise<{ workspace: Workspace | null; error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { workspace: null, error: 'Enter a workspace name.' };

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      user_id: userId,
      name: trimmed,
      description: description.trim(),
    })
    .select()
    .single();

  if (error) return { workspace: null, error: error.message };
  return { workspace: rowToWorkspace(data as WorkspaceRow), error: null };
}

export async function updateWorkspace(
  workspaceId: string,
  input: { name?: string; description?: string }
): Promise<{ error: string | null }> {
  const update: Record<string, string> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) return { error: 'Name cannot be empty.' };
    update.name = trimmed;
  }
  if (input.description !== undefined) update.description = input.description.trim();

  const { error } = await supabase.from('workspaces').update(update).eq('id', workspaceId);
  return { error: error?.message ?? null };
}

export async function deleteWorkspace(workspaceId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId);
  return { error: error?.message ?? null };
}

export async function assignAgentToWorkspace(
  userId: string,
  workspaceId: string,
  agentId: string
): Promise<{ error: string | null }> {
  await supabase.from('workspace_agents').delete().eq('agent_id', agentId).eq('user_id', userId);

  const { error } = await supabase.from('workspace_agents').insert({
    workspace_id: workspaceId,
    agent_id: agentId,
    user_id: userId,
  });

  return { error: error?.message ?? null };
}

export async function removeAgentFromWorkspace(
  userId: string,
  agentId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('workspace_agents')
    .delete()
    .eq('agent_id', agentId)
    .eq('user_id', userId);

  return { error: error?.message ?? null };
}
