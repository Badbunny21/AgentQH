export type MemoryCategory =
  | 'voice'
  | 'work'
  | 'schedule'
  | 'travel'
  | 'people'
  | 'stack'
  | 'security'
  | 'self'
  | 'general'
  | 'handoff';

export interface MemoryCandidate {
  text: string;
  category: MemoryCategory;
}

const VALID_CATEGORIES = new Set<MemoryCategory>([
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
]);

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

    const category = VALID_CATEGORIES.has(candidate.category as MemoryCategory)
      ? candidate.category
      : 'general';

    filtered.push({ text, category: category as MemoryCategory });
    if (filtered.length >= 2) break;
  }

  return filtered;
}

export function buildHandoffMemoryText(fromName: string, summary: string, context?: string | null): string {
  const base = `Handoff from ${fromName}: ${summary.trim()}`;
  const ctx = context?.trim();
  return ctx ? `${base} · Context: ${ctx}` : base;
}
