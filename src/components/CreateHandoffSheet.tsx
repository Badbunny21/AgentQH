import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONTS } from '../constants/theme';
import { useAgents } from '../contexts/AgentsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TasksContext';
import { createHandoff } from '../lib/handoffsApi';
import { createMemory } from '../lib/memoriesApi';
import { buildHandoffMemoryText } from '../lib/memoryUtils';
import { logActivity } from '../lib/activitiesApi';
import { sendLocalPushNotification } from '../lib/pushNotifications';
import { PrimaryButton, SecondaryButton } from './Buttons';
import AgentAvatar from './AgentAvatar';

interface CreateHandoffSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

function AgentPicker({
  label,
  selectedId,
  excludeId,
  onSelect,
}: {
  label: string;
  selectedId: string | null;
  excludeId?: string | null;
  onSelect: (id: string) => void;
}) {
  const { agents } = useAgents();
  const options = agents.filter(a => a.id !== excludeId);

  return (
    <>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {options.map(agent => (
          <TouchableOpacity
            key={agent.id}
            onPress={() => onSelect(agent.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 999,
              backgroundColor: selectedId === agent.id ? C.c3 : C.c2,
              borderWidth: 1,
              borderColor: selectedId === agent.id ? C.borderStrong : C.border,
            }}
          >
            <AgentAvatar agent={agent} size={24} showStatus={false} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.text }}>{agent.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

export default function CreateHandoffSheet({ visible, onClose, onCreated }: CreateHandoffSheetProps) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { agents } = useAgents();
  const { addTask, refresh } = useTasks();
  const [fromAgentId, setFromAgentId] = useState<string | null>(null);
  const [toAgentId, setToAgentId] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [context, setContext] = useState('');
  const [runForReceiver, setRunForReceiver] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setFromAgentId(agents[0]?.id ?? null);
    setToAgentId(agents[1]?.id ?? agents[0]?.id ?? null);
    setSummary('');
    setContext('');
    setRunForReceiver(true);
    setError(null);
  }, [visible, agents]);

  const reset = () => {
    setSummary('');
    setContext('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!session?.user.id) return;
    if (!fromAgentId || !toAgentId) {
      setError('Pick both agents.');
      return;
    }
    if (fromAgentId === toAgentId) {
      setError('From and To must be different agents.');
      return;
    }
    if (!summary.trim()) {
      setError('Describe what to brief the receiving agent on.');
      return;
    }

    const fromName = agents.find(a => a.id === fromAgentId)?.name ?? 'Agent';
    const toName = agents.find(a => a.id === toAgentId)?.name ?? 'Agent';
    const taskTitle = `Handoff from ${fromName}: ${summary.trim().slice(0, 100)}`;

    setError(null);
    setLoading(true);

    const taskResult = await addTask(taskTitle, toAgentId, runForReceiver);
    if (taskResult.error && !taskResult.taskId) {
      setLoading(false);
      if (taskResult.limitReached) Alert.alert('Monthly limit reached', taskResult.error);
      else setError(taskResult.error);
      return;
    }

    const handoffResult = await createHandoff(session.user.id, {
      fromAgentId,
      toAgentId,
      summary: summary.trim(),
      context: context.trim() || null,
      taskId: taskResult.taskId ?? null,
    });

    if (handoffResult.error) {
      setLoading(false);
      setError(handoffResult.error);
      return;
    }

    const handoffMemory = buildHandoffMemoryText(fromName, summary.trim(), context.trim() || null);
    const memoryResult = await createMemory(session.user.id, toAgentId, handoffMemory, 'handoff');
    if (memoryResult.error) {
      console.warn('[handoff] memory save:', memoryResult.error);
    } else {
      await logActivity(
        session.user.id,
        'memory_saved',
        `${toName} received handoff context from ${fromName}`,
        { agentId: toAgentId, taskId: taskResult.taskId ?? null }
      );
    }

    await logActivity(
      session.user.id,
      'handoff',
      `${fromName} briefed ${toName} — ${summary.trim()}`,
      { agentId: toAgentId, taskId: taskResult.taskId ?? null }
    );

    void sendLocalPushNotification(
      'Handoff sent',
      `${fromName} briefed ${toName} — ${summary.trim().slice(0, 80)}`
    );

    await refresh();
    setLoading(false);
    onCreated?.();
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <View style={{ backgroundColor: C.c0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 24, paddingBottom: insets.bottom + 24, borderWidth: 1, borderColor: C.border, maxHeight: '90%' }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 20, color: C.text, letterSpacing: -0.4, marginBottom: 6 }}>New handoff</Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, marginBottom: 20, lineHeight: 20 }}>
            One agent briefs another. The receiving agent gets a task, your notes saved to their memory, and can run it immediately.
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <AgentPicker label="From" selectedId={fromAgentId} excludeId={toAgentId} onSelect={setFromAgentId} />
            <AgentPicker label="To" selectedId={toAgentId} excludeId={fromAgentId} onSelect={setToAgentId} />

            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Brief</Text>
            <TextInput
              value={summary}
              onChangeText={setSummary}
              placeholder="Summarize the Q3 infra research — 6 sources, capex is front-loaded"
              placeholderTextColor={C.textMuted}
              multiline
              style={{
                backgroundColor: C.c2,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 14,
                padding: 16,
                color: C.text,
                fontFamily: FONTS.regular,
                fontSize: 16,
                minHeight: 88,
                textAlignVertical: 'top',
                marginBottom: 16,
              }}
            />

            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Context (optional)</Text>
            <TextInput
              value={context}
              onChangeText={setContext}
              placeholder="Board deck"
              placeholderTextColor={C.textMuted}
              style={{
                backgroundColor: C.c2,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 14,
                padding: 16,
                color: C.text,
                fontFamily: FONTS.regular,
                fontSize: 16,
                marginBottom: 16,
              }}
            />

            <TouchableOpacity
              onPress={() => setRunForReceiver(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, padding: 14, backgroundColor: C.c1, borderRadius: 12, borderWidth: 1, borderColor: C.border }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: runForReceiver ? C.a : 'transparent', borderWidth: 1.5, borderColor: runForReceiver ? C.a : C.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                {runForReceiver && <Text style={{ color: '#0a0a0a', fontSize: 12, fontWeight: '700' }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text }}>Run task for receiving agent</Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 2 }}>AI picks up the handoff and saves the result on Tasks</Text>
              </View>
            </TouchableOpacity>

            {error && (
              <View style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' }}>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: '#f87171' }}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <SecondaryButton onPress={handleClose} style={{ flex: 1 }}>Cancel</SecondaryButton>
            <PrimaryButton onPress={handleSave} disabled={loading || agents.length < 2} style={{ flex: 2 }}>
              {loading ? 'Passing baton…' : runForReceiver ? 'Hand off & run' : 'Hand off'}
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
