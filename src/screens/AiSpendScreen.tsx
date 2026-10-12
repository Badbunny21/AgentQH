import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../contexts/AuthContext';
import { useAgents } from '../contexts/AgentsContext';
import { AgentSpendRow, fetchMonthlyAgentUsage } from '../lib/aiSpendApi';
import { C, FONTS } from '../constants/theme';
import Icon from '../components/Icon';
export default function AiSpendScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, 'AiSpend'> }) {
  const insets = useSafeAreaInsets(); const { session } = useAuth(); const { agents } = useAgents();
  const [rows, setRows] = useState<AgentSpendRow[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(false);
  const load = useCallback(async () => { if (!session?.user.id) { setLoading(false); return; } setLoading(true); setError(false); try { setRows(await fetchMonthlyAgentUsage(session.user.id)); } catch { setError(true); } finally { setLoading(false); } }, [session?.user.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const ids = [...new Set([...agents.map(a => a.id), ...rows.map(r => r.agentId)])];
  return <View style={{ flex: 1, backgroundColor: C.c0 }}><StatusBar barStyle="light-content" />
    <View style={{ padding: 20, paddingTop: insets.top + 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <TouchableOpacity accessibilityLabel="Back" onPress={() => navigation.goBack()}><Icon name="chevL" size={20} color={C.text} /></TouchableOpacity>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: 24, color: C.text }}>AI spend</Text>
    </View>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.a} />}>
      <View style={{ padding: 20, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, backgroundColor: C.c1, marginBottom: 20 }}>
        <Text style={{ color: C.textDim, fontFamily: FONTS.mono, fontSize: 11 }}>{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase()} · ALL AGENTS</Text>
        <Text style={{ color: C.text, fontFamily: FONTS.semibold, fontSize: 26, marginTop: 12 }}>Spend unavailable</Text>
        <Text style={{ color: C.textDim, fontFamily: FONTS.regular, lineHeight: 21, marginTop: 10 }}>Cost reporting is not connected yet. Recorded replies and task runs below are activity counts, not API bills.</Text>
        <Text style={{ color: C.a, fontFamily: FONTS.mono, fontSize: 10, marginTop: 14 }}>NO REPORTED OR ESTIMATED COST DATA</Text>
      </View>
      <Text style={{ color: C.text, fontFamily: FONTS.semibold, fontSize: 18, marginBottom: 14 }}>Per-agent breakdown</Text>
      {loading ? <ActivityIndicator color={C.a} /> : error ? <View><Text style={{ color: C.textDim, fontFamily: FONTS.regular }}>Could not load monthly usage.</Text><TouchableOpacity onPress={load}><Text style={{ color: C.a, marginTop: 12, fontFamily: FONTS.medium }}>Retry</Text></TouchableOpacity></View> : ids.length === 0 ? <Text style={{ color: C.textDim, fontFamily: FONTS.regular, lineHeight: 21 }}>No agents yet. Each agent's reported monthly usage will appear here when available.</Text> : ids.map(id => {
        const agent = agents.find(a => a.id === id); const usage = rows.find(r => r.agentId === id);
        return <View key={id} style={{ padding: 16, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, marginBottom: 12 }}>
          <Text style={{ color: C.text, fontFamily: FONTS.semibold, fontSize: 16 }}>{agent?.name ?? 'Removed agent'}</Text>
          <Text style={{ color: C.textDim, fontFamily: FONTS.regular, fontSize: 13, marginTop: 8 }}>Spend unavailable</Text>
          <Text style={{ color: C.textDim, fontFamily: FONTS.mono, fontSize: 11, marginTop: 12 }}>{usage?.replies ?? 0} recorded replies · {usage?.taskRuns ?? 0} task runs</Text>
        </View>;
      })}
      <Text style={{ color: C.textMuted, fontFamily: FONTS.regular, fontSize: 12, lineHeight: 19, marginTop: 12 }}>Counts cover records in AgentHQ for this calendar month, using your device's timezone. They may not include activity outside AgentHQ. No dollar amount is inferred from message counts or subscription prices.</Text>
    </ScrollView>
  </View>;
}
