import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';

const TrackerProviders: React.FC = () => {
  const providers = [
    {
      name: 'Teltonika',
      description: 'Industry-leading GPS tracking',
      logo: '🛰️',
    },
    {
      name: 'Ruptela',
      description: 'Advanced telematics solutions',
      logo: '📡',
    },
    {
      name: 'Jimi IoT',
      description: 'Smart IoT tracking devices',
      logo: '📍',
    },
    {
      name: 'Queclink',
      description: 'Global tracking technology',
      logo: '🌐',
    },
    {
      name: 'GeoTrack',
      description: 'Real-time location services',
      logo: '🗺️',
    },
    {
      name: 'UAE GPS Providers',
      description: 'Local GPS integrations',
      logo: '🇦🇪',
    },
  ];

  return (
    <Box
      id="trackers"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#ffffff',
        position: 'relative',
      }}
    >
      <Container maxWidth="lg">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: '#e8f4f8',
              color: '#0B3C5D',
              px: 3,
              py: 1,
              borderRadius: '50px',
              mb: 3,
            }}
          >
            <VerifiedIcon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Trusted Integrations
            </Typography>
          </Box>
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
            Compatible with leading
            <br />
            GPS tracker providers
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1rem', md: '1.2rem' },
              color: '#6e6e73',
              maxWidth: 700,
              mx: 'auto',
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Seamlessly integrate with your existing GPS hardware from
            top-tier providers across the UAE and globally
          </Typography>
        </Box>

        {/* Providers Grid */}
        <Grid container spacing={3}>
          {providers.map((provider, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  bgcolor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(11, 60, 93, 0.12)',
                    borderColor: '#328B9B',
                  },
                }}
              >
                {/* Logo */}
                <Box
                  sx={{
                    fontSize: '4rem',
                    mb: 2,
                    width: 100,
                    height: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f1f5f9',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {provider.logo}
                </Box>

                {/* Provider Name */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#0B3C5D',
                    mb: 1,
                    fontSize: '1.2rem',
                  }}
                >
                  {provider.name}
                </Typography>

                {/* Description */}
                <Typography
                  sx={{
                    fontSize: '0.95rem',
                    color: '#64748b',
                    lineHeight: 1.6,
                  }}
                >
                  {provider.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Bottom Note */}
        <Box
          sx={{
            mt: 8,
            textAlign: 'center',
            p: 4,
            bgcolor: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }}
        >
          <Typography
            sx={{
              fontSize: '1.1rem',
              color: '#0B3C5D',
              fontWeight: 600,
              mb: 1,
            }}
          >
            Don't see your GPS provider?
          </Typography>
          <Typography sx={{ fontSize: '1rem', color: '#64748b' }}>
            We integrate with 50+ GPS tracking providers worldwide.{' '}
            <Box
              component="span"
              sx={{
                color: '#328B9B',
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Contact us
            </Box>{' '}
            to add yours.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default TrackerProviders;
