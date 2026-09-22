import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Button, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { COLORS, FONT_DISPLAY, FONT_BODY, RADIUS } from './theme';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver instead of a scroll listener: watches a 1px sentinel
  // planted at the top of the page, toggling the scrolled state without per-frame work.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const menuItems = [
    { label: 'Features', href: '#features' },
    { label: 'Industries', href: '#industry-verticals' },
    { label: 'GPS trackers', href: '#trackers' },
    { label: 'Integrations', href: '#integrations' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileOpen(false);
    }
  };

  return (
    <>
      <Box ref={sentinelRef} sx={{ position: 'absolute', top: 0, height: 1, width: 1 }} />
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          bgcolor: scrolled ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: scrolled ? `1px solid ${COLORS.border}` : '1px solid transparent',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.75 }}>
            {/* Logo */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Box component="img" src="/images/van-logo.svg" alt="FleetOZ" sx={{ width: 34, height: 34, mr: 1.25 }} />
              <Box sx={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.ink, fontFamily: FONT_DISPLAY, letterSpacing: '-0.01em' }}>
                FleetOZ
              </Box>
            </Box>

            {/* Desktop Menu */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  sx={{
                    color: COLORS.ink,
                    px: 2,
                    py: 1,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    fontFamily: FONT_BODY,
                    borderRadius: RADIUS.sm,
                    '&:hover': { bgcolor: COLORS.surfaceAlt },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Desktop CTA Buttons */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{
                  color: COLORS.ink,
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  fontFamily: FONT_BODY,
                  px: 2,
                  '&:hover': { bgcolor: COLORS.surfaceAlt },
                }}
              >
                Log in
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: COLORS.accent,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  fontFamily: FONT_BODY,
                  textTransform: 'none',
                  px: 2.75,
                  py: 1,
                  borderRadius: RADIUS.pill,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: COLORS.accentDark, boxShadow: 'none' },
                }}
              >
                Start free trial
              </Button>
            </Box>

            {/* Mobile Menu Button */}
            <IconButton sx={{ display: { xs: 'flex', md: 'none' }, color: COLORS.ink }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Container>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 280, bgcolor: COLORS.surface } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton onClick={() => scrollToSection(item.href)} sx={{ py: 1.75, '&:hover': { bgcolor: COLORS.surfaceAlt } }}>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '1.05rem', fontWeight: 500, color: COLORS.ink, fontFamily: FONT_BODY }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem sx={{ pt: 3, px: 2, flexDirection: 'column', gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                navigate('/login');
                setMobileOpen(false);
              }}
              sx={{ color: COLORS.ink, borderColor: COLORS.borderStrong, textTransform: 'none', py: 1.4, fontWeight: 600 }}
            >
              Log in
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                navigate('/register');
                setMobileOpen(false);
              }}
              sx={{
                bgcolor: COLORS.accent,
                color: '#fff',
                textTransform: 'none',
                py: 1.4,
                fontWeight: 600,
                '&:hover': { bgcolor: COLORS.accentDark },
              }}
            >
              Start free trial
            </Button>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;
