import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
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

function activityIcon(type: string): string {
  if (type === 'task_done' || type === 'task_executed' || type === 'task_dispatched') return 'check';
  if (type === 'task_assigned') return 'plus';
  if (type === 'chat_reply') return 'msg';
  if (type === 'agent_created' || type === 'import') return 'share';
  return 'bell';
}

export default function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { activities, tasks, refresh, isLoading } = useTasks();
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
    const source =
      activities.length > 0
        ? activities
        : tasks
            .filter(t => t.agentId)
            .slice(0, 20)
            .map(t => {
              const agentName = agents.find(a => a.id === t.agentId)?.name ?? 'Agent';
              return {
                id: `task-${t.id}`,
                agentId: t.agentId,
                taskId: t.id,
                type: t.result ? 'task_done' : 'task_assigned',
                summary: t.result ? `${agentName} completed "${t.title}"` : `Assigned "${t.title}" to ${agentName}`,
                time: t.time,
                createdAt: t.executedAt ?? '',
              } satisfies Activity;
            });

    return source.filter(item => filterAgentIds([item.agentId]));
  }, [activities, tasks, agents, filterAgentIds]);

  const openItem = (item: Activity) => {
    if (item.taskId) {
      const task = tasks.find(t => t.id === item.taskId);
      if (task) setSelectedTask(task);
      return;
    }
    if (item.agentId) {
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
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text }}>Notifications</Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 2 }}>Activity feed · push alerts when enabled</Text>
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

        {feed.length === 0 ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Icon name="bell" size={32} color={C.textMuted} />
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 17, color: C.text, marginTop: 16, marginBottom: 8 }}>
              {activeWorkspace ? 'No activity in this workspace' : 'Nothing yet'}
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, textAlign: 'center', lineHeight: 20 }}>
              {activeWorkspace
                ? 'Activity from agents in this workspace will show here.'
                : 'Task updates, agent replies, and assignments will show here as you use AgentHQ.'}
            </Text>
          </View>
        ) : (
          feed.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => openItem(item)}
              activeOpacity={0.85}
              style={{ flexDirection: 'row', gap: 12, padding: 14, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, marginBottom: 8 }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={activityIcon(item.type)} size={16} color={C.a} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.text, lineHeight: 20 }}>{item.summary}</Text>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 6 }}>{item.time}</Text>
              </View>
              <Icon name="chevR" size={14} color={C.textMuted} />
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
