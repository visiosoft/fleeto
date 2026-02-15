import { createTheme, ThemeOptions } from '@mui/material/styles';

// Design System Color Palette
const colors = {
  // Neutrals
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  // Primary (Blue)
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  // Success (Green)
  success: {
    50: '#ECFDF5',
    100: '#DCFCE7',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    900: '#166534',
  },
  // Warning (Orange)
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    900: '#92400E',
  },
  // Danger (Red)
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    900: '#991B1B',
  },
};

// Typography Configuration
const typography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  fontSize: 14,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 600,
  fontWeightBold: 700,
  
  h1: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '2rem', // 32px
    lineHeight: 1.25,
    color: colors.gray[900],
  },
  h2: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '1.75rem', // 28px
    lineHeight: 1.25,
    color: colors.gray[900],
  },
  h3: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '1.5rem', // 24px
    lineHeight: 1.25,
    color: colors.gray[900],
  },
  h4: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '1.25rem', // 20px
    lineHeight: 1.25,
    color: colors.gray[900],
  },
  h5: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '1.125rem', // 18px
    lineHeight: 1.25,
    color: colors.gray[900],
  },
  h6: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '1rem', // 16px
    lineHeight: 1.25,
    color: colors.gray[700],
  },
  subtitle1: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.5,
    color: colors.gray[700],
  },
  subtitle2: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 500,
    fontSize: '0.8125rem', // 13px
    lineHeight: 1.5,
    color: colors.gray[500],
  },
  body1: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 400,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.5,
    color: colors.gray[700],
  },
  body2: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 400,
    fontSize: '0.8125rem', // 13px
    lineHeight: 1.5,
    color: colors.gray[500],
  },
  button: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '0.875rem', // 14px
    lineHeight: 1,
    textTransform: 'none' as const,
  },
  caption: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 400,
    fontSize: '0.75rem', // 12px
    lineHeight: 1.5,
    color: colors.gray[500],
  },
  overline: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '0.75rem', // 12px
    lineHeight: 1.5,
    letterSpacing: '0.025em',
    textTransform: 'uppercase' as const,
    color: colors.gray[500],
  },
};

// Modern Enterprise Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary[600],
      light: colors.primary[400],
      dark: colors.primary[700],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.gray[600],
      light: colors.gray[400],
      dark: colors.gray[700],
      contrastText: '#FFFFFF',
    },
    error: {
      main: colors.danger[500],
      light: colors.danger[100],
      dark: colors.danger[600],
      contrastText: '#FFFFFF',
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[100],
      dark: colors.warning[600],
      contrastText: '#FFFFFF',
    },
    success: {
      main: colors.success[500],
      light: colors.success[100],
      dark: colors.success[600],
      contrastText: '#FFFFFF',
    },
    info: {
      main: colors.primary[500],
      light: colors.primary[100],
      dark: colors.primary[700],
      contrastText: '#FFFFFF',
    },
    background: {
      default: colors.gray[50],
      paper: '#FFFFFF',
    },
    text: {
      primary: colors.gray[900],
      secondary: colors.gray[700],
      disabled: colors.gray[400],
    },
    divider: colors.gray[200],
    action: {
      active: colors.primary[600],
      hover: colors.gray[100],
      selected: colors.primary[50],
      disabled: colors.gray[300],
      disabledBackground: colors.gray[100],
    },
  },
  typography: typography as any,
  shape: {
    borderRadius: 8,
  },
  spacing: 4, // Base spacing unit (4px)
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"Inter", sans-serif',
          backgroundColor: colors.gray[50],
          color: colors.gray[900],
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: colors.gray[900],
          borderBottom: `1px solid ${colors.gray[200]}`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: `1px solid ${colors.gray[200]}`,
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: `1px solid ${colors.gray[200]}`,
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          '&:last-child': {
            paddingBottom: 20,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
        },
        outlined: {
          border: `1px solid ${colors.gray[200]}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          borderRadius: 8,
          padding: '10px 16px',
          boxShadow: 'none',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          backgroundColor: colors.primary[600],
          '&:hover': {
            backgroundColor: colors.primary[700],
          },
        },
        outlined: {
          borderColor: colors.gray[200],
          color: colors.gray[700],
          '&:hover': {
            borderColor: colors.gray[300],
            backgroundColor: colors.gray[50],
          },
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '12px 20px',
          fontSize: '1rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.8125rem',
          borderRadius: 9999,
        },
        filled: {
          border: 'none',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: colors.gray[50],
          borderBottom: `1px solid ${colors.gray[200]}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: '0.8125rem',
          color: colors.gray[700],
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          padding: '12px 16px',
          borderBottom: `1px solid ${colors.gray[200]}`,
        },
        body: {
          fontSize: '0.875rem',
          color: colors.gray[900],
          padding: '12px 16px',
          borderBottom: `1px solid ${colors.gray[200]}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: '#FFFFFF',
          },
          '&:nth-of-type(odd)': {
            backgroundColor: colors.gray[50],
          },
          '&:hover': {
            backgroundColor: colors.gray[100],
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          color: '#64748B',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: colors.gray[100],
            color: colors.gray[900],
          },
          '&.Mui-selected': {
            backgroundColor: colors.primary[50],
            color: colors.primary[600],
            fontWeight: 600,
            borderLeft: `4px solid ${colors.primary[600]}`,
            '&:hover': {
              backgroundColor: colors.primary[100],
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: 'inherit',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.875rem',
          fontWeight: 'inherit',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", sans-serif',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: colors.gray[200],
            },
            '&:hover fieldset': {
              borderColor: colors.gray[300],
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary[600],
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontFamily: '"Inter", sans-serif',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.gray[800],
          fontSize: '0.8125rem',
          borderRadius: 6,
          padding: '6px 12px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.gray[200],
        },
      },
    },
  },
});

export default theme;
 