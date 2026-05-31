export const DISCORD_API = 'https://discord.com/api/v10';

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  bot?: boolean;
}

export interface DiscordMessage {
  id: string;
  content: string;
  author: DiscordUser;
  timestamp: string;
}

export async function discordBotGetMe(botToken: string) {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false as const, error: text || `Discord API error (${response.status})` };
  }

  const data = await response.json();
  return { ok: true as const, data: data as DiscordUser };
}

export async function discordFetchChannelMessages(botToken: string, channelId: string, limit = 50) {
  const response = await fetch(`${DISCORD_API}/channels/${channelId}/messages?limit=${limit}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false as const, error: text || `Discord API error (${response.status})` };
  }

  const data = await response.json();
  return { ok: true as const, data: data as DiscordMessage[] };
}

export async function discordSendChannelMessage(botToken: string, channelId: string, content: string) {
  const response = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return { ok: false as const, error: data.message || `Discord send failed (${response.status})` };
  }

  const data = await response.json();
  return { ok: true as const, data: data as DiscordMessage };
}

export function discordDisplayName(user: DiscordUser): string {
  return user.global_name || user.username;
}
