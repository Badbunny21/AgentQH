import { File } from 'expo-file-system';
import { supabase } from './supabase';
import { AgentRow, rowToAgent } from './agentUtils';
import { Agent } from '../constants/agents';

export interface UpdateAgentInput {
  name?: string;
  role?: string;
  bio?: string;
  avatarUrl?: string | null;
}

export function isLocalImageUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('ph://') || uri.startsWith('content://');
}

function contentTypeForUri(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

async function readImageBytes(localUri: string): Promise<{ data: ArrayBuffer; contentType: string }> {
  const file = new File(localUri);
  const data = await file.arrayBuffer();
  return { data, contentType: contentTypeForUri(localUri) };
}

export async function updateAgent(
  agentId: string,
  input: UpdateAgentInput
): Promise<{ agent: Agent | null; error: string | null }> {
  const payload: Record<string, string | null> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.role !== undefined) payload.role = input.role.trim();
  if (input.bio !== undefined) payload.bio = input.bio.trim();
  if (input.avatarUrl !== undefined) payload.avatar_url = input.avatarUrl;

  const { data, error } = await supabase
    .from('agents')
    .update(payload)
    .eq('id', agentId)
    .select()
    .single();

  if (error) {
    console.error('[agents] update:', error.message);
    if (error.message.includes('avatar_url')) {
      return { agent: null, error: 'Photo storage is not set up yet. Run the agent_avatars migration in Supabase SQL.' };
    }
    return { agent: null, error: error.message };
  }
  return { agent: rowToAgent(data as AgentRow), error: null };
}

export async function uploadAgentAvatar(
  userId: string,
  agentId: string,
  localUri: string
): Promise<{ publicUrl: string | null; error: string | null }> {
  if (!isLocalImageUri(localUri)) {
    return { publicUrl: localUri, error: null };
  }

  const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext) ? ext : 'jpg';
  const path = `${userId}/${agentId}.${safeExt}`;

  let bytes: ArrayBuffer;
  let contentType: string;
  try {
    const read = await readImageBytes(localUri);
    bytes = read.data;
    contentType = read.contentType;
  } catch (readError) {
    console.error('[avatars] read:', readError);
    return { publicUrl: null, error: 'Could not read the selected photo. Try another image.' };
  }

  if (bytes.byteLength === 0) {
    return { publicUrl: null, error: 'Selected photo was empty. Try another image.' };
  }

  const { error: uploadError } = await supabase.storage
    .from('agent-avatars')
    .upload(path, bytes, { upsert: true, contentType });

  if (uploadError) {
    console.error('[avatars] upload:', uploadError.message);
    if (uploadError.message.toLowerCase().includes('bucket')) {
      return { publicUrl: null, error: 'Photo bucket missing. Run the agent_avatars migration in Supabase SQL.' };
    }
    return { publicUrl: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from('agent-avatars').getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
  return { publicUrl, error: null };
}

export async function removeAgentAvatar(userId: string, agentId: string): Promise<{ error: string | null }> {
  const { data: files, error: listError } = await supabase.storage
    .from('agent-avatars')
    .list(userId, { search: agentId });

  if (listError) return { error: listError.message };

  if (files && files.length > 0) {
    const paths = files.map(f => `${userId}/${f.name}`);
    const { error } = await supabase.storage.from('agent-avatars').remove(paths);
    if (error) return { error: error.message };
  }

  return { error: null };
}
