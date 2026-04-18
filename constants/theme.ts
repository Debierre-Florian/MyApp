import { Platform } from 'react-native';

// ─── Larder theme ─────────────────────────────────────────────────────────────
// Editorial · serif / mono · cream, terracotta, olive, mustard
// Inspired by a "journal du frigo" aesthetic.

export const COLORS = {
  // Base
  cream: '#F5F0E8',
  creamDeep: '#EDE8DC',
  paper: '#FAF6EF',
  ink: '#1E1B16',
  inkSoft: '#3A362E',
  muted: '#9A9080',
  mutedLight: '#C8BFB1',
  rule: '#DED5C4',

  // Accents
  terracotta: '#C4622D',
  terracottaSoft: '#E8C5B0',
  terracottaBg: '#F4E3D6',
  olive: '#5C6B3A',
  oliveSoft: '#8A9A5B',
  oliveBg: '#E6E9D6',
  mustard: '#D4A12B',
  mustardSoft: '#E8C46B',
  mustardBg: '#F5E7BD',

  // Semantic freshness
  fresh: '#5C6B3A',
  freshBg: '#E6E9D6',
  warn: '#D4A12B',
  warnBg: '#F5E7BD',
  danger: '#C4622D',
  dangerBg: '#F4E3D6',

  // UI
  dark: '#1E1B16',
  white: '#FFFFFF',
  overlay: 'rgba(30,27,22,0.55)',
};

// ─── Typography ───────────────────────────────────────────────────────────────
// Expo/RN default fonts are swapped for system stacks that approximate
// Fraunces (serif) and IBM Plex Mono. On device without custom fonts,
// we fall back to the platform serif/monospace so the hierarchy still reads.

export const FONTS = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }) as string,
  serifItalic: Platform.select({
    ios: 'Georgia-Italic',
    android: 'serif',
    default: 'serif',
  }) as string,
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) as string,
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }) as string,
};

// ─── Spacing & radius ─────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
};
