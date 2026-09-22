// Single source of truth for the marketing site's visual language.
// Locked per the Color Consistency Lock: one accent, one neutral family, one type pairing.
export const COLORS = {
  ink: '#0B2436',        // near-black navy - headings, dark surfaces
  body: '#4F6470',       // slate - body copy on light surfaces
  bodyOnDark: 'rgba(255, 255, 255, 0.72)',
  accent: '#0E7490',     // locked accent - teal-cyan, AA-safe with white text
  accentDark: '#0B5C73', // hover / pressed
  accentSoft: '#E4F1F3', // tinted chips / icon backgrounds
  surface: '#FFFFFF',
  surfaceAlt: '#F5F8F9', // cool paper, not warm cream
  border: '#E1E8EA',
  borderStrong: '#C9D6D9',
} as const;

export const FONT_DISPLAY = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const RADIUS = {
  sm: '10px',
  md: '16px',
  lg: '24px',
  pill: '999px',
} as const;
