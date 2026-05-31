export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  time: string;
  createdAt: string;
}

export interface MessageRow {
  id: string;
  user_id: string;
  agent_id: string;
  role: 'user' | 'agent';
  text: string;
  created_at: string;
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function rowToChatMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    text: row.text,
    time: formatMessageTime(row.created_at),
    createdAt: row.created_at,
  };
}
