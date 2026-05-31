import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Share, Alert, ActivityIndicator, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../contexts/AuthContext';
import { C, FONTS } from '../constants/theme';
import { getChatLimit, formatUsage } from '../constants/plans';
import { useAgents } from '../contexts/AgentsContext';
import { useTasks } from '../contexts/TasksContext';
import { fetchUserDashboardStats } from '../lib/userStatsApi';
import Icon from '../components/Icon';

const BACKUP_KEY = 'agenthq_backup_enabled';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

function ProfileRow({
  icon,
  title,
  detail,
  onPress,
  danger = false,
  last = false,
}: {
  icon: string;
  title: string;
  detail?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingHorizontal: 18, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color={danger ? '#f87171' : C.text} />
      </View>
      <Text style={{ flex: 1, fontFamily: FONTS.medium, fontSize: 15, color: danger ? '#f87171' : C.text, letterSpacing: -0.2 }}>
        {title}
      </Text>
      {detail && (
        <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.textDim, letterSpacing: 0.5 }}>
          {detail}
        </Text>
      )}
      <Icon name="chevR" size={14} color={C.textMuted} />
    </TouchableOpacity>
  );
}

export default function UserProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, session, signOut, deleteAccount } = useAuth();
  const { agents } = useAgents();
  const { tasks } = useTasks();
  const [statsLoading, setStatsLoading] = useState(true);
  const [memoryCount, setMemoryCount] = useState(0);
  const [backupMessages, setBackupMessages] = useState(0);
  const [backupThreads, setBackupThreads] = useState(0);
  const [backupPlatforms, setBackupPlatforms] = useState(0);
  const [backupLastSync, setBackupLastSync] = useState('Never');
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [aiUsageLabel, setAiUsageLabel] = useState('—');
  const statsLoadedOnce = useRef(false);
  const profileRef = useRef(profile);
  const agentsRef = useRef(agents);
  profileRef.current = profile;
  agentsRef.current = agents;

  const displayName = profile?.name || 'User';
  const displayEmail = profile?.email || '';
  const displayPlan = (profile?.plan || 'free').toUpperCase();
  const agentCount = agents.length;
  const agentMax = profile?.plan === 'pro' ? 20 : profile?.plan === 'team' ? 50 : 5;
  const over = agentCount > agentMax;
  const rosterFraction = Math.min(1, agentCount / Math.max(agentMax, 1));
  const chatUsed = profile?.chat_messages_used ?? 0;
  const chatLimit = getChatLimit(profile?.plan || 'free');
  const chatFraction = Math.min(1, chatUsed / Math.max(chatLimit, 1));

  const loadStats = useCallback(async () => {
    const currentProfile = profileRef.current;
    const currentAgents = agentsRef.current;
    if (!session?.user.id || !currentProfile) {
      setStatsLoading(false);
      return;
    }
    if (!statsLoadedOnce.current) {
      setStatsLoading(true);
    }
    const stats = await fetchUserDashboardStats(session.user.id, currentProfile, currentAgents);
    setMemoryCount(stats.memory.factCount);
    setBackupMessages(stats.backup.messageCount);
    setBackupThreads(stats.backup.threadCount);
    setBackupPlatforms(stats.backup.platformCount);
    setBackupLastSync(stats.backup.lastSyncLabel);
    const { usage } = stats;
    if (usage.planMonthlyCost > 0) {
      setAiUsageLabel(`$${usage.planMonthlyCost}/MO · ${usage.totalAiActions} AI ACTIONS`);
    } else {
      setAiUsageLabel(`${usage.chatMessagesUsed} MSGS · ${usage.taskRunsThisMonth} RUNS`);
    }
    statsLoadedOnce.current = true;
    setStatsLoading(false);
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(BACKUP_KEY).then(v => {
        if (v !== null) setBackupEnabled(v === 'true');
      });
      loadStats();
    }, [loadStats])
  );

  useEffect(() => {
    loadStats();
  }, [profile?.plan, profile?.chat_messages_used, agents.length, loadStats]);

  const handleExportData = async () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        profile: { name: profile?.name, email: profile?.email, plan: profile?.plan },
        agents: agents.map(a => ({ name: a.name, role: a.role, origin: a.origin })),
        tasks: tasks.map(t => ({ title: t.title, status: t.status, done: t.done, agentId: t.agentId })),
      };
      await Share.share({
        message: JSON.stringify(payload, null, 2),
        title: 'AgentHQ export',
      });
    } catch {
      Alert.alert('Export failed', 'Could not share your data export.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account forever?',
      'This permanently removes your profile, agents, messages, tasks, memories, and billing data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Last chance',
              'Your account and all data will be erased immediately.',
              [
                { text: 'Keep account', style: 'cancel' },
                {
                  text: 'Delete forever',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true);
                    const result = await deleteAccount();
                    setDeletingAccount(false);
                    if (result.error) {
                      Alert.alert('Could not delete account', result.error);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const toggleBackup = async (value: boolean) => {
    setBackupEnabled(value);
    await AsyncStorage.setItem(BACKUP_KEY, value ? 'true' : 'false');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 32, color: C.text, letterSpacing: -1 }}>You</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}
          >
            <Icon name="settings" size={18} color={C.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.85}
          style={{ marginHorizontal: 16, marginBottom: 18, padding: 18, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <LinearGradient
            colors={['#22d3ee', '#e879f9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: FONTS.bold, fontSize: 26, color: 'rgba(10,10,15,0.85)', letterSpacing: -1 }}>
              {displayName[0]?.toUpperCase() || '?'}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4 }}>
                {displayName}
              </Text>
              <View style={{ paddingVertical: 3, paddingHorizontal: 7, borderRadius: 5, backgroundColor: C.c3, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: C.text, letterSpacing: 1.2 }}>
                  {displayPlan}
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, letterSpacing: -0.15 }}>
              {displayEmail}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ marginHorizontal: 16, marginBottom: 18, padding: 14, paddingHorizontal: 18, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Roster size
            </Text>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 14, color: C.text, letterSpacing: -0.3 }}>
              <Text style={{ color: over ? '#f87171' : C.a }}>{agentCount}</Text>
              <Text style={{ color: C.textDim }}> / {agentMax}</Text>
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: C.c3, borderRadius: 999, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#a3e635', '#22d3ee', '#e879f9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: '100%', width: `${rosterFraction * 100}%`, borderRadius: 999 }}
            />
          </View>
          {over && (
            <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, letterSpacing: -0.1, marginTop: 10, lineHeight: 17.4 }}>
              You're over the Free tier limit.{' '}
              <Text style={{ color: C.a, fontFamily: FONTS.medium }}>
                {agentCount - agentMax} agents read-only.
              </Text>
            </Text>
          )}
        </View>

        <View style={{ marginHorizontal: 16, marginBottom: 24, padding: 16, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 14, color: C.text }}>AI chat usage</Text>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.textDim }}>{formatUsage(chatUsed, chatLimit)}</Text>
          </View>
          <View style={{ height: 6, backgroundColor: C.c2, borderRadius: 999, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${chatFraction * 100}%`, backgroundColor: chatUsed >= chatLimit ? '#f87171' : C.a, borderRadius: 999 }} />
          </View>
          {chatUsed >= chatLimit && (
            <TouchableOpacity onPress={() => navigation.navigate('Upgrade')} style={{ marginTop: 12 }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.a }}>Upgrade for more messages →</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Upgrade')} style={{ marginHorizontal: 16, marginBottom: 24 }} activeOpacity={0.9}>
          <LinearGradient
            colors={['#a3e635', '#22d3ee', '#e879f9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: 18, borderRadius: C.radius, overflow: 'hidden' }}
          >
            <View style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.25)', transform: [{ translateX: 40 }, { translateY: -40 }] }} />
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: 'rgba(10,10,15,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
              Upgrade to Pro
            </Text>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: 'rgba(10,10,15,0.95)', letterSpacing: -0.4, lineHeight: 21.6, marginBottom: 4 }}>
              Unlock 20 agents, full memory{'\n'}and agent collaboration.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: 'rgba(10,10,15,0.85)' }}>See plans</Text>
              <Icon name="arrow" size={14} color="rgba(10,10,15,0.85)" strokeWidth={2.5} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Memory')}
            style={{ flex: 1, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, padding: 14, overflow: 'hidden' }}
            activeOpacity={0.8}
          >
            <View style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, backgroundColor: C.a, opacity: 0.06, borderRadius: 40 }} />
            <Icon name="brain" size={18} color={C.a} />
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 15, color: C.text, letterSpacing: -0.3, marginTop: 10 }}>Memory</Text>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>
              {statsLoading ? '…' : `${memoryCount} FACT${memoryCount === 1 ? '' : 'S'}`} · YOU OWN IT
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Costs')}
            style={{ flex: 1, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, padding: 14, overflow: 'hidden' }}
            activeOpacity={0.8}
          >
            <View style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, backgroundColor: '#e879f9', opacity: 0.06, borderRadius: 40 }} />
            <Icon name="sigma" size={18} color="#e879f9" />
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 15, color: C.text, letterSpacing: -0.3, marginTop: 10 }}>AI spend</Text>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>
              {statsLoading ? '…' : aiUsageLabel}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginHorizontal: 16, marginBottom: 18, padding: 16, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="download" size={16} color={C.a} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 14, color: C.text, letterSpacing: -0.2 }}>
                Conversation backup
              </Text>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 }}>
                LAST SYNC · {statsLoading ? '…' : backupLastSync.toUpperCase()}
              </Text>
            </View>
            <Switch value={backupEnabled} onValueChange={toggleBackup} trackColor={{ false: C.c3, true: C.a }} />
          </View>
          {statsLoading ? (
            <ActivityIndicator color={C.a} style={{ paddingVertical: 12 }} />
          ) : (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4 }}>{backupMessages.toLocaleString()}</Text>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: C.textDim, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>MESSAGES</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4 }}>{backupThreads}</Text>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: C.textDim, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>THREADS</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4 }}>{backupPlatforms}</Text>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: C.textDim, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>PLATFORMS</Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, overflow: 'hidden' }}>
          <ProfileRow icon="download" title="Export data" onPress={handleExportData} />
          <ProfileRow
            icon="x"
            title={deletingAccount ? 'Deleting account…' : 'Delete account'}
            danger
            onPress={deletingAccount ? undefined : handleDeleteAccount}
          />
          <ProfileRow icon="x" title="Sign out" danger last onPress={handleSignOut} />
        </View>

        <Text style={{ textAlign: 'center', fontFamily: FONTS.mono, fontSize: 10, color: C.textMuted, letterSpacing: 1, marginBottom: 32 }}>
          AGENTHQ · v0.4.2 · BUILD 8421
        </Text>
      </ScrollView>
    </View>
  );
}
