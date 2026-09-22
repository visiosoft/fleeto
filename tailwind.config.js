/** @type {import('tailwindcss').Config} */
// Values mirror src/designTokens.ts - update both together.
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: '#E2E8F0',
        // Single brand accent, shared with the MUI theme and the marketing site.
        accent: {
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
        },
        // One cool gray family (slate).
        gray: {
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
        },
        green: {
          50: '#ECFDF5',
          500: '#0F9D6E',
          600: '#0B7C58',
        },
        amber: {
          50: '#FFFBEB',
          500: '#D98A0B',
          600: '#B26F07',
        },
        red: {
          50: '#FEF2F2',
          500: '#DC4B4B',
          600: '#B93A3A',
        },
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        // Tinted with the slate hue instead of pure black.
        'sm-tinted': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'md-tinted': '0 4px 8px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        'lg-tinted': '0 12px 20px -6px rgba(15, 23, 42, 0.10), 0 4px 8px -4px rgba(15, 23, 42, 0.06)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
