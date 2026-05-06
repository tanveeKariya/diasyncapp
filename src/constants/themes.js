// Design system — medical-grade color palette, spacing, and helpers
export const COLORS = {
  // Primary: sky blue — trustworthy, clinical
  primary:       '#0EA5E9',
  primaryDark:   '#0284C7',
  primaryLight:  '#E0F2FE',
  primaryBg:     '#F0F9FF',

  // Secondary: teal — complementary accent
  secondary:      '#14B8A6',
  secondaryDark: '#0D9488',
  secondaryLight:'#CCFBF1',

  // Accent: orange — insulin / action highlights
  accent:       '#F97316',
  accentDark:  '#EA580C',
  accentLight: '#FFF7ED',

  // Food: emerald — food entries
  food:       '#059669',
  foodDark:   '#047857',
  foodLight:  '#D1FAE5',

  // Surfaces
  background: '#F8FAFC',
  surface:    '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border:     '#E2E8F0',
  divider:    '#F1F5F9',

  // Text hierarchy
  text:        '#0F172A',
  textMed:     '#334155',
  subtext:     '#64748B',
  placeholder: '#94A3B8',
  muted:       '#CBD5E1',

  // Status: glucose ranges
  safe:      '#10B981',
  safeLight: '#D1FAE5',
  high:      '#EF4444',
  highLight: '#FEE2E2',
  low:       '#F59E0B',
  lowLight:  '#FEF3C7',

  white: '#FFFFFF',
  black: '#000000',
  shadow:'rgba(15,23,42,0.08)',
};

// 8px spacing scale
export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
};

// Border radius scale
export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
};

// Glucose thresholds
export const GLUCOSE_RANGES = { low: 70, high: 180 };

export const getGlucoseStatus = (value) => {
  if (value > GLUCOSE_RANGES.high) return { label: 'High',     color: COLORS.high, bg: COLORS.highLight, icon: 'arrow-up' };
  if (value < GLUCOSE_RANGES.low)  return { label: 'Low',      color: COLORS.low,  bg: COLORS.lowLight,  icon: 'arrow-down' };
  return                                   { label: 'In Range', color: COLORS.safe,  bg: COLORS.safeLight,  icon: 'checkmark' };
};
