import React from 'react';
import { Box } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  platenumber: string;
  description: string; // we assume this is the AMOUNT (ex: AED 1,500)
  action?: () => void;
  actionLabel?: string;
}

interface AlertsPanelProps {
  alerts: AlertItem[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  const getAlertTheme = (type: AlertItem['type']) => {
    switch (type) {
      case 'error':
        return {
          gradient: 'linear-gradient(135deg, #ffe5e5 0%, #fff5f5 100%)',
          border: '#ef4444',
          iconColor: '#dc2626',
        };
      case 'warning':
        return {
          gradient: 'linear-gradient(135deg, #fff7e6 0%, #fffdf5 100%)',
          border: '#f59e0b',
          iconColor: '#d97706',
        };
      case 'info':
        return {
          gradient: 'linear-gradient(135deg, #e6f4ff 0%, #f5fbff 100%)',
          border: '#3b82f6',
          iconColor: '#2563eb',
        };
    }
  };

  const renderIcon = (type: AlertItem['type'], color: string) => {
    switch (type) {
      case 'error':
        return (
          <Box component="img" src="/rta_dubai.png" alt="RTA Dubai" sx={{ width: 56, height: 26, borderRadius: '6px' }} />
        );
      case 'warning':
        return <WarningAmberRoundedIcon sx={{ color, fontSize: 26 }} />;
      case 'info':
        return <InfoOutlinedIcon sx={{ color, fontSize: 26 }} />;
    }
  };

  return (
    <Box
      sx={{
        background: '#ffffff',
        borderRadius: '18px',
        p: 3,
        boxShadow: '0 6px 30px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
      }}
    >
      <Box
        sx={{
          fontSize: 18,
          fontWeight: 700,
          mb: 3,
          color: '#111827',
        }}
      >
        Important Alerts
      </Box>

      {alerts.length === 0 ? (
        <Box sx={{ color: '#9ca3af', fontSize: 14 }}>
          No alerts at this time
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {alerts.map((alert) => {
            const theme = getAlertTheme(alert.type);

            return (
              <Box
                key={alert.id}
                sx={{
                  background: theme.gradient,
                  borderLeft: `6px solid ${theme.border}`,
                  borderRadius: '16px',
                  p: 3,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>

                  {/* Icon */}
                  <Box sx={{ mt: 0.5 }}>
                    {renderIcon(alert.type, theme.iconColor)}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>

                    {/* Title */}
                    <Box
                      sx={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: '#111827',
                        mb: 1,
                      }}
                    >
                      {alert.title}
                    </Box>

                    {/* Plate Badge */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '12px',
                          background: '#fff',
                          border: '2px solid #111',
                          px: 2,
                          py: 0.6,
                          gap: 1.2,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                      >
                        <Box
                          component="img"
                          src="/dubai.svg"
                          alt="Dubai"
                          sx={{
                            width: 22,
                            height: 22,
                          }}
                        />
                        <Box
                          sx={{
                            fontWeight: 800,
                            fontSize: 18,
                            letterSpacing: '2px',
                            color: '#111',
                          }}
                        >
                          {alert.platenumber}
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          background: theme.iconColor,
                          color: '#fff',
                          px: 3,
                          py: 0.8,
                          borderRadius: '999px',
                          fontWeight: 800,
                          fontSize: 18,
                          letterSpacing: '0.5px',
                          boxShadow: `0 6px 18px ${theme.iconColor}40`,
                          minWidth: '110px',
                          textAlign: 'center',
                        }}
                      >
                        {alert.description}
                      </Box>
                    </Box>

                    {/* Action */}
                    {alert.action && alert.actionLabel && (
                      <Box
                        onClick={alert.action}
                        sx={{
                          mt: 0,
                          display: 'inline-block',
                          fontSize: 13,
                          fontWeight: 600,
                          color: theme.iconColor,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            textDecoration: 'underline',
                            opacity: 0.85,
                          },
                        }}
                      >
                        {alert.actionLabel}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};