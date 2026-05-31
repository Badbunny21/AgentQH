import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useAgents } from '../contexts/AgentsContext';
import { useWorkspaces } from '../contexts/WorkspacesContext';
import { fetchThreadPreviews, ThreadPreview } from '../lib/messagesApi';
import { syncAllDiscordAgents } from '../lib/discordImportApi';
import AgentAvatar from '../components/AgentAvatar';
import Icon from '../components/Icon';
import { GhostChip } from '../components/Buttons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function InboxScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { agents, getAgent } = useAgents();
  const { workspaces, activeWorkspaceId, setActiveWorkspace, filterAgentIds } = useWorkspaces();
  const [threads, setThreads] = useState<ThreadPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const loadThreads = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    const discordAgentIds = agents
      .filter(a => a.origin === 'Discord' && filterAgentIds([a.id]))
      .map(a => a.id);
    if (discordAgentIds.length > 0) {
      await syncAllDiscordAgents(discordAgentIds, false);
    }
    const previews = await fetchThreadPreviews(session.user.id);
    setThreads(previews);
    setLoading(false);
  }, [session?.user.id, agents, filterAgentIds]);

  useFocusEffect(
    useCallback(() => {
      loadThreads();
    }, [loadThreads])
  );

  const items = useMemo(
    () =>
      threads
        .map(thread => {
          const agent = getAgent(thread.agentId);
          if (!agent) return null;
          return { agent, ...thread };
        })
        .filter(Boolean)
        .filter(item => filterAgentIds([item!.agentId])) as Array<
        ThreadPreview & { agent: NonNullable<ReturnType<typeof getAgent>> }
      >,
    [threads, getAgent, filterAgentIds]
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            All your conversations
          </Text>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 32, color: C.text, letterSpacing: -1, lineHeight: 32 }}>
            Inbox
          </Text>
        </View>

        {activeWorkspace && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
            <TouchableOpacity
              onPress={() => setActiveWorkspace(null)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: 'rgba(163,230,53,0.08)', borderWidth: 1, borderColor: 'rgba(163,230,53,0.35)', borderRadius: 12 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="folder" size={14} color={C.a} />
                <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.text }}>{activeWorkspace.name}</Text>
              </View>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.a }}>Clear filter</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={C.a} style={{ marginTop: 40 }} />
        ) : agents.length === 0 ? (
          <View style={{ marginHorizontal: 16, padding: 28, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 17, color: C.text, marginBottom: 8 }}>No conversations yet</Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, textAlign: 'center', lineHeight: 20, marginBottom: 16 }}>
              Add an agent, then start a chat from Home.
            </Text>
            <GhostChip icon="plus" onPress={() => navigation.navigate('AddAgent')}>Add agent</GhostChip>
          </View>
        ) : items.length === 0 ? (
          <View style={{ marginHorizontal: 16, padding: 28, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 17, color: C.text, marginBottom: 8 }}>
              {activeWorkspace ? 'No conversations in this workspace' : 'No messages yet'}
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, textAlign: 'center', lineHeight: 20, marginBottom: activeWorkspace ? 16 : 0 }}>
              {activeWorkspace
                ? 'Assign agents to this workspace or clear the filter to see all threads.'
                : 'Open a chat with one of your agents to start a thread.'}
            </Text>
            {activeWorkspace ? (
              <GhostChip icon="folder" onPress={() => navigation.navigate('Workspaces')}>Manage workspace</GhostChip>
            ) : null}
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>
                {items.length} thread{items.length === 1 ? '' : 's'}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 12, paddingBottom: 40 }}>
              {items.map(item => (
                <TouchableOpacity
                  key={item.agentId}
                  onPress={() => navigation.navigate('Chat', { agentId: item.agentId })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: C.c1,
                    borderWidth: 1,
                    borderColor: C.border,
                    marginBottom: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <AgentAvatar agent={item.agent} size={46} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                      <Text style={{ fontFamily: FONTS.semibold, fontSize: 15, color: C.text, letterSpacing: -0.3 }}>
                        {item.agent.name}
                      </Text>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 0.5, flexShrink: 0 }}>
                        {item.time}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, marginTop: 2 }} numberOfLines={1}>
                      {item.role === 'user' && <Text style={{ color: C.textMuted }}>You: </Text>}
                      {item.preview}
                    </Text>
                  </View>
                  <Icon name="chevR" size={14} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
