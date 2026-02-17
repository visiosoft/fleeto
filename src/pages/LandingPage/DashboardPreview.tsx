import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import {
  Speed,
  DirectionsCar,
  Warning,
  CheckCircle,
} from '@mui/icons-material';

const DashboardPreview: React.FC = () => {
  const stats = [
    {
      icon: <DirectionsCar />,
      value: '248',
      label: 'Active Vehicles',
      color: '#0B3C5D',
      bgcolor: '#e8f4f8',
    },
    {
      icon: <Speed />,
      value: '187',
      label: 'On the Move',
      color: '#328B9B',
      bgcolor: '#e0f7f4',
    },
    {
      icon: <CheckCircle />,
      value: '61',
      label: 'Parked',
      color: '#059669',
      bgcolor: '#d1fae5',
    },
    {
      icon: <Warning />,
      value: '3',
      label: 'Alerts',
      color: '#dc2626',
      bgcolor: '#fee2e2',
    },
  ];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#fafafa',
      }}
    >
      <Container maxWidth="lg">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 600,
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              color: '#1d1d1f',
              mb: 2,
              letterSpacing: '-0.015em',
            }}
          >
            Modern dashboard
            <br />
            built for performance
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1rem', md: '1.2rem' },
              color: '#64748b',
              maxWidth: 700,
              mx: 'auto',
              lineHeight: 1.7,
            }}
          >
            Clean, intuitive interface with all critical fleet metrics at your fingertips
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(11, 60, 93, 0.1)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: stat.bgcolor,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    '& svg': {
                      fontSize: 24,
                    },
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontSize: { xs: '1.8rem', md: '2.2rem' },
                    fontWeight: 700,
                    color: '#0B3C5D',
                    mb: 0.5,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.9rem',
                    color: '#64748b',
                    fontWeight: 500,
                  }}
                >
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Dashboard Preview Image */}
        <Box
          sx={{
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(11, 60, 93, 0.15)',
            border: '1px solid #e2e8f0',
            bgcolor: 'white',
          }}
        >
          <Box
            component="img"
            src="/images/dash.png"
            alt="Dashboard Preview"
            sx={{
              width: '100%',
              display: 'block',
              transition: 'transform 0.5s ease',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          />
          {/* Overlay gradient for depth */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '30%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.05) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
        </Box>

        {/* Feature Highlights */}
        <Grid container spacing={3} sx={{ mt: 6 }}>
          {[
            {
              title: 'Responsive Design',
              description: 'Works perfectly on desktop, tablet, and mobile devices',
            },
            {
              title: 'Real-time Updates',
              description: 'Live data sync every 30 seconds for up-to-date fleet status',
            },
            {
              title: 'Customizable Views',
              description: 'Personalize your dashboard to show what matters most to you',
            },
          ].map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#0B3C5D',
                    mb: 1,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.95rem',
                    color: '#64748b',
                    lineHeight: 1.7,
                  }}
                >
                  {item.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardPreview;
