import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import Reveal from './Reveal';
import { COLORS, FONT_DISPLAY, FONT_BODY, RADIUS } from './theme';

const benefits = [
  {
    icon: <TrendingDownIcon />,
    title: 'Lower operational costs',
    description: 'Cut fuel spend, optimize routes, and reduce idle time and unauthorized vehicle use.',
  },
  {
    icon: <TrendingUpIcon />,
    title: 'Better driver performance',
    description: 'Track behavior and speed violations to reduce accidents and reward safe driving.',
  },
  {
    icon: <VisibilityIcon />,
    title: 'Full fleet visibility',
    description: 'Live location, complete trip history, and geofencing alerts around the clock.',
  },
  {
    icon: <NotificationsActiveIcon />,
    title: 'Automated fine monitoring',
    description: 'Instant UAE traffic fine notifications, routed to the responsible driver.',
  },
  {
    icon: <BusinessCenterIcon />,
    title: 'Sharper business control',
    description: 'Reports, maintenance scheduling, and fleet data in one place, not five spreadsheets.',
    full: true,
  },
];

const roiStats = [
  { value: '25%', label: 'Fuel cost reduction' },
  { value: '40%', label: 'Less idle time' },
  { value: '60%', label: 'Faster fine resolution' },
];

const Benefits: React.FC = () => {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: COLORS.surface }}>
      <Container maxWidth="lg">
        <Reveal>
          <Box sx={{ maxWidth: 620, mb: 7 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', md: '2.6rem' },
                fontWeight: 700,
                fontFamily: FONT_DISPLAY,
                color: COLORS.ink,
                mb: 2,
                letterSpacing: '-0.015em',
              }}
            >
              What changes once you switch
            </Typography>
            <Typography sx={{ fontSize: '1.05rem', color: COLORS.body, lineHeight: 1.6, fontFamily: FONT_BODY }}>
              Real outcomes UAE operators report after moving their fleet onto FleetOZ.
            </Typography>
          </Box>
        </Reveal>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
          }}
        >
          {benefits.map((benefit, index) => (
            <Reveal key={benefit.title} delay={index * 0.05} sx={{ gridColumn: benefit.full ? { md: '1 / -1' } : 'auto' }}>
              <Box
                sx={{
                  height: '100%',
                  p: 4,
                  borderRadius: RADIUS.lg,
                  border: `1px solid ${COLORS.border}`,
                  bgcolor: COLORS.surfaceAlt,
                  display: 'flex',
                  gap: 3,
                  alignItems: 'flex-start',
                  transition: 'transform 0.25s ease, border-color 0.25s ease',
                  '&:hover': { transform: 'translateY(-4px)', borderColor: COLORS.accent },
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: RADIUS.sm,
                    bgcolor: COLORS.accentSoft,
                    color: COLORS.accentDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    '& svg': { fontSize: 28 },
                  }}
                >
                  {benefit.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 1, fontSize: '1.15rem', fontFamily: FONT_DISPLAY }}>
                    {benefit.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.98rem', color: COLORS.body, lineHeight: 1.65, fontFamily: FONT_BODY }}>
                    {benefit.description}
                  </Typography>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>

        {/* ROI strip - light, matching the page theme */}
        <Reveal delay={0.2}>
          <Box
            sx={{
              mt: 5,
              p: { xs: 4, md: 6 },
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.lg,
              bgcolor: COLORS.accentSoft,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontFamily: FONT_DISPLAY, color: COLORS.ink, mb: 4, fontSize: { xs: '1.3rem', md: '1.6rem' } }}>
              Average return in the first 6 months
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 4 }}>
              {roiStats.map((stat) => (
                <Box key={stat.label}>
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: '2.2rem', md: '2.6rem' }, color: COLORS.accentDark, fontFamily: FONT_DISPLAY, mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.98rem', color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
};

export default Benefits;
