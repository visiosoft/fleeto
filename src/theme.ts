import { createTheme, Theme } from '@mui/material/styles';
import { gray, accent, success, warning, danger, fonts, shadow, radius } from './designTokens';

type Mode = 'light' | 'dark';

const heading = (fontSize: string, lineHeight: number, letterSpacing: string) => ({
  fontFamily: fonts.display,
  fontWeight: 700,
  fontSize,
  lineHeight,
  letterSpacing,
});

export const createAppTheme = (mode: Mode): Theme => {
  const isDark = mode === 'dark';

  // Off-black navy in dark mode, never pure #000.
  const surface = {
    default: isDark ? '#0B1220' : gray[50],
    paper: isDark ? '#131C2B' : '#FFFFFF',
    raised: isDark ? '#1A2536' : '#FFFFFF',
    border: isDark ? 'rgba(226, 232, 240, 0.10)' : gray[200],
    borderStrong: isDark ? 'rgba(226, 232, 240, 0.18)' : gray[300],
    hover: isDark ? 'rgba(226, 232, 240, 0.06)' : gray[100],
  };

  const text = {
    primary: isDark ? gray[100] : gray[900],
    secondary: isDark ? gray[400] : gray[600],
    disabled: isDark ? gray[600] : gray[400],
  };

  return createTheme({
    palette: {
      mode,
      primary: {
        main: accent[600],
        light: accent[400],
        dark: accent[700],
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: gray[600],
        light: gray[400],
        dark: gray[700],
        contrastText: '#FFFFFF',
      },
      success: { main: success[500], light: success[100], dark: success[600], contrastText: '#FFFFFF' },
      warning: { main: warning[500], light: warning[100], dark: warning[600], contrastText: '#FFFFFF' },
      error: { main: danger[500], light: danger[100], dark: danger[600], contrastText: '#FFFFFF' },
      info: { main: accent[500], light: accent[100], dark: accent[700], contrastText: '#FFFFFF' },
      background: { default: surface.default, paper: surface.paper },
      text,
      divider: surface.border,
      action: {
        active: accent[600],
        hover: surface.hover,
        selected: isDark ? 'rgba(14, 116, 144, 0.22)' : accent[50],
        disabled: text.disabled,
        disabledBackground: isDark ? 'rgba(226, 232, 240, 0.08)' : gray[100],
      },
    },

    typography: {
      fontFamily: fonts.body,
      fontSize: 14,
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      h1: heading('2rem', 1.2, '-0.02em'),
      h2: heading('1.75rem', 1.22, '-0.018em'),
      h3: heading('1.5rem', 1.25, '-0.015em'),
      h4: heading('1.25rem', 1.3, '-0.012em'),
      h5: { ...heading('1.125rem', 1.35, '-0.01em'), fontWeight: 600 },
      h6: { ...heading('1rem', 1.4, '-0.005em'), fontWeight: 600 },
      subtitle1: { fontFamily: fonts.body, fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.5 },
      subtitle2: { fontFamily: fonts.body, fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.5 },
      body1: { fontFamily: fonts.body, fontWeight: 400, fontSize: '0.875rem', lineHeight: 1.55 },
      body2: { fontFamily: fonts.body, fontWeight: 400, fontSize: '0.8125rem', lineHeight: 1.55 },
      button: { fontFamily: fonts.body, fontWeight: 600, fontSize: '0.875rem', lineHeight: 1, textTransform: 'none' },
      caption: { fontFamily: fonts.body, fontWeight: 400, fontSize: '0.75rem', lineHeight: 1.5 },
      overline: {
        fontFamily: fonts.body,
        fontWeight: 600,
        fontSize: '0.6875rem',
        lineHeight: 1.5,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      },
    },

    shape: { borderRadius: radius.md },
    spacing: 4,

    shadows: [
      'none',
      shadow.xs,
      shadow.sm,
      shadow.sm,
      shadow.md,
      shadow.md,
      shadow.lg,
      shadow.lg,
      shadow.lg,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
      shadow.xl,
    ],

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { scrollBehavior: 'smooth' },
          body: {
            fontFamily: fonts.body,
            backgroundColor: surface.default,
            color: text.primary,
            WebkitFontSmoothing: 'antialiased',
          },
          // Keyboard users get a ring; mouse users don't. Replaces the old :focus-on-click ring.
          ':focus-visible': {
            outline: `2px solid ${accent[500]}`,
            outlineOffset: 2,
          },
          '::selection': {
            backgroundColor: accent[100],
            color: gray[900],
          },
        },
      },

      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: surface.paper,
            color: text.primary,
            borderBottom: `1px solid ${surface.border}`,
            boxShadow: 'none',
            backgroundImage: 'none',
          },
        },
      },

      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: surface.paper,
            borderRight: `1px solid ${surface.border}`,
            backgroundImage: 'none',
          },
        },
      },

      // Cards lead with a border, not a resting shadow. Elevation appears on interaction.
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: surface.paper,
            backgroundImage: 'none',
            border: `1px solid ${surface.border}`,
            borderRadius: radius.lg,
            boxShadow: 'none',
            transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { boxShadow: shadow.md, borderColor: surface.borderStrong },
          },
        },
      },

      MuiCardContent: {
        styleOverrides: {
          root: { padding: 20, '&:last-child': { paddingBottom: 20 } },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: { backgroundColor: surface.paper, backgroundImage: 'none', borderRadius: radius.lg },
          outlined: { border: `1px solid ${surface.border}` },
        },
      },

      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: radius.md,
            padding: '9px 16px',
            boxShadow: 'none',
            transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
            '&:active': { transform: 'scale(0.98)' },
          },
          containedPrimary: {
            backgroundColor: accent[600],
            '&:hover': { backgroundColor: accent[700], boxShadow: 'none' },
          },
          outlined: {
            borderColor: surface.borderStrong,
            color: text.primary,
            '&:hover': { borderColor: accent[600], backgroundColor: isDark ? 'rgba(14,116,144,0.14)' : accent[50] },
          },
          text: {
            '&:hover': { backgroundColor: surface.hover },
          },
          sizeSmall: { padding: '5px 12px', fontSize: '0.8125rem' },
          sizeLarge: { padding: '12px 22px', fontSize: '0.9375rem' },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            transition: 'background-color 0.15s ease, transform 0.1s ease',
            '&:active': { transform: 'scale(0.94)' },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, fontSize: '0.75rem', borderRadius: radius.sm, height: 24 },
          filled: { border: 'none' },
          label: { paddingLeft: 8, paddingRight: 8 },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: { backgroundColor: isDark ? 'rgba(226,232,240,0.04)' : gray[50] },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          head: {
            fontFamily: fonts.body,
            fontWeight: 600,
            fontSize: '0.6875rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: text.secondary,
            padding: '10px 16px',
            borderBottom: `1px solid ${surface.border}`,
            whiteSpace: 'nowrap',
          },
          // Figures line up column-to-column in every table across the app.
          body: {
            fontSize: '0.875rem',
            color: text.primary,
            padding: '12px 16px',
            borderBottom: `1px solid ${surface.border}`,
            fontVariantNumeric: 'tabular-nums',
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.12s ease',
            '&:hover': { backgroundColor: surface.hover },
            '&:last-child td': { borderBottom: 'none' },
          },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            margin: '2px 8px',
            color: text.secondary,
            transition: 'background-color 0.15s ease, color 0.15s ease',
            '&:hover': { backgroundColor: surface.hover, color: text.primary },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(14,116,144,0.22)' : accent[50],
              color: accent[isDark ? 300 : 700],
              fontWeight: 600,
              '&:hover': { backgroundColor: isDark ? 'rgba(14,116,144,0.3)' : accent[100] },
            },
          },
        },
      },

      MuiListItemIcon: {
        styleOverrides: { root: { minWidth: 38, color: 'inherit' } },
      },

      MuiListItemText: {
        styleOverrides: { primary: { fontSize: '0.875rem', fontWeight: 'inherit' } },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            backgroundColor: surface.paper,
            '& fieldset': { borderColor: surface.border },
            '&:hover fieldset': { borderColor: surface.borderStrong },
            '&.Mui-focused fieldset': { borderColor: accent[600], borderWidth: 2 },
          },
          input: { '&::placeholder': { color: text.disabled, opacity: 1 } },
        },
      },

      MuiInputBase: {
        styleOverrides: { root: { fontSize: '0.875rem', fontFamily: fonts.body } },
      },

      MuiInputLabel: {
        styleOverrides: { root: { fontSize: '0.875rem', '&.Mui-focused': { color: accent[700] } } },
      },

      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: radius.md, fontSize: '0.875rem' },
          standardSuccess: { backgroundColor: success[50], color: success[700] },
          standardWarning: { backgroundColor: warning[50], color: warning[700] },
          standardError: { backgroundColor: danger[50], color: danger[700] },
          standardInfo: { backgroundColor: accent[50], color: accent[700] },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: gray[800],
            fontSize: '0.75rem',
            fontWeight: 500,
            borderRadius: radius.sm,
            padding: '6px 10px',
          },
        },
      },

      MuiDialog: {
        styleOverrides: { paper: { borderRadius: radius.xl, backgroundImage: 'none' } },
      },

      MuiDialogTitle: {
        styleOverrides: {
          root: { fontFamily: fonts.display, fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.01em' },
        },
      },

      MuiDivider: {
        styleOverrides: { root: { borderColor: surface.border } },
      },

      MuiTabs: {
        styleOverrides: { indicator: { backgroundColor: accent[600], height: 2 } },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            minHeight: 44,
            '&.Mui-selected': { color: accent[700] },
          },
        },
      },

      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: radius.pill, height: 6 } },
      },

      MuiSkeleton: {
        styleOverrides: {
          root: { backgroundColor: isDark ? 'rgba(226,232,240,0.08)' : gray[200], borderRadius: radius.sm },
        },
      },
    },
  });
};

const theme = createAppTheme('light');

export default theme;
