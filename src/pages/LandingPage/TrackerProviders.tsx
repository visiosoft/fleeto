import React, { useEffect, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import Reveal from './Reveal';
import { COLORS, FONT_DISPLAY, FONT_BODY, RADIUS } from './theme';

const providers = [
  { name: 'Teltonika', mark: 'TL' },
  { name: 'Ruptela', mark: 'RP' },
  { name: 'Jimi IoT', mark: 'JI' },
  { name: 'Queclink', mark: 'QL' },
  { name: 'GeoTrack', mark: 'GT' },
  { name: 'Concox', mark: 'CX' },
];

const TrackerProviders: React.FC = () => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const track = [...providers, ...providers];

  return (
    <Box id="trackers" sx={{ py: { xs: 8, md: 10 }, bgcolor: COLORS.surface }}>
      <Container maxWidth="lg">
        <Reveal>
          <Box sx={{ textAlign: 'left', mb: 6, maxWidth: 560 }}>
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
              Works with the hardware you already run
            </Typography>
            <Typography sx={{ fontSize: '1.05rem', color: COLORS.body, lineHeight: 1.6, fontFamily: FONT_BODY }}>
              FleetOZ connects to 50+ GPS tracker brands, so switching software doesn't mean replacing your fleet's hardware.
            </Typography>
          </Box>
        </Reveal>
      </Container>

      {/* Marquee - the single auto-scrolling moment on this page */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            width: 'max-content',
            gap: 3,
            px: 3,
            animation: reduceMotion ? 'none' : 'marquee 28s linear infinite',
            '@keyframes marquee': {
              from: { transform: 'translateX(0)' },
              to: { transform: 'translateX(-50%)' },
            },
          }}
        >
          {track.map((provider, index) => (
            <Box
              key={`${provider.name}-${index}`}
              sx={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 3,
                py: 2,
                bgcolor: COLORS.surfaceAlt,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.md,
                minWidth: 220,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: RADIUS.sm,
                  bgcolor: COLORS.accentSoft,
                  color: COLORS.accentDark,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  flexShrink: 0,
                }}
              >
                {provider.mark}
              </Box>
              <Typography sx={{ fontWeight: 600, color: COLORS.ink, fontFamily: FONT_BODY, fontSize: '0.98rem' }}>
                {provider.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Container maxWidth="lg">
        <Reveal>
          <Typography sx={{ mt: 5, fontSize: '0.95rem', color: COLORS.body, fontFamily: FONT_BODY }}>
            Don't see your provider?{' '}
            <Box
              component="button"
              onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
              sx={{
                border: 'none',
                background: 'none',
                p: 0,
                color: COLORS.accent,
                fontWeight: 600,
                fontFamily: FONT_BODY,
                fontSize: '0.95rem',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Ask us to add it
            </Box>
            .
          </Typography>
        </Reveal>
      </Container>
    </Box>
  );
};

export default TrackerProviders;
