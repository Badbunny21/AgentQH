import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAgents } from '../contexts/AgentsContext';
import { useWorkspaces } from '../contexts/WorkspacesContext';
import { Workspace } from '../lib/workspacesApi';
import AgentAvatar from '../components/AgentAvatar';
import CreateWorkspaceSheet from '../components/CreateWorkspaceSheet';
import ManageWorkspaceSheet from '../components/ManageWorkspaceSheet';
import { GhostChip } from '../components/Buttons';
import { C, FONTS } from '../constants/theme';
import Icon from '../components/Icon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Workspaces'>;
};

function WorkspaceCard({
  workspace,
  agentCount,
  isActive,
  onSelect,
  onManage,
  onAgentPress,
}: {
  workspace: Workspace;
  agentCount: number;
  isActive: boolean;
  onSelect: () => void;
  onManage: () => void;
  onAgentPress: (agentId: string) => void;
}) {
  const { getWorkspaceAgents } = useWorkspaces();
  const agents = getWorkspaceAgents(workspace.id);

  return (
    <View style={{ marginBottom: 16, backgroundColor: C.c1, borderWidth: 1, borderColor: isActive ? 'rgba(163,230,53,0.4)' : C.border, borderRadius: 16, overflow: 'hidden' }}>
      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: agents.length ? 1 : 0, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={onSelect} activeOpacity={0.85} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isActive ? 'rgba(163,230,53,0.12)' : C.c2, borderWidth: 1, borderColor: isActive ? 'rgba(163,230,53,0.35)' : C.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="folder" size={16} color={isActive ? C.a : C.textDim} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 16, color: C.text }}>{workspace.name}</Text>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: isActive ? C.a : C.textDim, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>
              {isActive ? 'Active filter · ' : ''}{agentCount} agent{agentCount === 1 ? '' : 's'}
            </Text>
            {workspace.description ? (
              <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 4 }} numberOfLines={2}>{workspace.description}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onManage}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border }}
        >
          <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textDim }}>Manage</Text>
        </TouchableOpacity>
      </View>
      {agents.length > 0 && (
        <View style={{ padding: 12, gap: 8 }}>
          {agents.map(agent => (
            <TouchableOpacity
              key={agent.id}
              onPress={() => onAgentPress(agent.id)}
              activeOpacity={0.85}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, backgroundColor: C.c2, borderRadius: 12, borderWidth: 1, borderColor: C.border }}
            >
              <AgentAvatar agent={agent} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text }}>{agent.name}</Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 1 }}>{agent.role}</Text>
              </View>
              <Icon name="chevR" size={14} color={C.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function WorkspacesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { agents } = useAgents();
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    createWorkspace,
    renameWorkspace,
    removeWorkspace,
    assignAgent,
    unassignAgent,
    getUnassignedAgents,
    agentIdsByWorkspace,
    agentWorkspaceMap,
  } = useWorkspaces();

  const [showCreate, setShowCreate] = useState(false);
  const [manageTarget, setManageTarget] = useState<Workspace | null>(null);
  const unassigned = getUnassignedAgents();

  const handleSelectWorkspace = async (workspaceId: string) => {
    if (activeWorkspaceId === workspaceId) {
      await setActiveWorkspace(null);
    } else {
      await setActiveWorkspace(workspaceId);
    }
  };

  const handleCreate = async (name: string, description: string) => {
    const result = await createWorkspace(name, description);
    return { error: result.error };
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" size={18} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text }}>Workspaces</Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 2 }}>Group agents by project or client</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={18} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {activeWorkspaceId && (
          <TouchableOpacity
            onPress={() => setActiveWorkspace(null)}
            style={{ marginBottom: 16, padding: 14, backgroundColor: 'rgba(163,230,53,0.08)', borderWidth: 1, borderColor: 'rgba(163,230,53,0.35)', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.a, letterSpacing: 1, textTransform: 'uppercase' }}>Filtering home, inbox, tasks & notifications</Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text, marginTop: 4 }}>
                {workspaces.find(w => w.id === activeWorkspaceId)?.name}
              </Text>
            </View>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.a }}>Clear</Text>
          </TouchableOpacity>
        )}

        {workspaces.length === 0 ? (
          <View style={{ padding: 28, alignItems: 'center' }}>
            <Icon name="folder" size={32} color={C.textMuted} />
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 17, color: C.text, marginTop: 16, marginBottom: 8 }}>No workspaces yet</Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
              Create a workspace for each project or client, then assign agents to keep Home, Inbox, and Tasks focused.
            </Text>
            <GhostChip icon="plus" onPress={() => setShowCreate(true)}>Create workspace</GhostChip>
          </View>
        ) : (
          workspaces.map(workspace => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              agentCount={(agentIdsByWorkspace[workspace.id] ?? []).length}
              isActive={activeWorkspaceId === workspace.id}
              onSelect={() => handleSelectWorkspace(workspace.id)}
              onManage={() => setManageTarget(workspace)}
              onAgentPress={agentId => navigation.navigate('AgentProfile', { agentId })}
            />
          ))
        )}

        {unassigned.length > 0 && (
          <View style={{ marginTop: 8, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 16, color: C.text }}>Unassigned</Text>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>
                {unassigned.length} agent{unassigned.length === 1 ? '' : 's'} · not in a workspace
              </Text>
            </View>
            <View style={{ padding: 12, gap: 8 }}>
              {unassigned.map(agent => (
                <TouchableOpacity
                  key={agent.id}
                  onPress={() => navigation.navigate('AgentProfile', { agentId: agent.id })}
                  activeOpacity={0.85}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, backgroundColor: C.c2, borderRadius: 12, borderWidth: 1, borderColor: C.border }}
                >
                  <AgentAvatar agent={agent} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text }}>{agent.name}</Text>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 1 }}>{agent.role}</Text>
                  </View>
                  <Icon name="chevR" size={14} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {agents.length === 0 && (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <GhostChip icon="plus" onPress={() => navigation.navigate('AddAgent')}>Add agent</GhostChip>
          </View>
        )}
      </ScrollView>

      <CreateWorkspaceSheet visible={showCreate} onClose={() => setShowCreate(false)} onSave={handleCreate} />
      <ManageWorkspaceSheet
        visible={!!manageTarget}
        workspace={manageTarget}
        agents={agents}
        assignedIds={manageTarget ? (agentIdsByWorkspace[manageTarget.id] ?? []) : []}
        agentWorkspaceMap={agentWorkspaceMap}
        onClose={() => setManageTarget(null)}
        onRename={name => renameWorkspace(manageTarget!.id, name)}
        onDelete={() => removeWorkspace(manageTarget!.id)}
        onAssign={agentId => assignAgent(manageTarget!.id, agentId)}
        onUnassign={unassignAgent}
      />
    </View>
  );
}
