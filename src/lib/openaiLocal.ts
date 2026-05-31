import Constants from 'expo-constants';
import { Agent } from '../constants/agents';
import { ChatMessage } from './messageUtils';
import { filterMemoryCandidates, MemoryCandidate } from './memoryUtils';

export interface ExtractMemoryInput {
  userMessage: string;
  agentReply: string;
  existingMemories: string[];
  agentName?: string;
}

function getOpenAIApiKey(): string {
  const extra = Constants.expoConfig?.extra as { openaiApiKey?: string } | undefined;
  return (extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '').trim();
}

export function isLocalOpenAIConfigured(): boolean {
  const apiKey = getOpenAIApiKey();
  return apiKey.length > 0 && !apiKey.includes('your-') && apiKey.startsWith('sk-');
}

function buildSystemPrompt(agent: Agent, memories: string[] = []): string {
  const parts = [
    `You are ${agent.name}, a ${agent.role}.`,
    agent.bio ? agent.bio : '',
    agent.origin ? `You typically work via ${agent.origin}.` : '',
  ];

  if (memories.length > 0) {
    parts.push('Things you remember about this user and your work together:');
    parts.push(memories.map(m => `- ${m}`).join('\n'));
  }

  parts.push(
    'Stay in character. Be concise and helpful — usually 1–3 sentences unless the user asks for more detail.',
    'Do not mention that you are an AI unless asked.',
  );

  return parts.filter(Boolean).join('\n');
}

export async function generateAgentReplyLocal(
  agent: Agent,
  history: ChatMessage[],
  userMessage: string,
  memories: string[] = []
): Promise<{ reply: string | null; error: string | null }> {
  const apiKey = getOpenAIApiKey();

  if (!isLocalOpenAIConfigured()) {
    return {
      reply: null,
      error: 'Local dev: add EXPO_PUBLIC_OPENAI_API_KEY to .env',
    };
  }

  const apiMessages = [
    { role: 'system' as const, content: buildSystemPrompt(agent, memories) },
    ...history.slice(-20).map(m => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `OpenAI error (${response.status})`;
      return { reply: null, error: msg };
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return { reply: null, error: 'Empty response from OpenAI.' };
    return { reply, error: null };
  } catch (e) {
    return { reply: null, error: e instanceof Error ? e.message : 'Network error calling OpenAI.' };
  }
}

export async function extractMemoryCandidatesLocal(
  input: ExtractMemoryInput
): Promise<{ candidates: MemoryCandidate[]; error: string | null }> {
  const apiKey = getOpenAIApiKey();
  if (!isLocalOpenAIConfigured()) {
    return { candidates: [], error: null };
  }

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
      return { candidates: [], error: data?.error?.message || 'Could not extract memories.' };
    }

    const raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return { candidates: [], error: null };

    let parsed: { candidates?: MemoryCandidate[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { candidates: [], error: null };
    }

    return {
      candidates: filterMemoryCandidates(parsed.candidates ?? [], input.existingMemories),
      error: null,
    };
  } catch (e) {
    return {
      candidates: [],
      error: e instanceof Error ? e.message : 'Network error extracting memories.',
    };
  }
}
