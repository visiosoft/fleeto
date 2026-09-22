import React from 'react';
import { Box, Container, Grid, Typography, Link, Stack, IconButton } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import { COLORS, FONT_DISPLAY, FONT_BODY } from './theme';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'GPS trackers', href: '#trackers' },
    { label: 'Integrations', href: '#integrations' },
  ],
  company: [
    { label: 'About us', href: '#about' },
    { label: 'Careers', href: '#careers' },
    { label: 'Contact', href: '#contact' },
  ],
  support: [
    { label: 'Help center', href: '#help' },
    { label: 'Documentation', href: '#docs' },
    { label: 'API reference', href: '#api' },
  ],
  legal: [
    { label: 'Privacy policy', href: '#privacy' },
    { label: 'Terms of service', href: '#terms' },
    { label: 'Security', href: '#security' },
  ],
};

const Footer: React.FC = () => {
  const scrollToSection = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const linkSx = {
    color: COLORS.body,
    textDecoration: 'none',
    fontSize: '0.95rem',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontFamily: FONT_BODY,
    transition: 'color 0.2s ease',
    '&:hover': { color: COLORS.accent },
  };

  return (
    <Box id="contact" component="footer" sx={{ bgcolor: COLORS.surfaceAlt, color: COLORS.ink, pt: { xs: 8, md: 10 }, pb: 4, borderTop: `1px solid ${COLORS.border}` }}>
      <Container maxWidth="lg">
        <Grid container spacing={6}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <Box component="img" src="/images/van-logo.svg" alt="FleetOZ" sx={{ width: 36, height: 36, mr: 1.25 }} />
              <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', color: COLORS.ink, fontFamily: FONT_DISPLAY }}>
                FleetOZ
              </Typography>
            </Box>
            <Typography sx={{ mb: 3, color: COLORS.body, lineHeight: 1.6, fontSize: '0.92rem', fontFamily: FONT_BODY }}>
              Smart fleet management for UAE transport companies. Track, manage, and optimize fleet operations with ease.
            </Typography>

            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon sx={{ fontSize: 20, color: COLORS.body }} />
                <Typography sx={{ fontSize: '0.92rem', color: COLORS.ink, fontFamily: FONT_BODY }}>info@fleetoz.com</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon sx={{ fontSize: 20, color: COLORS.body }} />
                <Typography sx={{ fontSize: '0.92rem', color: COLORS.ink, fontFamily: FONT_BODY }}>+971 56 942 0950</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocationOnIcon sx={{ fontSize: 20, color: COLORS.body }} />
                <Typography sx={{ fontSize: '0.92rem', color: COLORS.ink, fontFamily: FONT_BODY }}>Dubai, United Arab Emirates</Typography>
              </Box>
            </Stack>
          </Grid>

          {([
            ['Product', footerLinks.product],
            ['Company', footerLinks.company],
            ['Support', footerLinks.support],
            ['Legal', footerLinks.legal],
          ] as const).map(([heading, links]) => (
            <Grid item xs={6} sm={6} md={2} key={heading}>
              <Typography sx={{ fontWeight: 700, mb: 2.5, fontSize: '1rem', color: COLORS.ink, fontFamily: FONT_DISPLAY }}>
                {heading}
              </Typography>
              <Stack spacing={1.4}>
                {links.map((link) => (
                  <Link key={link.label} component="button" onClick={() => scrollToSection(link.href)} sx={linkSx}>
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            borderTop: `1px solid ${COLORS.border}`,
            mt: 8,
            pt: 4,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography sx={{ fontSize: '0.9rem', color: COLORS.body, fontFamily: FONT_BODY, textAlign: { xs: 'center', md: 'left' } }}>
            © {new Date().getFullYear()} FleetOZ. All rights reserved.
          </Typography>

          <Stack direction="row" spacing={1}>
            {[
              { icon: <FacebookIcon fontSize="small" />, label: 'Facebook' },
              { icon: <TwitterIcon fontSize="small" />, label: 'Twitter' },
              { icon: <LinkedInIcon fontSize="small" />, label: 'LinkedIn' },
              { icon: <InstagramIcon fontSize="small" />, label: 'Instagram' },
            ].map((social) => (
              <IconButton
                key={social.label}
                aria-label={social.label}
                sx={{
                  color: COLORS.ink,
                  bgcolor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  transition: 'all 0.2s ease',
                  '&:hover': { color: '#fff', bgcolor: COLORS.accent, borderColor: COLORS.accent },
                }}
              >
                {social.icon}
              </IconButton>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
