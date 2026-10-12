export interface MemoryCategory {
  id: string;
  label: string;
  icon: string;
}

export const MEMORY_CATEGORIES: MemoryCategory[] = [
  { id: 'voice', label: 'Voice & tone', icon: 'quote' },
  { id: 'work', label: 'Work & focus', icon: 'target' },
  { id: 'schedule', label: 'Schedule', icon: 'home' },
  { id: 'travel', label: 'Travel', icon: 'arrow' },
  { id: 'people', label: 'People', icon: 'user' },
  { id: 'stack', label: 'Tech stack', icon: 'sigma' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'self', label: 'About you', icon: 'brain' },
];
