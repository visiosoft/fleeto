import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Reveal from './Reveal';
import { COLORS, FONT_DISPLAY, FONT_BODY, RADIUS } from './theme';

const CTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: COLORS.surfaceAlt }}>
      <Container maxWidth="md">
        <Reveal>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2.2rem', md: '3rem' },
                fontWeight: 700,
                fontFamily: FONT_DISPLAY,
                lineHeight: 1.15,
                mb: 3,
                color: COLORS.ink,
                letterSpacing: '-0.015em',
              }}
            >
              Start managing your fleet smarter today
            </Typography>

            <Typography sx={{ fontSize: { xs: '1.05rem', md: '1.2rem' }, color: COLORS.body, mb: 5, maxWidth: 560, mx: 'auto', lineHeight: 1.6, fontFamily: FONT_BODY }}>
              Join UAE transport companies saving time and money with FleetOZ's fleet management platform.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" sx={{ mb: 5 }}>
              {['Free 14-day trial', 'No credit card required', 'Cancel anytime'].map((benefit) => (
                <Box key={benefit} sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                  <CheckCircleIcon sx={{ fontSize: 22, color: COLORS.accent }} />
                  <Typography sx={{ fontSize: '0.98rem', fontWeight: 500, color: COLORS.ink, fontFamily: FONT_BODY }}>
                    {benefit}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} justifyContent="center" sx={{ mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: COLORS.accent,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  px: 5,
                  py: 1.7,
                  borderRadius: RADIUS.pill,
                  textTransform: 'none',
                  fontFamily: FONT_BODY,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: COLORS.accentDark, boxShadow: 'none' },
                }}
              >
                Start free trial
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
                sx={{
                  color: COLORS.ink,
                  borderColor: COLORS.borderStrong,
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  px: 5,
                  py: 1.7,
                  borderRadius: RADIUS.pill,
                  textTransform: 'none',
                  fontFamily: FONT_BODY,
                  '&:hover': { borderColor: COLORS.accent, bgcolor: COLORS.accentSoft },
                }}
              >
                Book a demo
              </Button>
            </Stack>

            <Typography sx={{ fontSize: '0.9rem', color: COLORS.body, fontFamily: FONT_BODY }}>
              Trusted by 500+ companies across Dubai, Abu Dhabi, and the UAE
            </Typography>
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
};

export default CTA;
