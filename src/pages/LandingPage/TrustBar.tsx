import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import Reveal from './Reveal';
import { COLORS, FONT_DISPLAY, FONT_BODY } from './theme';

const stats = [
  { number: '10,000+', label: 'Vehicles tracked' },
  { number: '500+', label: 'Active companies' },
  { number: '99.9%', label: 'Platform uptime' },
];

const TrustBar: React.FC = () => {
  return (
    <Box sx={{ bgcolor: COLORS.surfaceAlt, borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
      <Container maxWidth="lg">
        <Reveal>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', md: 'space-between' },
              gap: { xs: 4, md: 3 },
              py: { xs: 4, md: 3.5 },
            }}
          >
            {stats.map((stat) => (
              <Box key={stat.label} sx={{ display: 'flex', alignItems: 'baseline', gap: 1.25 }}>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.ink, fontFamily: FONT_DISPLAY }}>
                  {stat.number}
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', color: COLORS.body, fontFamily: FONT_BODY }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
};

export default TrustBar;
