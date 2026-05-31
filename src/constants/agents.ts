export type AgentStatus = 'online' | 'away' | 'busy' | 'offline';
export type EmblemKey =
  | 'triStack'
  | 'hexMesh'
  | 'spark'
  | 'grid'
  | 'rings'
  | 'crescent'
  | 'diamond'
  | 'arrow'
  | 'wave'
  | 'quote'
  | 'shield';
export type GradKey = 'aa' | 'bb' | 'cc' | 'ab' | 'bc' | 'ca';

export interface Agent {
  id: string;
  name: string;
  role: string;
  emblem: EmblemKey;
  gradKey: GradKey;
  status: AgentStatus;
  activity: string;
  origin: string;
  importedAt: string;
  bio: string;
  avatarUrl: string | null;
  stats: {
    convos: number;
    accuracy: number;
    hours: number;
  };
  memory: string[];
}

