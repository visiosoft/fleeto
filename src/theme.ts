import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2F394D', // Deep Slate Gray
      light: '#4A5568',
      dark: '#1A202C',
    },
    secondary: {
      main: '#00B589', // Emergent Green
      light: '#00D1A0',
      dark: '#009B73',
    },
    error: {
      main: '#FF6F61', // Safety Coral
      light: '#FF8F84',
      dark: '#E55A4D',
    },
    success: {
      main: '#00B589', // Emergent Green
      light: '#00D1A0',
      dark: '#009B73',
    },
    warning: {
      main: '#FFC154', // Amber for Idle status
      light: '#FFD17A',
      dark: '#E5A93B',
    },
    info: {
      main: '#25A8B0', // Cool Teal
      light: '#2EC2CB',
      dark: '#1E8E95',
    },
    background: {
      default: '#E0E5EC', // Soft Cloud
      paper: '#FFFFFF',
    },
    text: {
      primary: '#3A3A3A', // Dark Gray for light backgrounds
      secondary: '#4A5568',
    },
    action: {
      active: '#2F394D',
      hover: 'rgba(47, 57, 77, 0.08)',
      selected: 'rgba(47, 57, 77, 0.16)',
      disabled: 'rgba(47, 57, 77, 0.38)',
      disabledBackground: 'rgba(47, 57, 77, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      color: '#2F394D',
    },
    h2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
      color: '#2F394D',
    },
    h3: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#2F394D',
    },
    h4: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#2F394D',
    },
    h5: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#2F394D',
    },
    h6: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#2F394D',
    },
    subtitle1: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#4A5568',
    },
    subtitle2: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#4A5568',
    },
    body1: {
      fontFamily: '"Open Sans", sans-serif',
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
      color: '#3A3A3A',
    },
    body2: {
      fontFamily: '"Open Sans", sans-serif',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
      color: '#3A3A3A',
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      textTransform: 'none',
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.02em',
    },
    caption: {
      fontFamily: '"Open Sans", sans-serif',
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#4A5568',
    },
    overline: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      lineHeight: 1.5,
      letterSpacing: '0.1em',
      color: '#4A5568',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontFamily: '"Inter", sans-serif',
          fontWeight: 500,
          fontSize: '1rem',
          lineHeight: 1.5,
          letterSpacing: '0.02em',
          '&.MuiButton-containedPrimary': {
            backgroundColor: '#00B589',
            '&:hover': {
              backgroundColor: '#00D1A0',
            },
          },
          '&.MuiButton-outlinedPrimary': {
            borderColor: '#2F394D',
            color: '#2F394D',
            '&:hover': {
              borderColor: '#4A5568',
              backgroundColor: 'rgba(47, 57, 77, 0.04)',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(47, 57, 77, 0.1)',
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: '"Open Sans", sans-serif',
          fontSize: '1rem',
          lineHeight: 1.5,
          color: '#3A3A3A',
          borderBottom: '1px solid #E0E5EC',
        },
        head: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
          fontSize: '1rem',
          lineHeight: 1.5,
          color: '#2F394D',
          backgroundColor: '#F8F9FA',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.5,
            color: '#2F394D',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: '"Open Sans", sans-serif',
          fontSize: '1rem',
          lineHeight: 1.5,
          color: '#3A3A3A',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E0E5EC',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2F394D',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00B589',
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", sans-serif',
          fontSize: '1rem',
          lineHeight: 1.5,
          fontWeight: 500,
          color: '#2F394D',
          '&.Mui-focused': {
            color: '#00B589',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 500,
          '&.MuiChip-colorSuccess': {
            backgroundColor: '#00B589',
            color: '#FFFFFF',
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: '#FFC154',
            color: '#2F394D',
          },
          '&.MuiChip-colorError': {
            backgroundColor: '#FF6F61',
            color: '#FFFFFF',
          },
          '&.MuiChip-colorInfo': {
            backgroundColor: '#25A8B0',
            color: '#FFFFFF',
          },
        },
      },
    },
  },
}); 