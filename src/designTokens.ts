/**
 * Canonical design tokens for the FleetOZ dashboard.
 *
 * This file is the single source of truth. Two non-TS consumers mirror these values
 * by hand and must be updated alongside it:
 *   - tailwind.config.js  (shell components in src/components/modern use Tailwind)
 *   - src/styles/design-system.css  (:root custom properties)
 */

// One cool gray family (slate) so every surface, border and shadow shares a hue.
export const gray = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
} as const;

// Single brand accent, shared with the marketing site so both surfaces match.
export const accent = {
  50: '#ECFAFC',
  100: '#D0F1F6',
  200: '#A7E3EC',
  300: '#6FCDDD',
  400: '#34AEC5',
  500: '#1590A8',
  600: '#0E7490',
  700: '#0B5C73',
  800: '#0A4A5C',
  900: '#093C4B',
} as const;

// Status colors are functional here (vehicle live/idle, invoice paid/overdue, licence expiring),
// so they stay - but muted to sit beside the accent instead of competing with it.
export const success = {
  50: '#ECFDF5',
  100: '#D2F2E3',
  500: '#0F9D6E',
  600: '#0B7C58',
  700: '#095F44',
} as const;

export const warning = {
  50: '#FFFBEB',
  100: '#FCEFCC',
  500: '#D98A0B',
  600: '#B26F07',
  700: '#8A5605',
} as const;

export const danger = {
  50: '#FEF2F2',
  100: '#FADEDE',
  500: '#DC4B4B',
  600: '#B93A3A',
  700: '#962F2F',
} as const;

export const fonts = {
  display: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace",
} as const;

// Shadows carry the slate-900 hue rather than pure black, so they sit in the palette.
export const shadow = {
  xs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
  sm: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
  md: '0 4px 8px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
  lg: '0 12px 20px -6px rgba(15, 23, 42, 0.10), 0 4px 8px -4px rgba(15, 23, 42, 0.06)',
  xl: '0 24px 40px -12px rgba(15, 23, 42, 0.16), 0 8px 16px -8px rgba(15, 23, 42, 0.08)',
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
} as const;
