import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#2D9B9B',
      },
      secondary: {
        main: '#6B9080',
      },
      error: {
        main: '#FF6F61',
      },
      warning: {
        main: '#FFB347',
      },
      info: {
        main: '#6C757D',
      },
      background: {
        default: isDarkMode ? '#1A1A1A' : '#F5F7FA',
        paper: isDarkMode ? '#2D2D2D' : '#FFFFFF',
      },
      text: {
        primary: isDarkMode ? '#FFFFFF' : '#333333',
        secondary: isDarkMode ? '#B0B0B0' : '#6C757D',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#2D2D2D' : '#F5F7FA',
            color: isDarkMode ? '#FFFFFF' : '#333333',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderBottom: `1px solid ${isDarkMode ? '#404040' : '#E2E8F0'}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDarkMode ? '#2D2D2D' : '#FFFFFF',
            color: isDarkMode ? '#FFFFFF' : '#333333',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: isDarkMode ? '#404040' : '#E2E8F0',
              '&:hover': {
                backgroundColor: isDarkMode ? '#404040' : '#E2E8F0',
              },
            },
            '&:hover': {
              backgroundColor: isDarkMode ? '#404040' : '#F5F7FA',
            },
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 