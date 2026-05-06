// Primary palette: deep teal-blue, clean and medical-grade feel
export const COLORS = {
  primary: '#0EA5E9',      // sky-500 — action blue
  primaryDark: '#0284C7',  // sky-600
  primaryLight: '#E0F2FE', // sky-100

  secondary: '#14B8A6',    // teal-500
  secondaryLight: '#CCFBF1',

  accent: '#F97316',       // orange-500 — insulin highlight
  accentLight: '#FEF3C7',

  background: '#F0F4F8',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',

  text: '#0F172A',         // slate-900
  textMed: '#334155',      // slate-700
  subtext: '#64748B',      // slate-500
  placeholder: '#94A3B8',  // slate-400
  border: '#CBD5E1',       // slate-300
  divider: '#E2E8F0',

  safe: '#10B981',         // emerald-500 — in-range glucose
  safeLight: '#D1FAE5',
  high: '#EF4444',         // red-500 — high glucose
  highLight: '#FEE2E2',
  low: '#F59E0B',          // amber-500 — low glucose
  lowLight: '#FEF3C7',

  food: '#8B5CF6',         // violet-500 — food entries
  foodLight: '#EDE9FE',

  white: '#FFFFFF',
  shadow: '#0F172A',
};

export const GLUCOSE_RANGES = {
  low: 70,
  high: 180,
};

export const getGlucoseStatus = (value) => {
  if (value > GLUCOSE_RANGES.high) return { label: 'High', color: COLORS.high, bg: COLORS.highLight };
  if (value < GLUCOSE_RANGES.low)  return { label: 'Low',  color: COLORS.low,  bg: COLORS.lowLight  };
  return                                   { label: 'In Range', color: COLORS.safe, bg: COLORS.safeLight };
};