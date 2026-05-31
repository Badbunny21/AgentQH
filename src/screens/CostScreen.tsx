import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS, GRAD_KEYS } from '../constants/theme';
import { formatUsage } from '../constants/plans';
import { useAuth } from '../contexts/AuthContext';
import { useAgents } from '../contexts/AgentsContext';
import { fetchAiUsageStats, AiUsageStats } from '../lib/userStatsApi';
import AgentAvatar from '../components/AgentAvatar';
import Icon from '../components/Icon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Costs'>;
};

const USAGE_COLORS = ['#e879f9', '#22d3ee', '#a3e635', '#fbbf24', '#f87171'];

export default function CostScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const { agents } = useAgents();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<AiUsageStats | null>(null);

  const load = useCallback(async () => {
    if (!session?.user.id || !profile) return;
    setLoading(true);
    const stats = await fetchAiUsageStats(session.user.id, profile, agents);
    setUsage(stats);
    setLoading(false);
  }, [session?.user.id, profile, agents]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const agentRows = (usage?.agentUsage ?? []).map((row, i) => {
    const agent = agents.find(a => a.id === row.agentId);
    const total = row.messages + row.taskRuns;
    const maxTotal = Math.max(...(usage?.agentUsage ?? []).map(r => r.messages + r.taskRuns), 1);
    const pct = (total / maxTotal) * 100;
    const grad = agent ? GRAD_KEYS[agent.gradKey] : null;
    const color = grad?.[0] ?? USAGE_COLORS[i % USAGE_COLORS.length];
    return { agent, row, total, pct, color };
  });

  const usageItems = usage
    ? [
        { id: 'chat', label: 'Chat replies', count: usage.chatMessagesUsed, color: '#e879f9' },
        { id: 'tasks', label: 'Task runs', count: usage.taskRunsThisMonth, color: '#22d3ee' },
      ]
    : [];
  const usageMax = Math.max(...usageItems.map(u => u.count), 1);

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}
          >
            <Icon name="chevL" size={18} color={C.text} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 18 }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.a, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            This month
          </Text>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 30, color: C.text, letterSpacing: -1, lineHeight: 31.5 }}>
            AI usage & spend
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={C.a} style={{ paddingVertical: 40 }} />
        ) : usage ? (
          <>
            <View style={{ marginHorizontal: 16, marginBottom: 16, padding: 20, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ fontFamily: FONTS.semibold, fontSize: 48, color: C.text, letterSpacing: -2, lineHeight: 48 }}>
                  ${usage.planMonthlyCost}
                </Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 16, color: C.textDim, letterSpacing: -0.3 }}>/mo</Text>
                <View style={{ flex: 1 }} />
                <View style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {usage.planLabel} PLAN
                  </Text>
                </View>
              </View>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, marginTop: 12, lineHeight: 20 }}>
                {formatUsage(usage.chatMessagesUsed, usage.chatLimit)} · {usage.taskRunsThisMonth} task run{usage.taskRunsThisMonth === 1 ? '' : 's'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 56, marginTop: 18 }}>
                {usageItems.map(item => {
                  const barHeight = Math.max(8, (item.count / usageMax) * 44);
                  return (
                    <View key={item.id} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 56 }}>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.text }}>{item.count}</Text>
                      <View style={{ width: '100%', height: barHeight, backgroundColor: item.color, borderRadius: 4, opacity: 0.85 }} />
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 9, color: C.textDim, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        {item.id === 'chat' ? 'Chat' : 'Tasks'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4 }}>By agent</Text>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                {agentRows.length} ACTIVE
              </Text>
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}>
              {agentRows.length === 0 ? (
                <View style={{ padding: 20, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14 }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, textAlign: 'center', lineHeight: 19 }}>
                    No AI activity this month yet. Chat with an agent or run a task to see usage here.
                  </Text>
                </View>
              ) : (
                agentRows.map(({ agent, row, total, pct, color }) => (
                  <View key={row.agentId} style={{ backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, paddingHorizontal: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      {agent ? <AgentAvatar agent={agent} size={28} showStatus={false} /> : null}
                      <Text style={{ flex: 1, fontFamily: FONTS.medium, fontSize: 14, color: C.text, letterSpacing: -0.2 }}>
                        {agent?.name ?? 'Agent'}
                      </Text>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 13, color: C.text, letterSpacing: -0.3 }}>
                        {total} <Text style={{ color: C.textDim, fontSize: 11 }}>actions</Text>
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ flex: 1, height: 4, backgroundColor: C.c3, borderRadius: 999, overflow: 'hidden' }}>
                        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 999 }} />
                      </View>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase', color: C.textDim }}>
                        {row.messages} chat · {row.taskRuns} tasks
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {usage.planMonthlyCost === 0 && (
              <TouchableOpacity onPress={() => navigation.push('Upgrade')} style={{ marginHorizontal: 16, marginBottom: 24 }} activeOpacity={0.9}>
                <LinearGradient
                  colors={['#a3e635', '#22d3ee', '#e879f9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ padding: 20, borderRadius: C.radius, overflow: 'hidden' }}
                >
                  <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: 'rgba(10,10,15,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                    Need more capacity?
                  </Text>
                  <Text style={{ fontFamily: FONTS.semibold, fontSize: 22, color: 'rgba(10,10,15,0.95)', letterSpacing: -0.6, lineHeight: 26 }}>
                    Pro — 2,000 messages/mo
                  </Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 13.5, color: 'rgba(10,10,15,0.8)', letterSpacing: -0.2, lineHeight: 19.7, marginTop: 6 }}>
                    $12/mo · 20 agents · full memory · handoffs
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </>
        ) : null}

        <Text style={{ paddingHorizontal: 24, paddingBottom: 32, textAlign: 'center', fontFamily: FONTS.mono, fontSize: 10, color: C.textMuted, letterSpacing: 1, lineHeight: 16, textTransform: 'uppercase' }}>
          Live from your account · Resets monthly
        </Text>
      </ScrollView>
    </View>
  );
}
