import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONTS } from '../constants/theme';
import { useAgents } from '../contexts/AgentsContext';
import { useTasks } from '../contexts/TasksContext';
import { PrimaryButton, SecondaryButton } from './Buttons';
import AgentAvatar from './AgentAvatar';

interface AddTaskSheetProps {
  visible: boolean;
  onClose: () => void;
  defaultAgentId?: string | null;
}

export default function AddTaskSheet({ visible, onClose, defaultAgentId = null }: AddTaskSheetProps) {
  const insets = useSafeAreaInsets();
  const { agents } = useAgents();
  const { addTask } = useTasks();
  const [title, setTitle] = useState('');
  const [agentId, setAgentId] = useState<string | null>(defaultAgentId);
  const [dispatch, setDispatch] = useState(!!defaultAgentId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setAgentId(defaultAgentId ?? null);
      setDispatch(!!defaultAgentId);
      setTitle('');
      setError(null);
    }
  }, [visible, defaultAgentId]);

  const reset = () => {
    setTitle('');
    setAgentId(defaultAgentId ?? null);
    setDispatch(!!defaultAgentId);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Describe the task.');
      return;
    }
    setError(null);
    setLoading(true);
    const result = await addTask(title.trim(), agentId, dispatch && !!agentId);
    setLoading(false);
    if (result.error) {
      if (result.limitReached) {
        Alert.alert('Monthly limit reached', result.error, [{ text: 'OK' }]);
      }
      setError(result.error);
      return;
    }
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <View style={{ backgroundColor: C.c0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 24, paddingBottom: insets.bottom + 24, borderWidth: 1, borderColor: C.border, maxHeight: '85%' }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 20, color: C.text, letterSpacing: -0.4, marginBottom: 6 }}>New task</Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, marginBottom: 20, lineHeight: 20 }}>
            Assign work to an agent. With Run / dispatch, hosted AI executes the task and saves the result here.
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Task</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Summarize my inbox and draft replies"
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
                marginBottom: 20,
              }}
            />

            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Assign to</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setAgentId(null)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: agentId === null ? C.c3 : C.c2,
                  borderWidth: 1,
                  borderColor: agentId === null ? C.borderStrong : C.border,
                }}
              >
                <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.text }}>Unassigned</Text>
              </TouchableOpacity>
              {agents.map(agent => (
                <TouchableOpacity
                  key={agent.id}
                  onPress={() => { setAgentId(agent.id); setDispatch(true); }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    backgroundColor: agentId === agent.id ? C.c3 : C.c2,
                    borderWidth: 1,
                    borderColor: agentId === agent.id ? C.borderStrong : C.border,
                  }}
                >
                  <AgentAvatar agent={agent} size={24} showStatus={false} />
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.text }}>{agent.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {agentId && (
              <TouchableOpacity
                onPress={() => setDispatch(v => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, padding: 14, backgroundColor: C.c1, borderRadius: 12, borderWidth: 1, borderColor: C.border }}
              >
                <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: dispatch ? C.a : 'transparent', borderWidth: 1.5, borderColor: dispatch ? C.a : C.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                  {dispatch && <Text style={{ color: '#0a0a0a', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text }}>Run task now</Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 2 }}>AI executes in app · also sends to Telegram if linked</Text>
                </View>
              </TouchableOpacity>
            )}

            {error && (
              <View style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' }}>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: '#f87171' }}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <SecondaryButton onPress={handleClose} style={{ flex: 1 }}>Cancel</SecondaryButton>
            <PrimaryButton onPress={handleSave} disabled={loading} style={{ flex: 2 }}>
              {loading ? 'Running…' : dispatch && agentId ? 'Assign & run' : 'Add task'}
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
