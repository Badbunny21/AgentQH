export const C = {
  // Backgrounds
  c0: '#06070a',
  c1: '#0d0f15',
  c2: '#13161f',
  c3: '#1c2030',

  // Text
  text: '#f5f5f7',
  textDim: 'rgba(245,245,247,0.62)',
  textMuted: 'rgba(245,245,247,0.38)',

  // Accents
  a: '#a3e635',   // lime
  b: '#22d3ee',   // cyan
  c: '#e879f9',   // magenta

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // Status
  online: '#a3e635',
  away: '#fbbf24',
  busy: '#f87171',
  offline: '#71717a',

  // Radius
  radius: 18,
} as const;

export const GRAD = ['#a3e635', '#22d3ee', '#e879f9'] as const;
export const GRAD_START = { x: 0, y: 0 };
export const GRAD_END = { x: 1, y: 1 };

export const GRAD_KEYS: Record<string, string[]> = {
  aa: ['#a3e635', '#a3e635'],
  bb: ['#22d3ee', '#22d3ee'],
  cc: ['#e879f9', '#e879f9'],
  ab: ['#a3e635', '#22d3ee'],
  bc: ['#22d3ee', '#e879f9'],
  ca: ['#e879f9', '#a3e635'],
};

// Inter replaces Geist. Mono styles use Inter with increased letter-spacing + uppercase.
export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'Inter_400Regular',
  monoMedium: 'Inter_500Medium',
  monoSemibold: 'Inter_600SemiBold',
} as const;

export const STATUS_COLORS = {
  online: '#a3e635',
  away: '#fbbf24',
  busy: '#f87171',
  offline: '#71717a',
} as const;
