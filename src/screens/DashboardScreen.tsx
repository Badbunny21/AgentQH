import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS, GRAD_KEYS } from '../constants/theme';
import { Agent } from '../constants/agents';
import { useTasks, Task } from '../contexts/TasksContext';
import { useAuth } from '../contexts/AuthContext';
import { useAgents } from '../contexts/AgentsContext';
import { useWorkspaces } from '../contexts/WorkspacesContext';
import { fetchHandoffs, Handoff } from '../lib/handoffsApi';
import AddTaskSheet from '../components/AddTaskSheet';
import TaskDetailSheet from '../components/TaskDetailSheet';
import HandoffCard from '../components/HandoffCard';
import Icon from '../components/Icon';
import { GhostChip } from '../components/Buttons';
import { countNeedsAttention, rosterStatusLabel } from '../lib/homeSummary';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList> & {
    navigate: (screen: 'Tasks' | 'AddAgent' | 'AgentProfile' | 'Notifications' | 'Collaborate' | 'Workspaces', params?: { agentId?: string }) => void;
  };
};

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.c1, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 16, padding: 12 }}>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: 26, color: C.text, lineHeight: 29 }}>{value}</Text>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 }}>{label}</Text>
    </View>
  );
}

function AgentCard({ agent, onPress }: { agent: Agent; onPress: () => void }) {
  // Preserve the stored roster state. Online is not evidence of execution.
  const statusLabel = rosterStatusLabel(agent.status);
  const color = GRAD_KEYS[agent.gradKey]?.[0] || C.a;
  const statusColor = agent.status === 'away' ? C.away : agent.status === 'offline' ? C.offline : color;
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={`${agent.name}, ${statusLabel}. Open agent`} activeOpacity={0.8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.c1, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 18, padding: 14 }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: color, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 21, color }}>{Array.from(agent.name.trim())[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONTS.semibold, fontSize: 17, color: C.text }}>{agent.name}</Text>
          <View style={{ borderColor: statusColor, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 9, letterSpacing: 1, color: statusColor, textTransform: 'uppercase' }}>{statusLabel}</Text>
          </View>
        </View>
        <Text numberOfLines={2} style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 18, marginTop: 4 }}>{agent.activity || agent.role}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { agents } = useAgents();
  const { tasks, activities, refresh } = useTasks();
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    filterAgents,
    filterAgentIds,
  } = useWorkspaces();
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      if (session?.user.id) {
        fetchHandoffs(session.user.id).then(setHandoffs);
      }
    }, [refresh, session?.user.id])
  );

  const openHandoff = (handoff: Handoff) => {
    if (!handoff.taskId) return;
    const task = tasks.find(t => t.id === handoff.taskId);
    if (task) setSelectedTask(task);
  };

  const visibleAgents = useMemo(() => filterAgents(agents), [agents, filterAgents]);
  const visibleTasks = useMemo(() => tasks.filter(t => filterAgentIds([t.agentId])), [tasks, filterAgentIds]);
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const activityFeed = useMemo(() => {
    const sourceActivities = activities.filter(a => filterAgentIds([a.agentId]));
    if (sourceActivities.length > 0) return sourceActivities.slice(0, 5);
    return visibleTasks
      .filter(t => t.agentId)
      .slice(0, 5)
      .map(t => {
        const agentName = agents.find(a => a.id === t.agentId)?.name ?? 'Agent';
        const summary = t.result
          ? `${agentName} completed "${t.title}"`
          : `Assigned "${t.title}" to ${agentName}`;
        return {
          id: `task-${t.id}`,
          agentId: t.agentId,
          taskId: t.id,
          type: t.result ? 'task_done' : 'task_assigned',
          summary,
          time: t.time,
          createdAt: t.executedAt ?? '',
        };
      });
  }, [activities, visibleTasks, agents, filterAgentIds]);

  const openTask = (taskOrId: Task | string) => {
    const task = typeof taskOrId === 'string' ? tasks.find(t => t.id === taskOrId) : taskOrId;
    if (task) setSelectedTask(task);
  };
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  // Needs you counts actual task execution errors, never every open task.
  const needsYouCount = countNeedsAttention(visibleTasks);
  const visibleHandoffs = handoffs.filter(h => filterAgentIds([h.fromAgentId, h.toAgentId]));

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!selectedTask}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
              {greeting}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 30, color: C.text, letterSpacing: -0.7, lineHeight: 34 }}>
                Your crew
              </Text>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 26, color: C.a }}>.</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="bell" size={18} color={C.text} />
              {activityFeed.length > 0 && (
                <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: C.a, borderWidth: 2, borderColor: C.c2 }} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddAgent')}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="plus" size={18} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', gap: 8 }}>
          <StatBlock value={visibleAgents.length} label="Agents" />
          <StatBlock value={visibleTasks.length} label="Tasks" />
          <StatBlock value={needsYouCount} label="Needs you" />
        </View>

        {activeWorkspace && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
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

        {/* Roster */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 14, gap: 10 }}>
          {visibleAgents.length === 0 ? (
            <View style={{ width: '100%', backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, padding: 24, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 17, color: C.text, letterSpacing: -0.3, marginBottom: 8 }}>
                {activeWorkspace ? 'No agents in this workspace' : 'No agents yet'}
              </Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, textAlign: 'center', lineHeight: 20, marginBottom: 16 }}>
                {activeWorkspace
                  ? 'Assign agents from Workspaces, or clear the filter to see your full crew.'
                  : "Add the AI agents you work with — they'll live here on your home screen."}
              </Text>
              <GhostChip icon={activeWorkspace ? 'folder' : 'plus'} onPress={() => navigation.navigate(activeWorkspace ? 'Workspaces' : 'AddAgent')}>
                {activeWorkspace ? 'Manage workspace' : 'Add your first agent'}
              </GhostChip>
            </View>
          ) : (
            visibleAgents.map(agent => (
              <View key={agent.id}>
                <AgentCard
                  agent={agent}
                  onPress={() => navigation.navigate('AgentProfile', { agentId: agent.id })}
                />
              </View>
            ))
          )}
        </View>

        {/* Recent activity: historical items are not presented as today. */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4 }}>Recent activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim }}>See all →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}>
          {activityFeed.length === 0 && visibleTasks.length === 0 ? (
            <View style={{ padding: 20, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, alignItems: 'center', gap: 12 }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, textAlign: 'center', lineHeight: 19 }}>
                No activity yet. Assign a task or chat with an agent to see your system flow here.
              </Text>
              <GhostChip icon="plus" onPress={() => setShowAddTask(true)}>New task</GhostChip>
            </View>
          ) : (
            activityFeed.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => item.taskId && openTask(item.taskId)}
                disabled={!item.taskId}
                activeOpacity={item.taskId ? 0.85 : 1}
                style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: C.borderStrong }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.type === 'task_done' ? C.b : C.a }} />
                <Text numberOfLines={2} style={{ flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: C.text, lineHeight: 20 }}>{item.summary}</Text>
                <Text style={{ maxWidth: 64, fontFamily: FONTS.regular, fontSize: 10, color: C.textMuted }}>{item.time}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 8 }}>
          <GhostChip icon="plus" onPress={() => setShowAddTask(true)}>New task</GhostChip>
          <GhostChip icon="share" onPress={() => navigation.navigate('Collaborate')}>Collaborate</GhostChip>
          <GhostChip icon="folder" onPress={() => navigation.navigate('Workspaces')}>Workspaces</GhostChip>
        </ScrollView>

        {/* Handoffs */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4 }}>Handoffs</Text>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            BATON PASSED · {visibleHandoffs.length}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 8 }}>
          {visibleHandoffs.length === 0 ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Collaborate')}
              activeOpacity={0.85}
              style={{ padding: 16, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, textAlign: 'center', lineHeight: 19 }}>
                Pass work between agents — tap Collaborate to create a handoff.
              </Text>
            </TouchableOpacity>
          ) : (
            visibleHandoffs.slice(0, 2).map(handoff => (
              <HandoffCard
                key={handoff.id}
                handoff={handoff}
                task={handoff.taskId ? tasks.find(t => t.id === handoff.taskId) : null}
                onPress={() => openHandoff(handoff)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AddTaskSheet visible={showAddTask} onClose={() => setShowAddTask(false)} />
      <TaskDetailSheet
        task={selectedTask}
        visible={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </View>
  );
}
