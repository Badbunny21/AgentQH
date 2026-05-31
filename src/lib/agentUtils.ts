import { Agent, AgentStatus, EmblemKey, GradKey } from '../constants/agents';

export interface AgentRow {
  id: string;
  user_id: string;
  name: string;
  role: string;
  emblem: string;
  grad_key: string;
  status: string;
  activity: string;
  origin: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentInput {
  name: string;
  role: string;
  origin: string;
  bio?: string;
}

const EMBLEMS: EmblemKey[] = [
  'triStack', 'hexMesh', 'spark', 'grid', 'rings', 'crescent',
  'diamond', 'arrow', 'wave', 'quote', 'shield',
];

const GRADS: GradKey[] = ['aa', 'bb', 'cc', 'ab', 'bc', 'ca'];

function hashString(value: string): number {
  return value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function pickAgentStyle(name: string): { emblem: EmblemKey; gradKey: GradKey } {
  const hash = hashString(name.trim().toLowerCase() || 'agent');
  return {
    emblem: EMBLEMS[hash % EMBLEMS.length],
    gradKey: GRADS[hash % GRADS.length],
  };
}

function formatImportedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function rowToAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    emblem: row.emblem as EmblemKey,
    gradKey: row.grad_key as GradKey,
    status: row.status as AgentStatus,
    activity: row.activity || 'Ready when you are',
    origin: row.origin,
    importedAt: formatImportedAt(row.created_at),
    bio: row.bio,
    avatarUrl: row.avatar_url ?? null,
    stats: { convos: 0, accuracy: 0, hours: 0 },
    memory: [],
  };
}
