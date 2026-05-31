import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS } from '../constants/theme';
import { useTasks, Task } from '../contexts/TasksContext';
import { useWorkspaces } from '../contexts/WorkspacesContext';
import TaskRow from '../components/TaskRow';
import AddTaskSheet from '../components/AddTaskSheet';
import TaskDetailSheet from '../components/TaskDetailSheet';
import { GhostChip, PrimaryButton } from '../components/Buttons';
import Icon from '../components/Icon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: 30, color: C.text, letterSpacing: -1.2, lineHeight: 30 }}>
        {value}
      </Text>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 6 }}>
        {label}
      </Text>
    </View>
  );
}

export default function TasksScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { tasks, toggleTask } = useTasks();
  const { workspaces, activeWorkspaceId, setActiveWorkspace, filterAgentIds } = useWorkspaces();
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const visibleTasks = useMemo(
    () => tasks.filter(t => filterAgentIds([t.agentId])),
    [tasks, filterAgentIds]
  );
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const doneTasks = visibleTasks.filter(t => t.done);
  const openTasks = visibleTasks.filter(t => !t.done);

  const showOpen = filter === 'all' || filter === 'open';
  const showDone = filter === 'all' || filter === 'done';

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} scrollEnabled={!selectedTask}>
        <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
              The board
            </Text>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 32, color: C.text, letterSpacing: -1, lineHeight: 32 }}>
              Tasks
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="plus" size={18} color={C.text} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 22, flexDirection: 'row', gap: 18 }}>
          <StatBlock value={visibleTasks.length} label="Total" />
          <View style={{ width: 1, backgroundColor: C.border }} />
          <StatBlock value={doneTasks.length} label="Done" />
          <View style={{ width: 1, backgroundColor: C.border }} />
          <StatBlock value={openTasks.length} label="Open" />
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 18, gap: 8 }}>
          <GhostChip active={filter === 'all'} onPress={() => setFilter('all')}>All</GhostChip>
          <GhostChip active={filter === 'open'} onPress={() => setFilter('open')}>In flight</GhostChip>
          <GhostChip active={filter === 'done'} onPress={() => setFilter('done')}>Done</GhostChip>
        </ScrollView>

        {showOpen && (
          <>
            <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                In flight · {openTasks.length}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 8 }}>
              {openTasks.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} onPress={setSelectedTask} />
              ))}
              {openTasks.length === 0 && (
                <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, textAlign: 'center' }}>
                    Nothing in flight. Assign a task to an agent to get started.
                  </Text>
                  <PrimaryButton onPress={() => setShowAdd(true)} icon="plus">New task</PrimaryButton>
                </View>
              )}
            </View>
          </>
        )}

        {showDone && (
          <>
            <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Done · {doneTasks.length}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 8 }}>
              {doneTasks.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} onPress={setSelectedTask} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <AddTaskSheet visible={showAdd} onClose={() => setShowAdd(false)} />
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
