import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { registerForPushNotificationsAsync, savePushToken, removePushToken } from '../lib/pushNotifications';
import { deleteAccountForever } from '../lib/deleteAccountApi';
import { Profile } from '../types/database';

const LOCAL_STORAGE_KEYS = ['agenthq_active_workspace_id', 'agenthq_backup_enabled'];

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
  completeOnboarding: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  updateProfileName: (name: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[Auth] fetchProfile:', error.message);
    return null;
  }
  return data as Profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pushTokenRef = useRef<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(session.user.id);
    setProfile(p);
  }, [session?.user.id]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user.id) {
        fetchProfile(s.user.id).then(setProfile);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user.id) {
        fetchProfile(s.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user.id || profile?.push_notifications_enabled === false) return;

    let cancelled = false;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (cancelled || !token || !session?.user.id) return;
      pushTokenRef.current = token;
      await savePushToken(session.user.id, token);
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, profile?.push_notifications_enabled]);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) return { error: error.message };
    if (!data.session) return { error: null, needsConfirmation: true };
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    if (session?.user.id && pushTokenRef.current) {
      await removePushToken(session.user.id, pushTokenRef.current);
      pushTokenRef.current = null;
    }
    await supabase.auth.signOut();
    setProfile(null);
  };

  const deleteAccount = async () => {
    if (!session?.user.id) return { error: 'Not signed in' };

    if (pushTokenRef.current) {
      await removePushToken(session.user.id, pushTokenRef.current);
      pushTokenRef.current = null;
    }

    const result = await deleteAccountForever();
    if (result.error) return result;

    await AsyncStorage.multiRemove(LOCAL_STORAGE_KEYS);
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    return { error: null };
  };

  const completeOnboarding = async () => {
    if (!session?.user.id) return { error: 'Not signed in' };

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);

    if (error) return { error: error.message };

    await refreshProfile();
    return { error: null };
  };

  const updateProfileName = async (name: string) => {
    if (!session?.user.id) return { error: 'Not signed in' };
    const trimmed = name.trim();
    if (!trimmed) return { error: 'Name is required' };

    const { error } = await supabase
      .from('profiles')
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);

    if (error) return { error: error.message };

    await supabase.auth.updateUser({ data: { name: trimmed } });
    await refreshProfile();
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        deleteAccount,
        completeOnboarding,
        refreshProfile,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
