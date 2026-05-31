import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS, GRAD_KEYS } from '../constants/theme';
import { useAgents } from '../contexts/AgentsContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchMemoriesForAgent, createMemory, Memory } from '../lib/memoriesApi';
import AddMemorySheet from '../components/AddMemorySheet';
import { fetchAgentStats, AgentStats } from '../lib/agentStatsApi';
import { PLATFORMS } from '../constants/data';
import AgentAvatar from '../components/AgentAvatar';
import PlatformLogo from '../components/PlatformLogo';
import Icon from '../components/Icon';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import AddTaskSheet from '../components/AddTaskSheet';
import TaskRow from '../components/TaskRow';
import TaskDetailSheet from '../components/TaskDetailSheet';
import { useTasks, Task } from '../contexts/TasksContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AgentProfile'>;
  route: RouteProp<RootStackParamList, 'AgentProfile'>;
};

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: 24, color: C.text, letterSpacing: -1, lineHeight: 24 }}>
        {value}
      </Text>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 6 }}>
        {label}
      </Text>
    </View>
  );
}

const EMBLEM_LARGE_PATHS: Record<string, React.ReactNode> = {
  triStack: (
    <>
      <Path d="M50 22 L70 56 L30 56 Z" fill="none" stroke="rgba(10,10,15,0.95)" strokeWidth="3.5" />
      <Path d="M50 44 L78 78 L22 78 Z" fill="rgba(10,10,15,0.95)" />
    </>
  ),
  hexMesh: (
    <>
      <Path d="M50 18 L78 34 L78 66 L50 82 L22 66 L22 34 Z" fill="none" stroke="rgba(10,10,15,0.95)" strokeWidth="3.5" />
      <Path d="M50 18 L50 50 L78 66 M50 50 L22 66 M50 50 L50 82" stroke="rgba(10,10,15,0.95)" strokeWidth="3.5" fill="none" />
    </>
  ),
  spark: (
    <>
      <Path d="M50 18 L56 44 L82 50 L56 56 L50 82 L44 56 L18 50 L44 44 Z" fill="rgba(10,10,15,0.95)" />
      <Circle cx="76" cy="24" r="4" fill="rgba(10,10,15,0.95)" />
      <Circle cx="24" cy="76" r="3" fill="rgba(10,10,15,0.95)" />
    </>
  ),
  grid: (
    <>
      <Rect x="22" y="22" width="24" height="24" fill="rgba(10,10,15,0.95)" />
      <Rect x="54" y="22" width="24" height="24" fill="none" stroke="rgba(10,10,15,0.95)" strokeWidth="3.5" />
      <Rect x="22" y="54" width="24" height="24" fill="none" stroke="rgba(10,10,15,0.95)" strokeWidth="3.5" />
      <Rect x="54" y="54" width="24" height="24" fill="rgba(10,10,15,0.95)" />
    </>
  ),
  rings: (
    <>
      <Circle cx="50" cy="50" r="30" fill="none" stroke="rgba(10,10,15,0.95)" strokeWidth="3.5" />
      <Circle cx="50" cy="50" r="18" fill="none" stroke="rgba(10,10,15,0.95)" strokeWidth="3.5" />
      <Circle cx="50" cy="50" r="7" fill="rgba(10,10,15,0.95)" />
    </>
  ),
  crescent: (
    <>
      <Path d="M68 24 a32 32 0 1 0 0 52 a24 24 0 1 1 0 -52 Z" fill="rgba(10,10,15,0.95)" />
      <Circle cx="72" cy="36" r="4" fill="rgba(10,10,15,0.95)" />
    </>
  ),
  diamond: (
    <>
      <Path d="M50 16 L82 50 L50 84 L18 50 Z" fill="none" stroke="rgba(10,10,15,0.95)" strokeWidth="3.5" />
      <Path d="M50 32 L66 50 L50 68 L34 50 Z" fill="rgba(10,10,15,0.95)" />
    </>
  ),
  arrow: <Path d="M22 50 L78 50 M58 30 L78 50 L58 70" stroke="rgba(10,10,15,0.95)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  wave: (
    <>
      <Path d="M14 50 Q28 28 42 50 T70 50 T86 50" stroke="rgba(10,10,15,0.95)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Path d="M14 64 Q28 42 42 64 T70 64 T86 64" stroke="rgba(10,10,15,0.95)" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5" />
    </>
  ),
  quote: (
    <>
      <Path d="M24 32 L40 32 L40 56 L24 70 Z" fill="rgba(10,10,15,0.95)" />
      <Path d="M52 32 L68 32 L68 56 L52 70 Z" fill="rgba(10,10,15,0.95)" />
    </>
  ),
  shield: (
    <>
      <Path d="M50 18 L78 28 L78 52 Q78 72 50 84 Q22 72 22 52 L22 28 Z" fill="none" stroke="rgba(10,10,15,0.95)" strokeWidth="3.5" />
      <Path d="M38 50 L46 58 L62 42" stroke="rgba(10,10,15,0.95)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

export default function AgentProfileScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { agentId } = route.params;
  const { getAgent } = useAgents();
  const { session } = useAuth();
  const { tasks, toggleTask, refresh } = useTasks();
  const agent = getAgent(agentId);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);

  const agentOpenTasks = tasks.filter(t => t.agentId === agentId && !t.done);
  const agentDoneTasks = tasks.filter(t => t.agentId === agentId && t.done).slice(0, 5);

  const loadStats = useCallback(() => {
    if (!session?.user.id || !agentId) return;
    fetchAgentStats(session.user.id, agentId).then(setStats);
  }, [session?.user.id, agentId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadStats();
    }, [refresh, loadStats])
  );

  useEffect(() => {
    if (!session?.user.id || !agentId) return;
    fetchMemoriesForAgent(session.user.id, agentId).then(setMemories);
  }, [session?.user.id, agentId, showAddMemory]);

  const handleAddMemory = async (text: string) => {
    if (!session?.user.id) return { error: 'Not signed in' };
    const result = await createMemory(session.user.id, agentId, text);
    if (!result.error && result.memory) {
      setMemories(prev => [...prev, result.memory!]);
    }
    return { error: result.error };
  };

  if (!agent) {
    return (
      <View style={{ flex: 1, backgroundColor: C.c0, alignItems: 'center', justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.a }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [gradFrom, gradTo] = GRAD_KEYS[agent.gradKey] || GRAD_KEYS.ab;
  const platform = PLATFORMS.find(p => p.name.toLowerCase() === agent.origin.toLowerCase());
  const agentTint = gradFrom;

  const statusLabel = { online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline' }[agent.status];

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} scrollEnabled={!selectedTask}>
        {/* Cover */}
        <View style={{ height: 260, position: 'relative', overflow: 'hidden' }}>
          <LinearGradient
            colors={[gradFrom, gradTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', inset: 0 }}
          />
          {/* Radial dim */}
          <LinearGradient
            colors={['transparent', C.c0]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ position: 'absolute', inset: 0 }}
          />
          {/* Background emblem */}
          <View style={{ position: 'absolute', bottom: -90, right: -40, opacity: 0.15 }}>
            <Svg width={280} height={280} viewBox="0 0 100 100">
              {EMBLEM_LARGE_PATHS[agent.emblem]}
            </Svg>
          </View>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', top: insets.top + 16, left: 16, width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(10,10,15,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="chevL" size={20} color="#fff" />
          </TouchableOpacity>
          {/* Settings button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('EditAgent', { agentId: agent.id })}
            style={{ position: 'absolute', top: insets.top + 16, right: 16, width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(10,10,15,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="settings" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={{ paddingHorizontal: 24, marginTop: -64 }}>
          <AgentAvatar agent={agent} size={104} statusVariant="pulse" />
        </View>

        {/* Name + bio */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 32, color: C.text, letterSpacing: -1, lineHeight: 32 }}>
              {agent.name}
            </Text>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {statusLabel}
            </Text>
          </View>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 15, color: agentTint, letterSpacing: -0.2, marginTop: 4 }}>
            {agent.role}
          </Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14.5, color: C.textDim, letterSpacing: -0.2, lineHeight: 21.75, marginTop: 14 }}>
            {agent.bio}
          </Text>
        </View>

        {/* Stats — live from messages & tasks */}
        <View style={{ marginHorizontal: 20, marginTop: 20, padding: 16, paddingHorizontal: 18, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, flexDirection: 'row' }}>
          <StatBlock value={stats?.convos ?? 0} label="Convos" />
          <View style={{ width: 1, backgroundColor: C.border, marginHorizontal: 2 }} />
          <StatBlock
            value={stats?.accuracy != null ? `${stats.accuracy}%` : '—'}
            label="Success"
          />
          <View style={{ width: 1, backgroundColor: C.border, marginHorizontal: 2 }} />
          <StatBlock
            value={stats?.hoursThisWeek != null && stats.hoursThisWeek > 0 ? `${stats.hoursThisWeek}h` : '<1h'}
            label="This week"
          />
        </View>

        {/* Tasks — open + recent done */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4, marginBottom: 10 }}>
            Tasks · {agentOpenTasks.length} open
          </Text>
          {agentOpenTasks.length === 0 ? (
            <View style={{ backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, lineHeight: 20 }}>
                No open tasks. Tap Assign task below to give {agent.name} work.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8, marginBottom: 12 }}>
              {agentOpenTasks.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} onPress={setSelectedTask} />
              ))}
            </View>
          )}
          {agentDoneTasks.length > 0 && (
            <>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                Recently done
              </Text>
              <View style={{ gap: 8, marginBottom: 8 }}>
                {agentDoneTasks.map(task => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} onPress={setSelectedTask} />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Memory vault */}
        <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 8, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4 }}>Memory vault</Text>
          <TouchableOpacity onPress={() => setShowAddMemory(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="plus" size={12} color={C.a} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.a }}>Add fact</Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 4 }}>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 19, marginBottom: 12 }}>
            Facts {agent.name} keeps across chats and tasks — preferences, context, how you work. You own this data.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Icon name="brain" size={12} color={C.textDim} />
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {memories.length} ITEMS
            </Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          {memories.length === 0 ? (
            <View style={{ padding: 20, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14 }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 19 }}>
                No facts yet. Tap Add fact — e.g. your timezone, tone preferences, or standing instructions for {agent.name}.
              </Text>
            </View>
          ) : (
            memories.map((mem, i) => (
              <View key={mem.id} style={{ backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, paddingHorizontal: 16, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: agentTint }} />
                <Text style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
                  {mem.category.toUpperCase()} · {String(i + 1).padStart(2, '0')}
                </Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.text, letterSpacing: -0.2, lineHeight: 20 }}>
                  {mem.text}
                </Text>
              </View>
            ))
          )}
        </View>


        {/* Origin */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4, marginBottom: 10 }}>Origin</Text>
          <TouchableOpacity
            onPress={() => {
              if (agent.origin === 'Telegram' || agent.origin === 'Discord') {
                navigation.navigate('EditPlatformConnection', { agentId: agent.id });
              }
            }}
            activeOpacity={agent.origin === 'Telegram' || agent.origin === 'Discord' ? 0.85 : 1}
            style={{ backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: platform?.color || C.c3, alignItems: 'center', justifyContent: 'center' }}>
              <PlatformLogo id={agent.origin.toLowerCase()} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text, letterSpacing: -0.2 }}>
                {agent.origin === 'AgentHQ' ? 'Hosted on AgentHQ' : `From ${agent.origin}`}
              </Text>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.textDim, letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' }}>
                {agent.importedAt.toUpperCase()} · {agent.origin === 'AgentHQ' ? 'CREATED' : 'IMPORTED'}
              </Text>
            </View>
            {(agent.origin === 'Telegram' || agent.origin === 'Discord') && (
              <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.a }}>Manage</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: insets.bottom + 20, flexDirection: 'row', gap: 10, backgroundColor: C.c0, borderTopWidth: 1, borderTopColor: C.border }}>
        <PrimaryButton
          onPress={() => navigation.navigate('Chat', { agentId: agent.id })}
          icon="msg"
          style={{ flex: 2 }}
        >
          Chat
        </PrimaryButton>
        <SecondaryButton style={{ flex: 1 }} onPress={() => setShowAddTask(true)}>Assign task</SecondaryButton>
      </View>

      <AddTaskSheet visible={showAddTask} onClose={() => setShowAddTask(false)} defaultAgentId={agent.id} />
      <AddMemorySheet
        visible={showAddMemory}
        agentName={agent.name}
        onClose={() => setShowAddMemory(false)}
        onSave={handleAddMemory}
      />
      <TaskDetailSheet
        task={selectedTask}
        visible={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpgrade={() => {
          setSelectedTask(null);
          navigation.navigate('Upgrade');
        }}
      />
    </View>
  );
}
