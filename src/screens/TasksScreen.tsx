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
import { PrimaryButton } from '../components/Buttons';
import Icon from '../components/Icon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

function StatBlock({ value, label, icon, tint }: { value: string | number; label: string; icon: string; tint: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.c1, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 16, padding: 12 }}>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: `${tint}1f`, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon name={icon} size={13} color={tint} />
      </View>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: 26, color: C.text, letterSpacing: -0.7, lineHeight: 29 }}>
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
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="plus" size={18} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* Status pill */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(163,230,53,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(163,230,53,0.35)',
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.a }} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.a }}>
              {openTasks.length === 0 ? 'Board clear' : `${openTasks.length} open`}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', gap: 8 }}>
          <StatBlock value={visibleTasks.length} label="Total" icon="sigma" tint={C.c} />
          <StatBlock value={doneTasks.length} label="Done" icon="check" tint={C.a} />
          <StatBlock value={openTasks.length} label="Open" icon="target" tint={C.b} />
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
          {(['all', 'open', 'done'] as const).map(value => (
            <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)}
              style={{ borderRadius: 999, borderWidth: 1, borderColor: filter === value ? C.a : C.borderStrong, backgroundColor: filter === value ? C.a : 'transparent', paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text style={{ fontFamily: filter === value ? FONTS.semibold : FONTS.regular, fontSize: 13, color: filter === value ? C.c0 : C.textDim }}>{value === 'all' ? 'All' : value === 'open' ? 'Open' : 'Done'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showOpen && (
          <>
            <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Open · {openTasks.length}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 8 }}>
              {openTasks.map(task => (
                <TaskRow board key={task.id} task={task} onToggle={toggleTask} onPress={setSelectedTask} />
              ))}
              {openTasks.length === 0 && (
                <View style={{ padding: 20, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(163,230,53,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="target" size={17} color={C.a} />
                    </View>
                    <Text style={{ flex: 1, fontFamily: FONTS.medium, fontSize: 15, color: C.text, letterSpacing: -0.2 }}>
                      {visibleTasks.length === 0 ? 'Assign the first task. It lands here.' : 'No open tasks.'}
                    </Text>
                  </View>
                  <PrimaryButton onPress={() => setShowAdd(true)} icon="plus" style={{ alignSelf: 'stretch' }}>New task</PrimaryButton>
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
                <TaskRow board key={task.id} task={task} onToggle={toggleTask} onPress={setSelectedTask} />
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
      />
    </View>
  );
}
