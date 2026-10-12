import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchTelegramConnectionStatus, fetchDiscordConnectionStatus } from '../lib/platformConnectionsApi';
import { AgentConnection, connectionFromStatus } from '../lib/agentConnection';

// The stored origin string is not evidence of an active channel connection.
export default function useAgentConnection(agentId?: string): AgentConnection {
  const [connection, setConnection] = useState<AgentConnection>('checking');
  useFocusEffect(useCallback(() => {
    let active = true;
    setConnection('checking');
    if (!agentId) { setConnection('none'); return; }
    Promise.all([fetchTelegramConnectionStatus(agentId), fetchDiscordConnectionStatus(agentId)])
      .then(([telegram, discord]) => { if (active) setConnection(connectionFromStatus(telegram?.connected === true, discord?.connected === true)); })
      .catch(() => { if (active) setConnection('none'); });
    return () => { active = false; };
  }, [agentId]));
  return connection;
}
