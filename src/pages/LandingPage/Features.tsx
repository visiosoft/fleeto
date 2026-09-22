import React from 'react';
import { Box, Container, Typography, Chip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GavelIcon from '@mui/icons-material/Gavel';
import PeopleIcon from '@mui/icons-material/People';
import BuildIcon from '@mui/icons-material/Build';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import BarChartIcon from '@mui/icons-material/BarChart';
import Reveal from './Reveal';
import { COLORS, FONT_DISPLAY, FONT_BODY, RADIUS } from './theme';

const featured = [
  {
    icon: <LocationOnIcon sx={{ fontSize: 30 }} />,
    title: 'Real-time vehicle tracking',
    description: 'GPS precision with instant location updates across your entire fleet, on one live map.',
    span: { xs: '1 / -1', md: 'span 2' },
    rows: { md: 'span 2' },
    tinted: true,
  },
  {
    icon: <GavelIcon sx={{ fontSize: 26 }} />,
    title: 'Automated UAE fine alerts',
    description: 'Dubai, Abu Dhabi, and MOI violations flagged and assigned to the responsible driver automatically.',
    span: { xs: '1 / -1', md: 'span 2' },
  },
  {
    icon: <PeopleIcon sx={{ fontSize: 26 }} />,
    title: 'Driver management',
    description: 'License tracking, performance history, and payroll in one profile.',
    span: { xs: '1 / -1', sm: 'span 1' },
  },
  {
    icon: <BuildIcon sx={{ fontSize: 26 }} />,
    title: 'Maintenance reminders',
    description: 'Service schedules and inspection alerts before they become downtime.',
    span: { xs: '1 / -1', sm: 'span 1' },
  },
  {
    icon: <LocalGasStationIcon sx={{ fontSize: 26 }} />,
    title: 'Fuel monitoring',
    description: 'Track consumption and catch anomalies before they eat into margins.',
    span: { xs: '1 / -1', md: 'span 2' },
  },
  {
    icon: <BarChartIcon sx={{ fontSize: 26 }} />,
    title: 'Reports & analytics',
    description: 'Customizable dashboards that turn fleet activity into decisions.',
    span: { xs: '1 / -1', md: 'span 2' },
  },
];

const alsoIncluded = ['Live map view', 'Trip history & playback', 'Geofencing', 'Mobile PWA, works offline'];

const Features: React.FC = () => {
  return (
    <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: COLORS.surfaceAlt }}>
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
              Everything you need to run the fleet, nothing you don't
            </Typography>
            <Typography sx={{ fontSize: '1.05rem', color: COLORS.body, lineHeight: 1.6, fontFamily: FONT_BODY }}>
              Built for UAE transport and logistics teams who need answers, not another dashboard to babysit.
            </Typography>
          </Box>
        </Reveal>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gridAutoRows: { xs: 'auto', md: 'minmax(160px, auto)' },
            gridAutoFlow: 'dense',
            gap: 3,
          }}
        >
          {featured.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.05} sx={{ gridColumn: feature.span, gridRow: feature.rows }}>
              <Box
                sx={{
                  height: '100%',
                  p: 4,
                  borderRadius: RADIUS.lg,
                  border: `1px solid ${feature.tinted ? 'transparent' : COLORS.border}`,
                  bgcolor: feature.tinted ? COLORS.ink : COLORS.surface,
                  color: feature.tinted ? '#fff' : COLORS.ink,
                  backgroundImage: feature.tinted
                    ? `radial-gradient(circle at 20% 20%, ${COLORS.accent} 0%, ${COLORS.ink} 65%)`
                    : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: feature.tinted ? '0 20px 48px rgba(11,36,54,0.35)' : '0 12px 32px rgba(11,36,54,0.08)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: RADIUS.sm,
                    bgcolor: feature.tinted ? 'rgba(255,255,255,0.14)' : COLORS.accentSoft,
                    color: feature.tinted ? '#fff' : COLORS.accentDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  {feature.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: feature.tinted ? '1.35rem' : '1.1rem', mb: 1, fontFamily: FONT_DISPLAY }}>
                    {feature.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      color: feature.tinted ? 'rgba(255,255,255,0.78)' : COLORS.body,
                      fontFamily: FONT_BODY,
                      maxWidth: feature.tinted ? 340 : 'none',
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>

        <Reveal delay={0.2}>
          <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.9rem', color: COLORS.body, fontWeight: 600, fontFamily: FONT_BODY, mr: 0.5 }}>
              Also included:
            </Typography>
            {alsoIncluded.map((item) => (
              <Chip
                key={item}
                label={item}
                sx={{
                  bgcolor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.ink,
                  fontFamily: FONT_BODY,
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
};

export default Features;
