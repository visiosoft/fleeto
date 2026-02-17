import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Grid, Typography, Link, Stack, IconButton } from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
} from '@mui/icons-material';

const Footer: React.FC = () => {
  const navigate = useNavigate();

  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'GPS Trackers', href: '#trackers' },
      { label: 'Integrations', href: '#integrations' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Mobile App', href: '#mobile' },
    ],
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Careers', href: '#careers' },
      { label: 'Blog', href: '#blog' },
      { label: 'News', href: '#news' },
      { label: 'Contact', href: '#contact' },
    ],
    support: [
      { label: 'Help Center', href: '#help' },
      { label: 'Documentation', href: '#docs' },
      { label: 'API Reference', href: '#api' },
      { label: 'System Status', href: '#status' },
      { label: 'FAQ', href: '#faq' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Cookie Policy', href: '#cookies' },
      { label: 'GDPR', href: '#gdpr' },
      { label: 'Security', href: '#security' },
    ],
  };

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Box
      id="contact"
      component="footer"
      sx={{
        bgcolor: '#f5f5f7',
        color: '#1d1d1f',
        pt: { xs: 8, md: 10 },
        pb: 4,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <Box
                component="img"
                src="/images/van-logo.svg"
                alt="FleetOZ"
                sx={{ width: 40, height: 40, mr: 1.5, filter: 'brightness(0) invert(1)' }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.4rem',
                  color: '#1d1d1f',
                  fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                }}
              >
                FleetOZ
              </Typography>
            </Box>
            <Typography
              sx={{
                mb: 3,
                color: '#6e6e73',
                lineHeight: 1.5,
                fontSize: '0.9rem',
                fontWeight: 400,
              }}
            >
              Smart fleet management solutions for UAE transport companies.
              Track, manage, and optimize your fleet operations with ease.
            </Typography>

            {/* Contact Info */}
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Email sx={{ fontSize: 20, opacity: 0.8 }} />
                <Typography sx={{ fontSize: '0.95rem' }}>
                  info@fleetoz.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Phone sx={{ fontSize: 20, opacity: 0.8 }} />
                <Typography sx={{ fontSize: '0.95rem' }}>
                  +971 4 XXX XXXX
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocationOn sx={{ fontSize: 20, opacity: 0.8 }} />
                <Typography sx={{ fontSize: '0.95rem' }}>
                  Dubai, United Arab Emirates
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Product Links */}
          <Grid item xs={6} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: '1.1rem',
              }}
            >
              Product
            </Typography>
            <Stack spacing={1.5}>
              {footerLinks.product.map((link, index) => (
                <Link
                  key={index}
                  component="button"
                  onClick={() => scrollToSection(link.href)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: 'white',
                      pl: 0.5,
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Company Links */}
          <Grid item xs={6} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: '1.1rem',
              }}
            >
              Company
            </Typography>
            <Stack spacing={1.5}>
              {footerLinks.company.map((link, index) => (
                <Link
                  key={index}
                  component="button"
                  onClick={() => scrollToSection(link.href)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: 'white',
                      pl: 0.5,
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Support Links */}
          <Grid item xs={6} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: '1.1rem',
              }}
            >
              Support
            </Typography>
            <Stack spacing={1.5}>
              {footerLinks.support.map((link, index) => (
                <Link
                  key={index}
                  component="button"
                  onClick={() => scrollToSection(link.href)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: 'white',
                      pl: 0.5,
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Legal Links */}
          <Grid item xs={6} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: '1.1rem',
              }}
            >
              Legal
            </Typography>
            <Stack spacing={1.5}>
              {footerLinks.legal.map((link, index) => (
                <Link
                  key={index}
                  component="button"
                  onClick={() => scrollToSection(link.href)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: 'white',
                      pl: 0.5,
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>
        </Grid>

        {/* Bottom Bar */}
        <Box
          sx={{
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            mt: 8,
            pt: 4,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.9rem',
              opacity: 0.8,
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            © {new Date().getFullYear()} FleetOZ. All rights reserved. Made with ❤️ in UAE
          </Typography>

          {/* Social Media Icons */}
          <Stack direction="row" spacing={1}>
            {[
              { icon: <Facebook />, label: 'Facebook' },
              { icon: <Twitter />, label: 'Twitter' },
              { icon: <LinkedIn />, label: 'LinkedIn' },
              { icon: <Instagram />, label: 'Instagram' },
            ].map((social, index) => (
              <IconButton
                key={index}
                aria-label={social.label}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: 'white',
                    bgcolor: '#328B9B',
                    transform: 'translateY(-2px)',
                  },
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
