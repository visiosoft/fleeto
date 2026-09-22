import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalAirportIcon from '@mui/icons-material/LocalAirport';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SchoolIcon from '@mui/icons-material/School';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import Reveal from './Reveal';
import { COLORS, FONT_DISPLAY, FONT_BODY, RADIUS } from './theme';

const verticals = [
  { icon: <ConstructionIcon />, title: 'Construction', description: 'Heavy equipment and site vehicles tracked for maximum uptime.' },
  { icon: <DeleteIcon />, title: 'Waste management', description: 'Route optimization and pickup compliance for collection fleets.' },
  { icon: <LocalAirportIcon />, title: 'Airports', description: 'Airside vehicles and ground support equipment, monitored live.' },
  { icon: <LocalFireDepartmentIcon />, title: 'Emergency response', description: 'Ambulances and fire trucks with real-time dispatch visibility.' },
  { icon: <LocalShippingIcon />, title: 'Delivery & logistics', description: 'Last-mile routing and proof of delivery for courier fleets.' },
  { icon: <RestaurantIcon />, title: 'Food & beverage', description: 'Temperature and delivery tracking for F&B distribution.' },
  { icon: <SchoolIcon />, title: 'School transport', description: 'Student safety tracking with parent notifications.' },
  { icon: <DirectionsBusIcon />, title: 'Public transit', description: 'Schedule adherence and passenger safety for city fleets.' },
];

const IndustryVerticals: React.FC = () => {
  return (
    <Box id="industry-verticals" sx={{ py: { xs: 8, md: 12 }, bgcolor: COLORS.surface }}>
      <Container maxWidth="lg">
        <Reveal>
          <Box sx={{ maxWidth: 560, mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.9rem', md: '2.4rem' },
                fontWeight: 700,
                fontFamily: FONT_DISPLAY,
                color: COLORS.ink,
                mb: 1.5,
                letterSpacing: '-0.015em',
              }}
            >
              Built for every kind of fleet
            </Typography>
            <Typography sx={{ fontSize: '1.05rem', color: COLORS.body, lineHeight: 1.6, fontFamily: FONT_BODY }}>
              From construction sites to school runs, FleetOZ adapts to how your vehicles actually work.
            </Typography>
          </Box>
        </Reveal>
      </Container>

      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, lg: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2.5,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            pb: 2,
            px: { xs: 2, lg: 0 },
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.border, borderRadius: RADIUS.pill },
          }}
        >
          {verticals.map((vertical) => (
            <Box
              key={vertical.title}
              sx={{
                flex: '0 0 auto',
                scrollSnapAlign: 'start',
                width: { xs: 240, md: 260 },
                p: 3.5,
                borderRadius: RADIUS.md,
                border: `1px solid ${COLORS.border}`,
                bgcolor: COLORS.surfaceAlt,
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                '&:hover': { transform: 'translateY(-3px)', borderColor: COLORS.accent },
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: RADIUS.sm,
                  bgcolor: COLORS.accentSoft,
                  color: COLORS.accentDark,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2.5,
                  '& svg': { fontSize: 24 },
                }}
              >
                {vertical.icon}
              </Box>
              <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 1, fontSize: '1.02rem', fontFamily: FONT_DISPLAY }}>
                {vertical.title}
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: COLORS.body, lineHeight: 1.55, fontFamily: FONT_BODY }}>
                {vertical.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default IndustryVerticals;
