import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Modal, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONTS } from '../constants/theme';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { Agent } from '../constants/agents';
import { Workspace } from '../lib/workspacesApi';
import AgentAvatar from './AgentAvatar';
import Icon from './Icon';

interface ManageWorkspaceSheetProps {
  visible: boolean;
  workspace: Workspace | null;
  agents: Agent[];
  assignedIds: string[];
  agentWorkspaceMap: Record<string, string>;
  onClose: () => void;
  onRename: (name: string) => Promise<{ error: string | null }>;
  onDelete: () => Promise<{ error: string | null }>;
  onAssign: (agentId: string) => Promise<{ error: string | null }>;
  onUnassign: (agentId: string) => Promise<{ error: string | null }>;
}

export default function ManageWorkspaceSheet({
  visible,
  workspace,
  agents,
  assignedIds,
  agentWorkspaceMap,
  onClose,
  onRename,
  onDelete,
  onAssign,
  onUnassign,
}: ManageWorkspaceSheetProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (workspace) setName(workspace.name);
  }, [workspace]);

  if (!workspace) return null;

  const assignedSet = new Set(assignedIds);

  const handleRename = async () => {
    if (name.trim() === workspace.name) return;
    setSaving(true);
    const result = await onRename(name);
    setSaving(false);
    if (result.error) Alert.alert('Could not rename', result.error);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete workspace?',
      `"${workspace.name}" will be removed. Agents stay on your roster — they just won't belong to this workspace anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await onDelete();
            if (result.error) Alert.alert('Could not delete', result.error);
            else onClose();
          },
        },
      ]
    );
  };

  const toggleAgent = async (agent: Agent) => {
    setTogglingId(agent.id);
    const inThis = assignedSet.has(agent.id);
    const result = inThis ? await onUnassign(agent.id) : await onAssign(agent.id);
    setTogglingId(null);
    if (result.error) Alert.alert('Could not update', result.error);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <View style={{ backgroundColor: C.c0, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', borderWidth: 1, borderColor: C.border }}>
          <View style={{ paddingTop: 20, paddingHorizontal: 24, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 20, color: C.text, letterSpacing: -0.4 }}>Manage workspace</Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, marginTop: 4 }}>Rename or assign agents</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={16} color={C.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={{
                backgroundColor: C.c2,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 14,
                padding: 16,
                color: C.text,
                fontFamily: FONTS.regular,
                fontSize: 16,
                marginBottom: 12,
              }}
            />
            {name.trim() !== workspace.name && name.trim() ? (
              <PrimaryButton onPress={handleRename} disabled={saving} style={{ marginBottom: 24 }}>
                {saving ? 'Saving…' : 'Save name'}
              </PrimaryButton>
            ) : (
              <View style={{ marginBottom: 24 }} />
            )}

            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
              Agents · {assignedIds.length} assigned
            </Text>
            <View style={{ gap: 8, marginBottom: 28 }}>
              {agents.length === 0 ? (
                <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim }}>No agents on your roster yet.</Text>
              ) : (
                agents.map(agent => {
                  const inThis = assignedSet.has(agent.id);
                  const otherWorkspaceId = !inThis ? agentWorkspaceMap[agent.id] : undefined;
                  const busy = togglingId === agent.id;

                  return (
                    <TouchableOpacity
                      key={agent.id}
                      onPress={() => toggleAgent(agent)}
                      disabled={busy}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        backgroundColor: inThis ? 'rgba(163,230,53,0.08)' : C.c2,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: inThis ? 'rgba(163,230,53,0.35)' : C.border,
                        opacity: busy ? 0.6 : 1,
                      }}
                    >
                      <AgentAvatar agent={agent} size={36} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text }}>{agent.name}</Text>
                        <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 1 }}>
                          {inThis ? 'In this workspace' : otherWorkspaceId ? 'Tap to move here' : 'Tap to assign'}
                        </Text>
                      </View>
                      <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: inThis ? C.a : C.border, backgroundColor: inThis ? C.a : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {inThis ? <Icon name="check" size={14} color="#0a0a0a" strokeWidth={2.5} /> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <SecondaryButton onPress={handleDelete}>
              Delete workspace
            </SecondaryButton>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
