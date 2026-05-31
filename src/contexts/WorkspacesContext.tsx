import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useAgents } from './AgentsContext';
import { Agent } from '../constants/agents';
import {
  assignAgentToWorkspace,
  createWorkspace,
  deleteWorkspace,
  fetchAgentWorkspaceMap,
  fetchWorkspaceAgentMap,
  fetchWorkspaces,
  removeAgentFromWorkspace,
  updateWorkspace,
  Workspace,
} from '../lib/workspacesApi';

const ACTIVE_WORKSPACE_KEY = 'agenthq_active_workspace_id';

interface WorkspacesContextType {
  workspaces: Workspace[];
  agentIdsByWorkspace: Record<string, string[]>;
  agentWorkspaceMap: Record<string, string>;
  activeWorkspaceId: string | null;
  isLoading: boolean;
  refreshWorkspaces: () => Promise<void>;
  setActiveWorkspace: (workspaceId: string | null) => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<{ workspace: Workspace | null; error: string | null }>;
  renameWorkspace: (workspaceId: string, name: string) => Promise<{ error: string | null }>;
  removeWorkspace: (workspaceId: string) => Promise<{ error: string | null }>;
  assignAgent: (workspaceId: string, agentId: string) => Promise<{ error: string | null }>;
  unassignAgent: (agentId: string) => Promise<{ error: string | null }>;
  getWorkspaceAgents: (workspaceId: string) => Agent[];
  getUnassignedAgents: () => Agent[];
  filterAgents: (list: Agent[]) => Agent[];
  filterAgentIds: (agentIds: Array<string | null | undefined>) => boolean;
}

const WorkspacesContext = createContext<WorkspacesContextType | null>(null);

export function WorkspacesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { agents } = useAgents();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [agentIdsByWorkspace, setAgentIdsByWorkspace] = useState<Record<string, string[]>>({});
  const [agentWorkspaceMap, setAgentWorkspaceMap] = useState<Record<string, string>>({});
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_WORKSPACE_KEY).then(value => {
      setActiveWorkspaceIdState(value || null);
    });
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    if (!session?.user.id) {
      setWorkspaces([]);
      setAgentIdsByWorkspace({});
      setAgentWorkspaceMap({});
      return;
    }

    setIsLoading(true);
    const [list, byWorkspace, byAgent] = await Promise.all([
      fetchWorkspaces(session.user.id),
      fetchWorkspaceAgentMap(session.user.id),
      fetchAgentWorkspaceMap(session.user.id),
    ]);
    setWorkspaces(list);
    setAgentIdsByWorkspace(byWorkspace);
    setAgentWorkspaceMap(byAgent);
    setIsLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    if (!workspaces.some(w => w.id === activeWorkspaceId)) {
      setActiveWorkspaceIdState(null);
      AsyncStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    }
  }, [activeWorkspaceId, workspaces]);

  const setActiveWorkspace = async (workspaceId: string | null) => {
    setActiveWorkspaceIdState(workspaceId);
    if (workspaceId) {
      await AsyncStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
    } else {
      await AsyncStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    }
  };

  const handleCreateWorkspace = async (name: string, description = '') => {
    if (!session?.user.id) return { workspace: null, error: 'Not signed in' };
    const result = await createWorkspace(session.user.id, name, description);
    if (result.workspace) {
      await refreshWorkspaces();
      await setActiveWorkspace(result.workspace.id);
    }
    return result;
  };

  const renameWorkspace = async (workspaceId: string, name: string) => {
    const result = await updateWorkspace(workspaceId, { name });
    if (!result.error) await refreshWorkspaces();
    return result;
  };

  const removeWorkspace = async (workspaceId: string) => {
    const result = await deleteWorkspace(workspaceId);
    if (!result.error) {
      if (activeWorkspaceId === workspaceId) {
        await setActiveWorkspace(null);
      }
      await refreshWorkspaces();
    }
    return result;
  };

  const assignAgent = async (workspaceId: string, agentId: string) => {
    if (!session?.user.id) return { error: 'Not signed in' };
    const result = await assignAgentToWorkspace(session.user.id, workspaceId, agentId);
    if (!result.error) await refreshWorkspaces();
    return result;
  };

  const unassignAgent = async (agentId: string) => {
    if (!session?.user.id) return { error: 'Not signed in' };
    const result = await removeAgentFromWorkspace(session.user.id, agentId);
    if (!result.error) await refreshWorkspaces();
    return result;
  };

  const getWorkspaceAgents = useCallback(
    (workspaceId: string) => {
      const ids = new Set(agentIdsByWorkspace[workspaceId] ?? []);
      return agents.filter(a => ids.has(a.id));
    },
    [agentIdsByWorkspace, agents]
  );

  const getUnassignedAgents = useCallback(
    () => agents.filter(a => !agentWorkspaceMap[a.id]),
    [agents, agentWorkspaceMap]
  );

  const activeAgentIds = useMemo(() => {
    if (!activeWorkspaceId) return null;
    return new Set(agentIdsByWorkspace[activeWorkspaceId] ?? []);
  }, [activeWorkspaceId, agentIdsByWorkspace]);

  const filterAgents = useCallback(
    (list: Agent[]) => {
      if (!activeAgentIds) return list;
      return list.filter(a => activeAgentIds.has(a.id));
    },
    [activeAgentIds]
  );

  const filterAgentIds = useCallback(
    (agentIds: Array<string | null | undefined>) => {
      const id = agentIds.find(Boolean);
      if (!activeAgentIds) return true;
      if (!id) return false;
      return activeAgentIds.has(id);
    },
    [activeAgentIds]
  );

  return (
    <WorkspacesContext.Provider
      value={{
        workspaces,
        agentIdsByWorkspace,
        agentWorkspaceMap,
        activeWorkspaceId,
        isLoading,
        refreshWorkspaces,
        setActiveWorkspace,
        createWorkspace: handleCreateWorkspace,
        renameWorkspace,
        removeWorkspace,
        assignAgent,
        unassignAgent,
        getWorkspaceAgents,
        getUnassignedAgents,
        filterAgents,
        filterAgentIds,
      }}
    >
      {children}
    </WorkspacesContext.Provider>
  );
}

export function useWorkspaces() {
  const ctx = useContext(WorkspacesContext);
  if (!ctx) throw new Error('useWorkspaces must be used within WorkspacesProvider');
  return ctx;
}
