export interface AgentChatContext {
  name: string;
  role: string;
  bio: string;
  origin: string;
  memories: string[];
}

export interface ChatTurn {
  role: 'user' | 'agent';
  text: string;
}

export function buildAgentSystemPrompt(agent: AgentChatContext): string {
  const parts = [
    `You are ${agent.name}, a ${agent.role}.`,
    agent.bio ? agent.bio : '',
    agent.origin ? `You work via ${agent.origin}.` : '',
  ];

  if (agent.memories.length > 0) {
    parts.push('Things you remember about this user and your work together:');
    parts.push(agent.memories.map(m => `- ${m}`).join('\n'));
  }

  parts.push(
    'Stay in character. Be concise and helpful — usually 1–3 sentences unless the user asks for more detail.',
    'Do not mention that you are an AI unless asked.',
  );

  return parts.filter(Boolean).join('\n');
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
}

export async function callOpenAIChat(
  apiKey: string,
  agent: AgentChatContext,
  history: ChatTurn[],
  userMessage: string,
  options: ChatOptions = {}
): Promise<{ reply: string | null; error: string | null }> {
  const maxTokens = options.maxTokens ?? 500;
  const temperature = options.temperature ?? 0.7;

  const apiMessages = [
    { role: 'system' as const, content: buildAgentSystemPrompt(agent) },
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
        max_tokens: maxTokens,
        temperature,
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
