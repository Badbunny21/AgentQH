import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONTS } from '../constants/theme';
import { Task, useTasks } from '../contexts/TasksContext';
import { useAgents } from '../contexts/AgentsContext';
import { PrimaryButton, SecondaryButton } from './Buttons';
import AgentAvatar from './AgentAvatar';
import Icon from './Icon';

interface TaskDetailSheetProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

function statusLabel(status: string, done: boolean): string {
  if (done) return 'Done';
  if (status === 'doing') return 'Running…';
  if (status === 'review') return 'Ready for review';
  return 'Open';
}

export default function TaskDetailSheet({ task, visible, onClose, onUpgrade }: TaskDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const { agents } = useAgents();
  const { tasks, runTask, toggleTask } = useTasks();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveTask = task ? tasks.find(t => t.id === task.id) ?? task : null;

  if (!visible || !liveTask) return null;

  const agent = liveTask.agentId ? agents.find(a => a.id === liveTask.agentId) : undefined;
  const canRun = !!liveTask.agentId && !liveTask.done && liveTask.status !== 'doing';

  const handleRun = async () => {
    setError(null);
    setRunning(true);
    const result = await runTask(liveTask.id);
    setRunning(false);
    if (result.error) {
      setError(result.error);
      if (result.limitReached && onUpgrade) onUpgrade();
    }
  };

  const handleMarkDone = async () => {
    if (!liveTask.done) await toggleTask(liveTask.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={{
            backgroundColor: C.c0,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 24,
            borderWidth: 1,
            borderColor: C.border,
            maxHeight: '88%',
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.borderStrong }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.a, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                {statusLabel(liveTask.status, liveTask.done)}
              </Text>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 20, color: C.text, letterSpacing: -0.4, lineHeight: 26 }}>
                {liveTask.title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={16} color={C.text} />
            </TouchableOpacity>
          </View>

          {agent && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, padding: 12, backgroundColor: C.c1, borderRadius: 12, borderWidth: 1, borderColor: C.border }}>
              <AgentAvatar agent={agent} size={32} showStatus={false} />
              <View>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text }}>{agent.name}</Text>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 }}>
                  {agent.origin === 'AgentHQ' ? 'Executes in app' : `Also syncs to ${agent.origin}`}
                </Text>
              </View>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator
            bounces
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {liveTask.result ? (
              <>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Result</Text>
                <View style={{ padding: 16, backgroundColor: C.c1, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.text, lineHeight: 21 }} selectable>
                    {liveTask.result}
                  </Text>
                </View>
              </>
            ) : liveTask.executionError ? (
              <View style={{ padding: 14, backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', marginBottom: 16 }}>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: '#f87171' }}>{liveTask.executionError}</Text>
              </View>
            ) : (
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, lineHeight: 20, marginBottom: 16 }}>
                {canRun
                  ? 'Tap Run to have your agent execute this task with hosted AI. Results appear here and on Home activity.'
                  : 'No result yet.'}
              </Text>
            )}

            {error && (
              <View style={{ padding: 12, backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', marginBottom: 12 }}>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: '#f87171' }}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {canRun && (
              <PrimaryButton onPress={handleRun} disabled={running} style={{ flex: 1 }}>
                {running ? 'Running…' : liveTask.result ? 'Run again' : 'Run task'}
              </PrimaryButton>
            )}
            {liveTask.result && !liveTask.done && (
              <SecondaryButton onPress={handleMarkDone} style={{ flex: 1 }}>Mark done</SecondaryButton>
            )}
            {!canRun && !liveTask.result && (
              <SecondaryButton onPress={onClose} style={{ flex: 1 }}>Close</SecondaryButton>
            )}
          </View>

          {running && (
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <ActivityIndicator color={C.a} size="large" />
              <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text, marginTop: 12 }}>Agent working…</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
