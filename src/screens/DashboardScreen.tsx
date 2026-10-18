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
import { GhostChip, PrimaryButton } from '../components/Buttons';
import { countNeedsAttention, rosterStatusLabel } from '../lib/homeSummary';
import { fetchAttentionFlags, fetchAgentPulses, AttentionFlag, AgentPulse } from '../lib/commandsApi';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList> & {
    navigate: (screen: 'Tasks' | 'AddAgent' | 'AgentProfile' | 'Notifications' | 'Collaborate' | 'Workspaces', params?: { agentId?: string }) => void;
  };
};

function StatBlock({ value, label, icon, tint }: { value: string | number; label: string; icon: string; tint: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.c1, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 16, padding: 12 }}>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: 26, color: C.text, lineHeight: 29 }}>{value}</Text>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 }}>{label}</Text>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: `${tint}1f`, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
        <Icon name={icon} size={13} color={tint} />
      </View>
    </View>
  );
}

function AgentCard({ agent, attention, pulse, onPress }: { agent: Agent; attention?: AttentionFlag; pulse?: AgentPulse; onPress: () => void }) {
  // Preserve the stored roster state. Online is not evidence of execution.
  const statusLabel = rosterStatusLabel(agent.status);
  const color = GRAD_KEYS[agent.gradKey]?.[0] || C.a;
  const statusColor = agent.status === 'away' ? C.away : agent.status === 'offline' ? C.offline : color;
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={`${agent.name}, ${statusLabel}.${attention === 'failed' ? ' Needs attention: a command failed.' : attention === 'stale' ? ' Not responding for over 10 minutes.' : ''} Open agent`} activeOpacity={0.8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.c1, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 18, padding: 14 }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: color, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 21, color }}>{Array.from(agent.name.trim())[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONTS.semibold, fontSize: 17, color: C.text }}>{agent.name}</Text>
          {attention && (
            <View
              accessibilityLabel={attention === 'failed' ? 'Needs attention' : 'Not responding'}
              style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: attention === 'failed' ? C.busy : C.away }}
            />
          )}
          <View style={{ borderColor: statusColor, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 9, letterSpacing: 1, color: statusColor, textTransform: 'uppercase' }}>{statusLabel}</Text>
          </View>
        </View>
        <Text numberOfLines={2} style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 18, marginTop: 4 }}>
          {pulse?.helpKind === 'approval' ? 'Waiting for approval'
            : pulse?.helpKind === 'failed' ? 'Needs help - a job failed'
            : pulse?.latestActivity || agent.activity || agent.role}
        </Text>
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
  const [attention, setAttention] = useState<Record<string, AttentionFlag>>({});
  const [pulses, setPulses] = useState<Record<string, AgentPulse>>({});

  useFocusEffect(
    useCallback(() => {
      refresh();
      if (session?.user.id) {
        fetchHandoffs(session.user.id).then(setHandoffs);
        fetchAttentionFlags(session.user.id).then(setAttention);
        fetchAgentPulses(session.user.id).then(setPulses);
        const t = setInterval(() => {
          fetchAgentPulses(session.user.id).then(setPulses);
          fetchAttentionFlags(session.user.id).then(setAttention);
        }, 15000);
        return () => clearInterval(t);
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
  const needsHelpAgents = visibleAgents.filter(a => pulses[a.id]?.needsHelp).length;
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
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="bell" size={18} color={C.text} />
              {activityFeed.length > 0 && (
                <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: C.a, borderWidth: 2, borderColor: C.c2 }} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddAgent')}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="plus" size={18} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status pill */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: needsHelpAgents > 0 ? 'rgba(248,113,113,0.12)' : 'rgba(163,230,53,0.12)',
              borderWidth: 1,
              borderColor: needsHelpAgents > 0 ? 'rgba(248,113,113,0.4)' : 'rgba(163,230,53,0.35)',
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: needsHelpAgents > 0 ? C.busy : C.a }} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: needsHelpAgents > 0 ? C.busy : C.a }}>
              {needsHelpAgents > 0 ? `${needsHelpAgents} need${needsHelpAgents === 1 ? 's' : ''} help` : 'All quiet'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', gap: 8 }}>
          <StatBlock value={visibleAgents.length} label="Agents" icon="user" tint={C.a} />
          <StatBlock value={visibleAgents.filter(a => (pulses[a.id]?.running ?? 0) > 0).length} label="Running" icon="bolt" tint={C.b} />
          <StatBlock value={needsHelpAgents} label="Needs help" icon="bell" tint={C.c} />
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
            <View style={{ width: '100%', backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, padding: 20 }}>
              {agents.length === 0 && !activeWorkspace ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(163,230,53,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="plus" size={18} color={C.a} />
                    </View>
                    <Text style={{ flex: 1, fontFamily: FONTS.medium, fontSize: 15, color: C.text, letterSpacing: -0.2 }}>Bring your first agent. It reports here.</Text>
                  </View>
                  <PrimaryButton icon="plus" iconPosition="start" onPress={() => navigation.navigate('AddAgent')} style={{ alignSelf: 'stretch' }}>Import your first agent</PrimaryButton>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 12 }}>No sample agent or history is saved.</Text>
                </>
              ) : (
                <>
                  <Text style={{ fontFamily: FONTS.semibold, fontSize: 17, color: C.text, marginBottom: 8 }}>No agents in this workspace</Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, lineHeight: 20, marginBottom: 16 }}>Assign agents from Workspaces, or clear the filter to see your full crew.</Text>
                  <GhostChip icon="folder" onPress={() => navigation.navigate('Workspaces')}>Manage workspace</GhostChip>
                </>
              )}
            </View>
          ) : (
            visibleAgents.map(agent => (
              <View key={agent.id}>
                <AgentCard
                  agent={agent}
                  attention={attention[agent.id]}
                  pulse={pulses[agent.id]}
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
