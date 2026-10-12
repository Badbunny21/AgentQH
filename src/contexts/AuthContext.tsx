import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { registerForPushNotificationsAsync, savePushToken, removePushToken } from '../lib/pushNotifications';
import { deleteAccountForever } from '../lib/deleteAccountApi';
import { createAuthHydrator } from '../lib/authHydration';
import { Profile } from '../types/database';

const LOCAL_STORAGE_KEYS = ['agenthq_active_workspace_id', 'agenthq_backup_enabled'];

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  profileError: boolean;
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
  const [profileError, setProfileError] = useState(false);
  const hydrationRef = useRef<ReturnType<typeof createAuthHydrator<Session, Profile>> | null>(null);
  const currentSessionRef = useRef<Session | null>(null);
  const pushTokenRef = useRef<string | null>(null);

  const refreshProfile = useCallback(async () => {
    await hydrationRef.current?.load(currentSessionRef.current);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) { setIsLoading(false); return; }
    let active = true;
    let authEventReceived = false;
    const hydrator = createAuthHydrator<Session, Profile>(fetchProfile, state => {
      if (!active) return;
      currentSessionRef.current = state.session;
      setSession(state.session);
      setProfile(state.profile);
      setIsLoading(state.isLoading);
      setProfileError(state.profileError);
    });
    hydrationRef.current = hydrator;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventReceived = true;
      // Hide the previous route immediately while a new signed-in profile loads.
      if (nextSession) { setIsLoading(true); setProfileError(false); }
      // Defer profile queries outside Supabase's auth callback lock.
      setTimeout(() => { if (active) void hydrator.load(nextSession); }, 0);
    });
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (active && !authEventReceived) void hydrator.load(initialSession);
    }).catch(() => { if (active && !authEventReceived) void hydrator.load(null); });
    return () => { active = false; hydrator.invalidate(); subscription.unsubscribe(); hydrationRef.current = null; };
  }, []);

  useEffect(() => {
    if (isLoading || !session?.user.id || !profile || profile.push_notifications_enabled === false) return;

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
  }, [isLoading, session?.user.id, profile?.push_notifications_enabled, !!profile]);

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
    await hydrationRef.current?.load(null);
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
        profileError,
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
