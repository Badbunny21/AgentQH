export const USER = {
  name: 'Johana',
  email: 'johana@field.studio',
  plan: 'FREE',
  agentCount: 11,
  agentMax: 5,
};

export interface Task {
  id: string;
  title: string;
  agent: string;
  status: string;
  done: boolean;
  time: string;
}

export const TASKS: Task[] = [
  { id: 't1', title: 'Pull Q3 AI infrastructure earnings notes', agent: 'maya', status: 'doing', done: false, time: '11:02 AM' },
  { id: 't2', title: 'Refactor sign-in flow to use new tRPC route', agent: 'finn', status: 'doing', done: false, time: '10:48 AM' },
  { id: 't3', title: 'Draft three taglines for the launch hero', agent: 'iris', status: 'review', done: false, time: '10:30 AM' },
  { id: 't4', title: 'Reschedule Thursday standup to 11am', agent: 'kai', status: 'doing', done: false, time: '9:55 AM' },
  { id: 't5', title: 'Book SFO→JFK for Tue, return Fri', agent: 'atlas', status: 'doing', done: false, time: '9:30 AM' },
  { id: 't6', title: 'Sum up overnight news in 5 bullets', agent: 'wren', status: 'done', done: true, time: '8:14 AM' },
  { id: 't7', title: 'Cohort retention chart for board deck', agent: 'nova', status: 'done', done: true, time: '7:58 AM' },
  { id: 't8', title: "Index yesterday's Readwise highlights", agent: 'sage', status: 'done', done: true, time: '7:30 AM' },
  { id: 't9', title: 'Quarterly review prompt set for Sunday', agent: 'theo', status: 'done', done: true, time: 'Yesterday' },
];

export interface Message {
  role: 'user' | 'agent';
  text: string;
  time: string;
}

export const CONVERSATIONS: Record<string, Message[]> = {
  maya: [
    { role: 'user', text: 'Where are we on the AI infra earnings sweep?', time: '10:58 AM' },
    { role: 'agent', text: 'Pulled six. Three say capex is front-loaded into Q3, two are guiding flat, one revised up.', time: '11:00 AM' },
    { role: 'agent', text: 'The interesting one is CoreWeave — utilization stayed at 96% while they added 18% capacity. That doesn\'t usually happen.', time: '11:00 AM' },
    { role: 'user', text: 'What\'s their guidance say about Q4?', time: '11:01 AM' },
    { role: 'agent', text: 'Vague. "Continued strong demand," no number. CFO sidestepped the question twice on the call. I have the transcript if you want the exact lines.', time: '11:02 AM' },
  ],
  finn: [
    { role: 'user', text: 'Did the auth refactor break anything?', time: 'Yesterday' },
    { role: 'agent', text: 'No regressions in the test suite. One thing: the session token now needs to be refreshed on cold start, not just expiry.', time: 'Yesterday' },
    { role: 'agent', text: 'Added a hook. PR is up.', time: 'Yesterday' },
  ],
  iris: [
    { role: 'agent', text: 'Three drafts for the hero. Cut the one with "unlock" — you\'d hate it.', time: '10:30 AM' },
    { role: 'agent', text: '1. Your agents, finally a team.\n2. Eleven coworkers. One home.\n3. The home for the agents you actually use.', time: '10:30 AM' },
  ],
  kai: [
    { role: 'agent', text: 'Thursday standup moved to 11am. Sent updates to the four attendees.', time: '9:56 AM' },
  ],
  nova: [
    { role: 'agent', text: 'Cohort chart ready. Day-30 retention up 4 points vs Q1. Want me to drop it in the deck?', time: '7:58 AM' },
  ],
  theo: [
    { role: 'agent', text: 'Reminder: you said you\'d say no more this year. There are two meetings on Friday you could decline.', time: 'Yesterday' },
  ],
  atlas: [
    { role: 'agent', text: 'Held UA 23 SFO→JFK Tue 7:25am, window 7A. Returning UA 506 Fri 4:10pm. Confirm to book?', time: '9:30 AM' },
  ],
  echo: [
    { role: 'agent', text: '84 new reviews overnight. Sentiment +0.3. Top complaint still onboarding length — 9 mentions.', time: '8:02 AM' },
  ],
  wren: [
    { role: 'agent', text: 'Five things worth your time this morning. Linked in the digest.', time: '8:14 AM' },
  ],
  sage: [
    { role: 'agent', text: 'Indexed 12 highlights from last night. Three connect to your essay draft on "memory."', time: '7:30 AM' },
  ],
  onyx: [
    { role: 'agent', text: 'Six alerts overnight. Five benign (new device on iPad), one to review: new login to GitHub from Berlin at 3:18 AM PT.', time: '6:42 AM' },
  ],
};

