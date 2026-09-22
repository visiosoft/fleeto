import React, { useState } from 'react';
import { Box, Container, Typography, Collapse } from '@mui/material';
import RouterIcon from '@mui/icons-material/Router';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ApiIcon from '@mui/icons-material/Api';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Reveal from './Reveal';
import { COLORS, FONT_DISPLAY, FONT_BODY, RADIUS } from './theme';

const integrations = [
  {
    icon: <RouterIcon />,
    title: 'GPS tracker providers',
    description: 'Seamless integration with 50+ GPS tracking hardware providers, including Teltonika, Ruptela, Jimi IoT, and Queclink.',
    items: ['Real-time data sync', 'Multiple device support', 'Automatic device detection', 'Custom protocol support'],
  },
  {
    icon: <AccountBalanceIcon />,
    title: 'UAE government systems',
    description: 'Direct integration with UAE traffic fine systems for automated detection and monitoring across all emirates.',
    items: ['Dubai Police integration', 'Abu Dhabi Police integration', 'MOI fine system', 'Automated fine updates'],
  },
  {
    icon: <PhoneIphoneIcon />,
    title: 'Mobile applications',
    description: 'A progressive web app that works across devices, with offline capability and push notifications.',
    items: ['iOS & Android compatible', 'Offline mode support', 'Push notifications', 'Real-time tracking on mobile'],
  },
  {
    icon: <ApiIcon />,
    title: 'Developer API',
    description: 'A RESTful API for custom integrations with your existing business systems.',
    items: ['Complete REST API', 'Webhook support', 'API documentation', 'Custom integrations'],
  },
];

const Integrations: React.FC = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <Box id="integrations" sx={{ py: { xs: 8, md: 12 }, bgcolor: COLORS.surfaceAlt }}>
      <Container maxWidth="md">
        <Reveal>
          <Box sx={{ mb: 6 }}>
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
              Connects to what you already use
            </Typography>
            <Typography sx={{ fontSize: '1.05rem', color: COLORS.body, lineHeight: 1.6, fontFamily: FONT_BODY }}>
              FleetOZ plugs into your hardware, government fine systems, and internal tools.
            </Typography>
          </Box>
        </Reveal>

        <Box sx={{ borderTop: `1px solid ${COLORS.border}` }}>
          {integrations.map((integration, index) => {
            const open = openIndex === index;
            return (
              <Reveal key={integration.title} delay={index * 0.04}>
                <Box sx={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <Box
                    onClick={() => setOpenIndex(open ? -1 : index)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      py: 3,
                      cursor: 'pointer',
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: RADIUS.sm,
                        bgcolor: COLORS.accentSoft,
                        color: COLORS.accentDark,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {integration.icon}
                    </Box>
                    <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '1.15rem', color: COLORS.ink, fontFamily: FONT_DISPLAY }}>
                      {integration.title}
                    </Typography>
                    <ExpandMoreIcon
                      sx={{
                        color: COLORS.body,
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                      }}
                    />
                  </Box>
                  <Collapse in={open}>
                    <Box sx={{ pb: 4, pl: { xs: 0, sm: '72px' }, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr' }, gap: 3 }}>
                      <Typography sx={{ fontSize: '1rem', color: COLORS.body, lineHeight: 1.7, fontFamily: FONT_BODY }}>
                        {integration.description}
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                        {integration.items.map((item) => (
                          <Box
                            component="li"
                            key={item}
                            sx={{ fontSize: '0.95rem', color: COLORS.ink, mb: 1, lineHeight: 1.5, fontFamily: FONT_BODY, '&::marker': { color: COLORS.accent } }}
                          >
                            {item}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Collapse>
                </Box>
              </Reveal>
            );
          })}
        </Box>

        <Reveal delay={0.15}>
          <Box sx={{ mt: 6, p: { xs: 4, md: 5 }, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 1.5, fontSize: { xs: '1.3rem', md: '1.5rem' }, fontFamily: FONT_DISPLAY }}>
              Need a custom integration?
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: COLORS.body, mb: 3, maxWidth: 480, mx: 'auto', fontFamily: FONT_BODY }}>
              Our integration team can connect FleetOZ to systems not listed here.
            </Typography>
            <Box
              component="button"
              onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
              sx={{
                display: 'inline-block',
                px: 4,
                py: 1.6,
                bgcolor: COLORS.accent,
                color: '#fff',
                border: 'none',
                borderRadius: RADIUS.pill,
                fontWeight: 600,
                fontSize: '0.98rem',
                fontFamily: FONT_BODY,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                '&:hover': { bgcolor: COLORS.accentDark },
              }}
            >
              Talk to the integration team
            </Box>
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
};

export default Integrations;
