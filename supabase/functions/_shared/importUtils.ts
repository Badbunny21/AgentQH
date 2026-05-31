const EMBLEMS = [
  'triStack', 'hexMesh', 'spark', 'grid', 'rings', 'crescent',
  'diamond', 'arrow', 'wave', 'quote', 'shield',
];
const GRADS = ['aa', 'bb', 'cc', 'ab', 'bc', 'ca'];

function hashString(value: string): number {
  return value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function pickAgentStyle(name: string) {
  const hash = hashString(name.trim().toLowerCase() || 'agent');
  return {
    emblem: EMBLEMS[hash % EMBLEMS.length],
    gradKey: GRADS[hash % GRADS.length],
  };
}

export function randomSecret() {
  return crypto.randomUUID().replace(/-/g, '');
}

export interface ParsedMessage {
  role: 'user' | 'agent';
  text: string;
}

export function parseMemoryLines(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

export function parseConversationPaste(text: string, botName?: string): ParsedMessage[] {
  if (!text.trim()) return [];

  const escaped = (botName || 'bot').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const userPrefixes = /^(you|user|me|human):?\s*/i;
  const agentPrefixes = new RegExp(`^(${escaped}|bot|assistant|agent):?\\s*`, 'i');

  const messages: ParsedMessage[] = [];
  let currentRole: 'user' | 'agent' | null = null;
  let buffer = '';

  const flush = () => {
    if (currentRole && buffer.trim()) {
      messages.push({ role: currentRole, text: buffer.trim() });
    }
    buffer = '';
    currentRole = null;
  };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }

    if (userPrefixes.test(line)) {
      flush();
      currentRole = 'user';
      buffer = line.replace(userPrefixes, '');
    } else if (agentPrefixes.test(line)) {
      flush();
      currentRole = 'agent';
      buffer = line.replace(agentPrefixes, '');
    } else if (currentRole) {
      buffer = buffer ? `${buffer}\n${line}` : line;
    }
  }

  flush();
  return messages;
}
