import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const CTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        py: { xs: 10, md: 14 },
        bgcolor: '#f5f5f7',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', color: '#1d1d1f' }}>
          {/* Main Heading */}
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 600,
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              lineHeight: 1.1,
              mb: 3,
              color: '#1d1d1f',
              letterSpacing: '-0.015em',
            }}
          >
            Start managing your fleet
            <br />
            smarter today
          </Typography>

          {/* Subheading */}
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              color: '#6e6e73',
              mb: 5,
              maxWidth: 600,
              mx: 'auto',
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Join hundreds of UAE transport companies saving time and money
            with FleetOZ's intelligent fleet management platform
          </Typography>

          {/* Benefits List */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            justifyContent="center"
            sx={{ mb: 6 }}
          >
            {[
              'Free 14-day trial',
              'No credit card required',
              'Cancel anytime',
            ].map((benefit, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 24 }} />
                <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>
                  {benefit}
                </Typography>
              </Box>
            ))}
          </Stack>

          {/* CTA Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: '#0071e3',
                color: 'white',
                fontWeight: 500,
                fontSize: '1.15rem',
                px: 6,
                py: 2,
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
              Get started free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                const contactSection = document.querySelector('#contact');
                contactSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 600,
                fontSize: '1.15rem',
                px: 6,
                py: 2.5,
                borderRadius: '12px',
                textTransform: 'none',
                backdropFilter: 'blur(10px)',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'translateY(-3px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Contact Sales
            </Button>
          </Stack>

          {/* Trust Note */}
          <Typography
            sx={{
              fontSize: '0.9rem',
              opacity: 0.8,
              fontStyle: 'italic',
            }}
          >
            Trusted by 500+ companies across Dubai, Abu Dhabi, and the UAE
          </Typography>
        </Box>
      </Container>

      {/* Decorative gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.1) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

export default CTA;