export const AUTO_REPLIES: Record<string, string[]> = {
  maya: [
    'Looking. Give me a second.',
    'Pulled it. The number you want is 23.4%, not 22.',
    'Source: their 10-Q, page 14. Want me to attach?',
    'That\'s a fair question — the data doesn\'t answer it cleanly. Want my read?',
  ],
  finn: [
    'On it.',
    'PR up in ten.',
    'I\'d push back on that approach — it couples auth and routing. Better option?',
    'Tests pass. Want me to deploy to staging?',
  ],
  iris: [
    'Working on it.',
    'How\'s this: "The home for the agents you actually use."',
    'Cut three adjectives. Reads cleaner.',
  ],
  kai: ['Done.', 'Calendar updated. Three people notified.', 'Conflict on Tuesday — want me to move it?'],
  atlas: ['Booked.', 'TSA pre-check confirmed. Boarding pass in Wallet by Monday.'],
  default: ['On it.', 'Looking now.', 'Give me a minute.', 'Got it — will report back.'],
};

export interface Platform {
  id: string;
  name: string;
  count: number;
  color: string;
  agents: string[];
}

export const PLATFORMS: Platform[] = [
  { id: 'telegram', name: 'Telegram', count: 4, color: '#22d3ee', agents: ['Maya', 'Kai', 'Atlas', '+ 1 more'] },
  { id: 'discord', name: 'Discord', count: 2, color: '#a3e635', agents: ['Nova', 'Echo'] },
  { id: 'chatgpt', name: 'ChatGPT', count: 3, color: '#e879f9', agents: ['Iris', 'Sage', 'Wren'] },
  { id: 'claude', name: 'Claude', count: 2, color: '#fbbf24', agents: ['Finn', 'Theo'] },
];

export interface Handoff {
  id: string;
  from: string;
  to: string;
  summary: string;
  context: string;
  time: string;
}

export const HANDOFFS: Handoff[] = [
  { id: 'h1', from: 'maya', to: 'iris', summary: 'Briefed Iris on Q3 AI infra sweep — 6 sources, key angle: capex front-loaded.', context: 'For the launch hero', time: '10:34 AM' },
  { id: 'h2', from: 'nova', to: 'iris', summary: 'Sent cohort retention chart — Day-30 up 4pts. Want it in the deck.', context: 'Board deck', time: '8:12 AM' },
  { id: 'h3', from: 'wren', to: 'theo', summary: 'Flagged 2 reads on burnout for the quarterly review prompt set.', context: 'Sunday review', time: '7:48 AM' },
  { id: 'h4', from: 'onyx', to: 'finn', summary: 'New device login flagged. Patched the session refresh, asked Finn to harden the route.', context: 'Auth refactor', time: 'Yesterday' },
];

export interface MemoryFact {
  cat: string;
  text: string;
  agents: string[];
  src: string;
}

export const MEMORY_FACTS: MemoryFact[] = [
  { cat: 'voice', text: 'Voice: warm-direct, no startup-speak. Avoid "unlock", "supercharge", "revolutionize".', agents: ['iris', 'wren'], src: 'Iris · 8 confirmations' },
  { cat: 'schedule', text: 'No meetings before 10am PT. Wednesdays are deep work.', agents: ['kai', 'theo'], src: 'Kai · set Feb 14' },
  { cat: 'work', text: 'Tracking AI infrastructure earnings, Q3 2026.', agents: ['maya', 'nova'], src: 'Maya · ongoing' },
  { cat: 'stack', text: 'Stack: React Native + Expo + tRPC. Vanilla CSS modules, no Tailwind.', agents: ['finn'], src: 'Finn · set Mar 14' },
  { cat: 'travel', text: 'United 1K, Hyatt Globalist. Window seat near galley, never row 1.', agents: ['atlas', 'kai'], src: 'Atlas · 12 trips' },
  { cat: 'people', text: "Father's birthday April 4. Sister: Lena, in Berlin.", agents: ['theo'], src: 'Theo · set Feb 12' },
  { cat: 'self', text: 'Saying no more this year. Quarterly review every 13 weeks.', agents: ['theo'], src: 'Theo · active' },
  { cat: 'security', text: '12 monitored accounts, 2FA enforced. Alert threshold: $500+.', agents: ['onyx'], src: 'Onyx · ongoing' },
  { cat: 'work', text: 'Cohort = first session date. Primary KPI: weekly active, not signups.', agents: ['nova', 'echo'], src: 'Nova · set Feb 20' },
  { cat: 'voice', text: 'AP style. Oxford comma. Sentences earn their length.', agents: ['iris', 'wren'], src: 'Iris · set Mar 12' },
];

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

export interface Cost {
  id: string;
  name: string;
  monthly: number;
  color: string;
  kind: 'replace' | 'keep';
}

export const COSTS: Cost[] = [
  { id: 'chatgpt', name: 'ChatGPT Plus', monthly: 20, color: '#e879f9', kind: 'replace' },
  { id: 'claude', name: 'Claude Pro', monthly: 20, color: '#fbbf24', kind: 'replace' },
  { id: 'perplex', name: 'Perplexity Pro', monthly: 20, color: '#22d3ee', kind: 'keep' },
  { id: 'mid', name: 'Midjourney', monthly: 10, color: '#a3e635', kind: 'keep' },
  { id: 'eleven', name: 'ElevenLabs', monthly: 14, color: '#f87171', kind: 'replace' },
];

export const BACKUP = {
  recovered: 1247,
  threads: 38,
  platforms: 4,
  autoBackup: true,
  lastSync: 'Today, 11:02 AM',
};
