import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import {
  TrendingDown,
  TrendingUp,
  Visibility,
  Notifications,
  BusinessCenter,
} from '@mui/icons-material';

const Benefits: React.FC = () => {
  const benefits = [
    {
      icon: <TrendingDown />,
      title: 'Reduce Operational Costs',
      description: 'Cut fuel expenses by up to 25%, optimize routes, minimize idle time, and reduce unauthorized vehicle usage.',
      color: '#059669',
      bgcolor: '#d1fae5',
    },
    {
      icon: <TrendingUp />,
      title: 'Improve Driver Performance',
      description: 'Track driver behavior, monitor speed violations, reduce accidents, and promote safe driving practices.',
      color: '#328B9B',
      bgcolor: '#e0f7f4',
    },
    {
      icon: <Visibility />,
      title: 'Increase Fleet Visibility',
      description: 'Real-time location tracking, complete trip history, geofencing alerts, and 24/7 fleet monitoring.',
      color: '#0B3C5D',
      bgcolor: '#e8f4f8',
    },
    {
      icon: <Notifications />,
      title: 'Automated Fine Monitoring',
      description: 'Instant UAE traffic fine notifications, driver assignment, fine history tracking, and payment reminders.',
      color: '#dc2626',
      bgcolor: '#fee2e2',
    },
    {
      icon: <BusinessCenter />,
      title: 'Better Business Control',
      description: 'Data-driven insights, comprehensive reports, maintenance scheduling, and complete fleet management from one platform.',
      color: '#7c3aed',
      bgcolor: '#ede9fe',
    },
  ];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#ffffff',
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
            Transform your fleet
            <br />
            operations
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
            Discover how FleetOZ helps UAE businesses optimize their
            fleet operations and drive real results
          </Typography>
        </Box>

        {/* Benefits Grid */}
        <Grid container spacing={4}>
          {benefits.map((benefit, index) => (
            <Grid
              item
              xs={12}
              md={index === benefits.length - 1 ? 12 : 6}
              key={index}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  height: '100%',
                  bgcolor: '#f8fafb',
                  border: '2px solid #e2e8f0',
                  borderRadius: '20px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 16px 48px rgba(11, 60, 93, 0.12)',
                    borderColor: benefit.color,
                    '& .benefit-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                    '&::before': {
                      opacity: 1,
                    },
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    bgcolor: benefit.color,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <Box
                    className="benefit-icon"
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '16px',
                      bgcolor: benefit.bgcolor,
                      color: benefit.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                      '& svg': {
                        fontSize: 32,
                      },
                    }}
                  >
                    {benefit.icon}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: '#0B3C5D',
                        mb: 1.5,
                        fontSize: { xs: '1.3rem', md: '1.5rem' },
                      }}
                    >
                      {benefit.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        color: '#64748b',
                        lineHeight: 1.8,
                      }}
                    >
                      {benefit.description}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* ROI Section */}
        <Box
          sx={{
            mt: 8,
            p: 6,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #00adb5 100%)',
            borderRadius: '24px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 20px 60px rgba(0, 173, 181, 0.3)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontFamily: 'Poppins, sans-serif',
              mb: 2,
              fontSize: { xs: '1.8rem', md: '2.4rem' },
            }}
          >
            Average ROI in First 6 Months
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {[
              { value: '25%', label: 'Fuel Cost Reduction' },
              { value: '40%', label: 'Less Idle Time' },
              { value: '60%', label: 'Faster Fine Resolution' },
            ].map((stat, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    mb: 1,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1.1rem',
                    opacity: 0.95,
                    fontWeight: 500,
                  }}
                >
                  {stat.label}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Benefits;
