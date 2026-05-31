import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Agent } from '../constants/agents';
import { createAgent, deleteAgent, fetchAgents } from '../lib/agentsApi';
import { removeAgentAvatar, uploadAgentAvatar, updateAgent, UpdateAgentInput, isLocalImageUri } from '../lib/agentAvatarsApi';
import { CreateAgentInput } from '../lib/agentUtils';

export interface UpdateAgentDetailsInput extends Omit<UpdateAgentInput, 'avatarUrl'> {
  localAvatarUri?: string | null;
  removeAvatar?: boolean;
}

interface AgentsContextType {
  agents: Agent[];
  isLoading: boolean;
  addAgent: (input: CreateAgentInput) => Promise<{ agent: Agent | null; error: string | null }>;
  removeAgent: (agentId: string) => Promise<{ error: string | null }>;
  updateAgentDetails: (agentId: string, input: UpdateAgentDetailsInput) => Promise<{ agent: Agent | null; error: string | null }>;
  refreshAgents: () => Promise<void>;
  getAgent: (agentId: string) => Agent | undefined;
}

const AgentsContext = createContext<AgentsContextType | null>(null);

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAgents = useCallback(async () => {
    if (!session?.user.id) {
      setAgents([]);
      return;
    }
    setIsLoading(true);
    const list = await fetchAgents(session.user.id);
    setAgents(list);
    setIsLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    refreshAgents();
  }, [refreshAgents]);

  const addAgent = async (input: CreateAgentInput) => {
    if (!session?.user.id) return { agent: null, error: 'Not signed in' };
    const result = await createAgent(session.user.id, input);
    if (result.agent) {
      setAgents(prev => [...prev, result.agent!]);
    }
    return result;
  };

  const removeAgent = async (agentId: string) => {
    const result = await deleteAgent(agentId);
    if (!result.error) {
      setAgents(prev => prev.filter(a => a.id !== agentId));
    }
    return result;
  };

  const updateAgentDetails = async (agentId: string, input: UpdateAgentDetailsInput) => {
    if (!session?.user.id) return { agent: null, error: 'Not signed in' };

    let avatarUrl: string | null | undefined = undefined;

    if (input.removeAvatar) {
      await removeAgentAvatar(session.user.id, agentId);
      avatarUrl = null;
    } else if (input.localAvatarUri && isLocalImageUri(input.localAvatarUri)) {
      const upload = await uploadAgentAvatar(session.user.id, agentId, input.localAvatarUri);
      if (upload.error) return { agent: null, error: upload.error };
      avatarUrl = upload.publicUrl;
    }

    const result = await updateAgent(agentId, {
      name: input.name,
      role: input.role,
      bio: input.bio,
      avatarUrl,
    });

    if (result.agent) {
      setAgents(prev => prev.map(a => (a.id === agentId ? result.agent! : a)));
      await refreshAgents();
    }
    return result;
  };

  const getAgent = (agentId: string) => agents.find(a => a.id === agentId);

  return (
    <AgentsContext.Provider value={{ agents, isLoading, addAgent, removeAgent, updateAgentDetails, refreshAgents, getAgent }}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  const ctx = useContext(AgentsContext);
  if (!ctx) throw new Error('useAgents must be used within AgentsProvider');
  return ctx;
}
