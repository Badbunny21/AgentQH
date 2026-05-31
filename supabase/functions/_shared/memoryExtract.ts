export const MEMORY_CATEGORIES = [
  'voice',
  'work',
  'schedule',
  'travel',
  'people',
  'stack',
  'security',
  'self',
  'general',
  'handoff',
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export interface MemoryCandidate {
  text: string;
  category: MemoryCategory;
}

export interface ExtractMemoryInput {
  userMessage: string;
  agentReply: string;
  existingMemories: string[];
  agentName?: string;
}

function normalizeMemoryText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isSimilarMemory(existing: string[], candidate: string): boolean {
  const normalized = normalizeMemoryText(candidate);
  if (!normalized) return true;
  return existing.some(m => {
    const other = normalizeMemoryText(m);
    if (!other) return false;
    return other === normalized || other.includes(normalized) || normalized.includes(other);
  });
}

export function filterMemoryCandidates(
  candidates: MemoryCandidate[],
  existingMemories: string[]
): MemoryCandidate[] {
  const seen = new Set<string>();
  const filtered: MemoryCandidate[] = [];

  for (const candidate of candidates) {
    const text = candidate.text?.trim();
    if (!text || text.length > 200) continue;
    if (isSimilarMemory(existingMemories, text)) continue;

    const key = normalizeMemoryText(text);
    if (seen.has(key)) continue;
    seen.add(key);

    const category = MEMORY_CATEGORIES.includes(candidate.category as MemoryCategory)
      ? candidate.category
      : 'general';

    filtered.push({ text, category: category as MemoryCategory });
    if (filtered.length >= 2) break;
  }

  return filtered;
}

export async function extractMemoryCandidates(
  apiKey: string,
  input: ExtractMemoryInput
): Promise<{ candidates: MemoryCandidate[]; error: string | null }> {
  const existingBlock = input.existingMemories.length
    ? input.existingMemories.map(m => `- ${m}`).join('\n')
    : '(none yet)';

  const systemPrompt = [
    'You extract durable facts about the user from chat that would help an AI assistant later.',
    'Return ONLY valid JSON: {"candidates":[{"text":"...","category":"..."}]}',
    'Categories: voice, work, schedule, travel, people, stack, security, self, general.',
    'Rules:',
    '- Return 0–2 candidates max.',
    '- Only extract preferences, constraints, project facts, schedule, people, or personal details the user stated.',
    '- Skip greetings, small talk, one-off questions, and facts already in existing memories.',
    '- Each text must be one concise line under 120 characters.',
    '- If nothing worth remembering, return {"candidates":[]}.',
  ].join('\n');

  const userPrompt = [
    input.agentName ? `Agent: ${input.agentName}` : '',
    `Existing memories:\n${existingBlock}`,
    '',
    'Latest exchange:',
    `User: ${input.userMessage}`,
    `Assistant: ${input.agentReply}`,
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 250,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const msg = data?.error?.message || `OpenAI error (${response.status})`;
      return { candidates: [], error: msg };
    }

    const raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return { candidates: [], error: null };

    let parsed: { candidates?: MemoryCandidate[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { candidates: [], error: null };
    }

    const candidates = filterMemoryCandidates(parsed.candidates ?? [], input.existingMemories);
    return { candidates, error: null };
  } catch (e) {
    return {
      candidates: [],
      error: e instanceof Error ? e.message : 'Network error extracting memories.',
    };
  }
}

export function buildHandoffMemoryText(fromName: string, summary: string, context?: string | null): string {
  const base = `Handoff from ${fromName}: ${summary.trim()}`;
  const ctx = context?.trim();
  return ctx ? `${base} · Context: ${ctx}` : base;
}
