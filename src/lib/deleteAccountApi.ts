import { supabase } from './supabase';

export async function deleteAccountForever(): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });

  if (error) {
    return { error: error.message || 'Could not delete account.' };
  }

  if (data?.error) {
    return { error: data.error as string };
  }

  return { error: null };
}
