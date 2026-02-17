import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import {
  Router,
  AccountBalance,
  PhoneIphone,
  Api,
} from '@mui/icons-material';

const Integrations: React.FC = () => {
  const integrations = [
    {
      icon: <Router />,
      title: 'GPS Tracker Providers',
      description: 'Seamless integration with 50+ GPS tracking hardware providers including Teltonika, Ruptela, Jimi IoT, and Queclink.',
      items: [
        'Real-time data sync',
        'Multiple device support',
        'Automatic device detection',
        'Custom protocol support',
      ],
      color: '#0B3C5D',
      bgcolor: '#e8f4f8',
    },
    {
      icon: <AccountBalance />,
      title: 'UAE Government Systems',
      description: 'Direct integration with UAE traffic fine systems for automated fine detection and monitoring across all emirates.',
      items: [
        'Dubai Police integration',
        'Abu Dhabi Police integration',
        'MOI fine system',
        'Automated fine updates',
      ],
      color: '#328B9B',
      bgcolor: '#e0f7f4',
    },
    {
      icon: <PhoneIphone />,
      title: 'Mobile Applications',
      description: 'Progressive Web App (PWA) that works seamlessly across all devices with offline capability and push notifications.',
      items: [
        'iOS & Android compatible',
        'Offline mode support',
        'Push notifications',
        'Real-time tracking on mobile',
      ],
      color: '#059669',
      bgcolor: '#d1fae5',
    },
    {
      icon: <Api />,
      title: 'Developer API',
      description: 'Comprehensive RESTful API for custom integrations with your existing business systems and third-party applications.',
      items: [
        'Complete REST API',
        'Webhook support',
        'API documentation',
        'Custom integrations',
      ],
      color: '#7c3aed',
      bgcolor: '#ede9fe',
    },
  ];

  return (
    <Box
      id="integrations"
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
            Powerful integrations
            <br />
            that work for you
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
            Connect FleetOZ with your existing systems and tools
            for a seamless fleet management experience
          </Typography>
        </Box>

        {/* Integrations Grid */}
        <Grid container spacing={4}>
          {integrations.map((integration, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  height: '100%',
                  bgcolor: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '20px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 16px 48px rgba(11, 60, 93, 0.12)',
                    borderColor: integration.color,
                    '& .integration-icon': {
                      transform: 'scale(1.1)',
                      bgcolor: integration.color,
                      color: 'white',
                    },
                  },
                }}
              >
                {/* Icon */}
                <Box
                  className="integration-icon"
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '18px',
                    bgcolor: integration.bgcolor,
                    color: integration.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    transition: 'all 0.3s ease',
                    '& svg': {
                      fontSize: 36,
                    },
                  }}
                >
                  {integration.icon}
                </Box>

                {/* Title */}
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#0B3C5D',
                    mb: 2,
                    fontSize: '1.4rem',
                  }}
                >
                  {integration.title}
                </Typography>

                {/* Description */}
                <Typography
                  sx={{
                    fontSize: '1rem',
                    color: '#64748b',
                    lineHeight: 1.7,
                    mb: 3,
                  }}
                >
                  {integration.description}
                </Typography>

                {/* Feature List */}
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {integration.items.map((item, idx) => (
                    <Box
                      component="li"
                      key={idx}
                      sx={{
                        fontSize: '0.95rem',
                        color: '#64748b',
                        mb: 1,
                        lineHeight: 1.6,
                        '&::marker': {
                          color: integration.color,
                        },
                      }}
                    >
                      {item}
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* API Documentation CTA */}
        <Box
          sx={{
            mt: 8,
            p: 6,
            bgcolor: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '20px',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#0B3C5D',
              mb: 2,
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            Need a Custom Integration?
          </Typography>
          <Typography
            sx={{
              fontSize: '1.1rem',
              color: '#64748b',
              mb: 3,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Our API and integration team is ready to help you connect
            FleetOZ with your existing business systems
          </Typography>
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              px: 4,
              py: 2,
              bgcolor: '#f8fafb',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              color: '#0B3C5D',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: '#0B3C5D',
                color: 'white',
                borderColor: '#0B3C5D',
              },
            }}
          >
            View API Documentation →
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Integrations;
