import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../contexts/AuthContext';
import { useAgents } from '../contexts/AgentsContext';
import { useTasks, Task } from '../contexts/TasksContext';
import { fetchHandoffs, Handoff } from '../lib/handoffsApi';
import HandoffCard from '../components/HandoffCard';
import CreateHandoffSheet from '../components/CreateHandoffSheet';
import TaskDetailSheet from '../components/TaskDetailSheet';
import { PrimaryButton, GhostChip } from '../components/Buttons';
import { C, FONTS } from '../constants/theme';
import Icon from '../components/Icon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Collaborate'>;
};

export default function CollaborateScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { agents } = useAgents();
  const { tasks, refresh } = useTasks();
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    await refresh();
    const list = await fetchHandoffs(session.user.id);
    setHandoffs(list);
    setLoading(false);
  }, [session?.user.id, refresh]);

  const openHandoff = (handoff: Handoff) => {
    if (!handoff.taskId) return;
    const task = tasks.find(t => t.id === handoff.taskId);
    if (task) setSelectedTask(task);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" size={18} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text }}>Collaborate</Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 2 }}>Agent-to-agent handoffs</Text>
        </View>
        {agents.length >= 2 && (
          <TouchableOpacity onPress={() => setShowCreate(true)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={18} color={C.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.a} />}
      >
        {handoffs.length === 0 ? (
          <View style={{ padding: 28, alignItems: 'center' }}>
            <Icon name="share" size={32} color={C.textMuted} />
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 17, color: C.text, marginTop: 16, marginBottom: 8 }}>No handoffs yet</Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
              Pass work between agents: one briefs another, and the receiver gets a task to pick up.
            </Text>
            {agents.length < 2 ? (
              <PrimaryButton icon="plus" onPress={() => navigation.navigate('AddAgent')}>Add another agent</PrimaryButton>
            ) : (
              <PrimaryButton icon="share" onPress={() => setShowCreate(true)}>Create handoff</PrimaryButton>
            )}
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Baton passed · {handoffs.length}
              </Text>
              <GhostChip icon="plus" onPress={() => setShowCreate(true)}>New handoff</GhostChip>
            </View>
            <View style={{ gap: 8 }}>
              {handoffs.map(handoff => (
                <HandoffCard
                  key={handoff.id}
                  handoff={handoff}
                  task={handoff.taskId ? tasks.find(t => t.id === handoff.taskId) : null}
                  onPress={() => openHandoff(handoff)}
                />
              ))}
            </View>
          </>
        )}

        <View style={{ marginTop: 24, padding: 16, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14 }}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text, marginBottom: 8 }}>How it works</Text>
          {[
            'Pick a From agent (who did the work) and a To agent (who picks it up).',
            'Write the brief — what context they need.',
            'Turn on Run so the receiving agent executes it right away.',
            'Track status on each card — tap when ready to review the result.',
          ].map(step => (
            <View key={step} style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              <Text style={{ color: C.a }}>·</Text>
              <Text style={{ flex: 1, fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 19 }}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <CreateHandoffSheet visible={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
      <TaskDetailSheet
        task={selectedTask}
        visible={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </View>
  );
}
