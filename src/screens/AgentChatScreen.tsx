import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAgents } from '../contexts/AgentsContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchMessages } from '../lib/messagesApi';
import { ChatMessage } from '../lib/messageUtils';
import { C, FONTS } from '../constants/theme';
import Icon from '../components/Icon';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'AgentChat'>; route: RouteProp<RootStackParamList, 'AgentChat'> };
export default function AgentChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { getAgent } = useAgents();
  const { session } = useAuth();
  const agent = getAgent(route.params.agentId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    setMessages([]); setDraft(''); setError(null); setLoading(true);
    if (!session?.user.id || !agent) { setLoading(false); return; }
    fetchMessages(session.user.id, agent.id)
      .then(rows => { if (active) setMessages(rows); })
      .catch(() => { if (active) setError('Could not load this conversation.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.user.id, agent?.id]));
  const refresh = async () => {
    if (!session?.user.id || !agent) return;
    setLoading(true); setError(null);
    try { setMessages(await fetchMessages(session.user.id, agent.id)); }
    catch { setError('Could not refresh this conversation.'); }
    finally { setLoading(false); }
  };
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.c0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar barStyle="light-content" />
    <View style={{ paddingTop: insets.top + 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <TouchableOpacity accessibilityLabel="Back" onPress={() => navigation.goBack()} style={{ padding: 8 }}><Icon name="chevL" color={C.text} size={20} /></TouchableOpacity>
      {agent && <View style={{ width: 42, height: 42, borderRadius: 13, borderWidth: 1, borderColor: C.border, backgroundColor: C.c2, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.a, fontFamily: FONTS.semibold, fontSize: 20 }}>{agent.name[0]}</Text></View>}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: FONTS.semibold, color: C.text, fontSize: 18 }}>{agent?.name ?? 'Agent unavailable'}</Text>
        <Text style={{ fontFamily: FONTS.mono, color: C.textDim, fontSize: 10, marginTop: 4 }}>RECORDED CONVERSATION</Text>
      </View>
    </View>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.a} />}>
      {!agent ? <Text style={{ color: C.textDim, fontFamily: FONTS.regular, lineHeight: 21 }}>This agent is no longer available. Return to Inbox to choose another conversation.</Text> : <>
        {error && <View style={{ padding: 16, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, marginBottom: 16 }}><Text style={{ color: C.text, fontFamily: FONTS.medium }}>{error}</Text><TouchableOpacity onPress={refresh} style={{ marginTop: 12 }}><Text style={{ color: C.a, fontFamily: FONTS.medium }}>Retry</Text></TouchableOpacity></View>}
        {loading && messages.length === 0 ? <ActivityIndicator color={C.a} style={{ marginTop: 40 }} /> : !error && messages.length === 0 ? <View style={{ padding: 24, alignItems: 'center' }}>
          <Icon name="msg" color={C.textMuted} size={30} />
          <Text style={{ color: C.text, fontFamily: FONTS.semibold, fontSize: 18, marginTop: 16 }}>No messages yet</Text>
          <Text style={{ color: C.textDim, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 21, marginTop: 8 }}>Messages reported by this agent will appear here. Sending and live progress are not connected yet.</Text>
        </View> : messages.map(message => <View key={message.id} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', minWidth: 80, padding: 14, marginBottom: 12, borderRadius: 18, backgroundColor: message.role === 'user' ? 'rgba(163,230,53,0.12)' : C.c1, borderWidth: 1, borderColor: message.role === 'user' ? 'rgba(163,230,53,0.35)' : C.border }}>
          <Text style={{ color: message.role === 'user' ? C.a : C.textDim, fontFamily: FONTS.mono, fontSize: 10, marginBottom: 7 }}>{message.role === 'user' ? 'YOU' : agent.name}</Text>
          <Text selectable style={{ color: C.text, fontFamily: FONTS.regular, fontSize: 15, lineHeight: 22 }}>{message.text}</Text>
          <Text style={{ color: C.textDim, fontFamily: FONTS.mono, fontSize: 10, marginTop: 8 }}>{message.time}</Text>
        </View>)}
      </>}
    </ScrollView>
    {agent && <View style={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16), borderTopWidth: 1, borderTopColor: C.border }}>
      <Text style={{ color: C.textDim, fontFamily: FONTS.regular, fontSize: 12, marginBottom: 10 }}>Draft only. Sending is not connected yet.</Text>
      <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 20, backgroundColor: C.c1, padding: 12 }}>
        <TextInput accessibilityLabel={`Draft message to ${agent.name}`} multiline maxLength={4000} value={draft} onChangeText={setDraft} placeholder={`Message ${agent.name}...`} placeholderTextColor={C.textMuted} style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.text, minHeight: 24, maxHeight: 100 }} />
      </View>
      <Text style={{ color: C.textMuted, fontFamily: FONTS.mono, fontSize: 9, marginTop: 7 }}>DRAFT IS NOT SAVED OR SENT</Text>
    </View>}
  </KeyboardAvoidingView>;
}
