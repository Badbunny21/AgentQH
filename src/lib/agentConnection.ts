export type AgentConnection = 'checking' | 'telegram' | 'discord' | 'both' | 'none';

export function connectionLabel(connection: AgentConnection): string {
  if (connection === 'checking') return 'Checking connection';
  if (connection === 'telegram') return 'Connected to Telegram';
  if (connection === 'discord') return 'Connected to Discord';
  if (connection === 'both') return 'Connected to Telegram and Discord';
  return 'Not connected';
}

export function connectionFromStatus(telegram: boolean, discord: boolean): AgentConnection {
  return telegram && discord ? 'both' : telegram ? 'telegram' : discord ? 'discord' : 'none';
}
