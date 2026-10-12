import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTasks, Task } from '../contexts/TasksContext';
import { useAgents } from '../contexts/AgentsContext';
import { useWorkspaces } from '../contexts/WorkspacesContext';
import { Activity } from '../lib/activitiesApi';
import TaskDetailSheet from '../components/TaskDetailSheet';
import { C, FONTS } from '../constants/theme';
import Icon from '../components/Icon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Notifications'>;
};

function activityColor(type: string): string {
  if (type === 'task_assigned') return '#e879f9';
  if (type.includes('handoff')) return '#22d3ee';
  return C.a;
}

function activityIcon(type: string): string {
  if (type === 'task_done' || type === 'task_executed' || type === 'task_dispatched') return 'check';
  if (type === 'task_assigned') return 'plus';
  if (type === 'chat_reply') return 'msg';
  if (type === 'agent_created' || type === 'import') return 'share';
  return 'bell';
}

export default function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { activities, tasks, refresh, isLoading, activityError } = useTasks();
  const { agents } = useAgents();
  const { workspaces, activeWorkspaceId, setActiveWorkspace, filterAgentIds } = useWorkspaces();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const feed = useMemo(() => {
    return [...activities].filter(item => filterAgentIds([item.agentId]))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [activities, filterAgentIds]);

  const openItem = (item: Activity) => {
    if (item.taskId) {
      const task = tasks.find(t => t.id === item.taskId);
      if (task) { setSelectedTask(task); return; }
    }
    if (item.agentId && agents.some(a => a.id === item.agentId)) {
      navigation.navigate('AgentProfile', { agentId: item.agentId });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" size={18} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text }}>Notifications</Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 2 }}>Recorded updates from your agents</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings', { section: 'notifications' })} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="settings" size={16} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={C.a} />}
      >
        {activeWorkspace && (
          <TouchableOpacity
            onPress={() => setActiveWorkspace(null)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: 'rgba(163,230,53,0.08)', borderWidth: 1, borderColor: 'rgba(163,230,53,0.35)', borderRadius: 12, marginBottom: 14 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="folder" size={14} color={C.a} />
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.text }}>{activeWorkspace.name}</Text>
            </View>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.a }}>Clear filter</Text>
          </TouchableOpacity>
        )}

        {activityError && (
          <View style={{ padding: 16, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, marginBottom: 16 }}>
            <Text style={{ fontFamily: FONTS.medium, color: C.text, fontSize: 14 }}>{activityError}</Text>
            <TouchableOpacity onPress={refresh} style={{ paddingTop: 12 }}><Text style={{ fontFamily: FONTS.medium, color: C.a }}>Retry</Text></TouchableOpacity>
          </View>
        )}
        {isLoading && feed.length === 0 ? <ActivityIndicator color={C.a} style={{ marginTop: 40 }} /> : !activityError && feed.length === 0 ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Icon name="bell" size={32} color={C.textMuted} />
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 17, color: C.text, marginTop: 16, marginBottom: 8 }}>
              {activeWorkspace ? 'No activity in this workspace' : 'No activity yet'}
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, textAlign: 'center', lineHeight: 20 }}>
              {activeWorkspace
                ? 'Activity from agents in this workspace will show here.'
                : 'Recorded task updates, replies, and handoffs will appear here. No activity has been reported yet.'}
            </Text>
          </View>
        ) : (
          feed.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => openItem(item)}
              disabled={!((item.taskId && tasks.some(t => t.id === item.taskId)) || (item.agentId && agents.some(a => a.id === item.agentId)))}
              activeOpacity={0.85}
              style={{ flexDirection: 'row', gap: 12, padding: 14, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, marginBottom: 8 }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.c2, borderWidth: 1, borderColor: activityColor(item.type), alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={activityIcon(item.type)} size={16} color={activityColor(item.type)} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text, lineHeight: 20 }}>{item.summary}</Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 5 }}>{agents.find(a => a.id === item.agentId)?.name ?? (item.agentId ? 'Agent unavailable' : 'Account update')}</Text>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 6 }}>{item.time}</Text>
              </View>
              {((item.taskId && tasks.some(t => t.id === item.taskId)) || (item.agentId && agents.some(a => a.id === item.agentId))) && <Icon name="chevR" size={14} color={C.textMuted} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TaskDetailSheet
        task={selectedTask}
        visible={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </View>
  );
}
