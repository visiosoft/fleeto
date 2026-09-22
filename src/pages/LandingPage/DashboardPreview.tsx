import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Reveal from './Reveal';
import { COLORS, FONT_DISPLAY, FONT_BODY, RADIUS } from './theme';

const stats = [
  { icon: <DirectionsCarIcon />, value: '248', label: 'Active vehicles' },
  { icon: <SpeedIcon />, value: '187', label: 'On the move' },
  { icon: <CheckCircleIcon />, value: '61', label: 'Parked' },
  { icon: <WarningAmberIcon />, value: '3', label: 'Alerts' },
];

const DashboardPreview: React.FC = () => {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: COLORS.ink, color: '#fff' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '0.85fr 1.15fr' },
            gap: { xs: 5, md: 6 },
            alignItems: 'center',
            mb: 7,
          }}
        >
          <Reveal>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.9rem', md: '2.4rem' },
                fontWeight: 700,
                fontFamily: FONT_DISPLAY,
                mb: 2,
                letterSpacing: '-0.015em',
              }}
            >
              One dashboard, live all day
            </Typography>
            <Typography sx={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.65, fontFamily: FONT_BODY }}>
              Fleet status refreshes every 30 seconds, so the number on screen is the number on the road.
            </Typography>
          </Reveal>

          <Reveal delay={0.1}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: { xs: 3, md: 4 },
                borderTop: '1px solid rgba(255,255,255,0.14)',
                pt: 3,
              }}
            >
              {stats.map((stat) => (
                <Box key={stat.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 130 }}>
                  <Box sx={{ color: COLORS.accent, display: 'flex' }}>{stat.icon}</Box>
                  <Box>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: FONT_BODY }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Reveal>
        </Box>

        <Reveal delay={0.15}>
          <Box
            sx={{
              position: 'relative',
              borderRadius: RADIUS.lg,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
            }}
          >
            <Box component="img" src="/images/dash.png" alt="FleetOZ dashboard interface" sx={{ width: '100%', display: 'block' }} />
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
};

export default DashboardPreview;
