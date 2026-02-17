import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      id="hero"
      sx={{
        position: 'relative',
        pt: { xs: 14, md: 20 },
        pb: { xs: 12, md: 16 },
        bgcolor: '#ffffff',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(50, 139, 155, 0.15) 0%, transparent 60%)',
          animation: 'pulse 8s ease-in-out infinite',
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 0.3 },
          '50%': { opacity: 0.6 },
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            maxWidth: 900,
            mx: 'auto',
            textAlign: 'center',
            color: 'white',
          }}
        >
          {/* Badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: '#f5f5f7',
              px: 3,
              py: 1,
              borderRadius: '50px',
              border: '1px solid #e5e5e7',
              mb: 4,
              animation: 'fadeInUp 0.6s ease-out',
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 20 }} />
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#1d1d1f',
                letterSpacing: '0.3px',
              }}
            >
              Trusted by 500+ UAE Transport Companies
            </Typography>
          </Box>

          {/* Main Headline */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem' },
              fontWeight: 600,
              lineHeight: 1.08,
              mb: 3,
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              color: '#1d1d1f',
              letterSpacing: '-0.015em',
              animation: 'fadeInUp 0.8s ease-out 0.2s both',
            }}
          >
            Smart Fleet Management
            <br />
            for UAE Businesses
          </Typography>

          {/* Subheadline */}
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1.15rem', md: '1.4rem' },
              lineHeight: 1.5,
              mb: 6,
              color: '#6e6e73',
              maxWidth: 700,
              mx: 'auto',
              fontWeight: 400,
              fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
              animation: 'fadeInUp 1s ease-out 0.4s both',
            }}
          >
            Real-time GPS tracking, automated fine monitoring, driver management,
            and complete fleet control — all in one powerful platform.
          </Typography>

          {/* CTA Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{
              animation: 'fadeInUp 1.2s ease-out 0.6s both',
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: '#0071e3',
                color: 'white',
                fontWeight: 500,
                fontSize: '1.1rem',
                px: 5,
                py: 1.8,
                borderRadius: '980px',
                textTransform: 'none',
                fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#0077ed',
                  boxShadow: 'none',
                },
                transition: 'background-color 0.2s ease',
              }}
            >
              Start free trial
            </Button>
            <Button
              variant="text"
              size="large"
              sx={{
                color: '#0071e3',
                fontWeight: 500,
                fontSize: '1.1rem',
                px: 5,
                py: 1.8,
                textTransform: 'none',
                fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
                '&:hover': {
                  bgcolor: 'rgba(0, 113, 227, 0.04)',
                },
                transition: 'background-color 0.2s ease',
              }}
            >
              View demo
            </Button>
          </Stack>

          {/* Trust Indicators */}
          <Box
            sx={{
              mt: 8,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: { xs: 3, md: 6 },
              opacity: 0.85,
              animation: 'fadeInUp 1.4s ease-out 0.8s both',
            }}
          >
            {[
              { number: '10,000+', label: 'Vehicles Tracked' },
              { number: '500+', label: 'Active Companies' },
              { number: '99.9%', label: 'Uptime' },
            ].map((stat, index) => (
              <Box key={index} sx={{ textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontSize: { xs: '1.8rem', md: '2.2rem' },
                    fontWeight: 600,
                    mb: 0.5,
                    color: '#1d1d1f',
                  }}
                >
                  {stat.number}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.9rem',
                    color: '#6e6e73',
                    fontWeight: 400,
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      {/* Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '150px',
          background: 'linear-gradient(to top, rgba(255,255,255,0.05) 0%, transparent 100%)',
        }}
      />

      {/* Keyframes */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default Hero;
