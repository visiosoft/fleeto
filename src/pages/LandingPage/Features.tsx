import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import {
  LocationOn,
  Map,
  Notifications,
  People,
  History,
  Build,
  LocalGasStation,
  FmdGood,
  BarChart,
  PhoneAndroid,
} from '@mui/icons-material';

const Features: React.FC = () => {
  const features = [
    {
      icon: <LocationOn />,
      title: 'Real-time Vehicle Tracking',
      description: 'Monitor your entire fleet in real-time with GPS precision and instant location updates.',
    },
    {
      icon: <Map />,
      title: 'Live Map View',
      description: 'Interactive map displaying all vehicles with status indicators, routes, and geofences.',
    },
    {
      icon: <Notifications />,
      title: 'UAE Fine Integration',
      description: 'Automatic fine detection and alerts for Dubai, Abu Dhabi, and all UAE traffic violations.',
    },
    {
      icon: <People />,
      title: 'Driver Management',
      description: 'Complete driver profiles, performance tracking, license management, and payroll integration.',
    },
    {
      icon: <History />,
      title: 'Trip History & Playback',
      description: 'Detailed trip logs with route playback, stops, speed analysis, and timeline visualization.',
    },
    {
      icon: <Build />,
      title: 'Maintenance Reminders',
      description: 'Automated alerts for scheduled maintenance, inspections, and vehicle service requirements.',
    },
    {
      icon: <LocalGasStation />,
      title: 'Fuel Monitoring',
      description: 'Track fuel consumption, detect anomalies, and optimize fuel efficiency across your fleet.',
    },
    {
      icon: <FmdGood />,
      title: 'Geofencing',
      description: 'Create virtual boundaries and receive alerts when vehicles enter or exit designated zones.',
    },
    {
      icon: <BarChart />,
      title: 'Reports & Analytics',
      description: 'Comprehensive dashboard with insights, trends, and customizable reports for data-driven decisions.',
    },
    {
      icon: <PhoneAndroid />,
      title: 'Mobile PWA Support',
      description: 'Access your fleet from any device with our progressive web app — works offline too.',
    },
  ];

  return (
    <Box
      id="features"
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
            Everything you need to
            <br />
            manage your fleet
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
            A complete suite of powerful features designed specifically
            for UAE transport and logistics companies
          </Typography>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  bgcolor: 'white',
                  border: '1px solid #e5e5e7',
                  borderRadius: '18px',
                  boxShadow: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    '& .feature-icon': {
                      bgcolor: '#0071e3',
                      color: 'white',
                    },
                  },
                }}
              >
                {/* Icon */}
                <Box
                  className="feature-icon"
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '14px',
                    bgcolor: '#f5f5f7',
                    color: '#1d1d1f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    transition: 'all 0.2s ease',
                    '& svg': {
                      fontSize: 28,
                    },
                  }}
                >
                  {feature.icon}
                </Box>

                {/* Title */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#1d1d1f',
                    mb: 1.5,
                    fontSize: '1.1rem',
                  }}
                >
                  {feature.title}
                </Typography>

                {/* Description */}
                <Typography
                  sx={{
                    fontSize: '0.95rem',
                    color: '#6e6e73',
                    lineHeight: 1.5,
                  }}
                >
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Features;
