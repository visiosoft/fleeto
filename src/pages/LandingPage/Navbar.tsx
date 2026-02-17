import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Button, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { label: 'Features', href: '#features' },
    { label: 'GPS Trackers', href: '#trackers' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
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
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          bgcolor: scrolled ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: scrolled ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid transparent',
          transition: 'all 0.3s ease',
          boxShadow: scrolled ? '0 2px 10px rgba(0, 0, 0, 0.05)' : 'none',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 2,
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'scale(1.05)' },
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Box
                component="img"
                src="/images/van-logo.svg"
                alt="FleetOZ"
                sx={{ width: 40, height: 40, mr: 1.5 }}
              />
              <Box
                sx={{
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  color: '#1d1d1f',
                  fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                  letterSpacing: '-0.01em',
                }}
              >
                FleetOZ
              </Box>
            </Box>

            {/* Desktop Menu */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  sx={{
                    color: '#1d1d1f',
                    px: 2,
                    py: 1,
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    textTransform: 'none',
                    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Desktop CTA Buttons */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{
                  color: '#0071e3',
                  fontWeight: 400,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
                  px: 3,
                  '&:hover': {
                    bgcolor: 'rgba(0, 113, 227, 0.04)',
                  },
                  transition: 'background-color 0.2s ease',
                }}
              >
                Log in
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: '#0071e3',
                  color: 'white',
                  fontWeight: 400,
                  fontSize: '0.875rem',
                  fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
                  textTransform: 'none',
                  px: 3,
                  py: 0.8,
                  borderRadius: '980px',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#0077ed',
                    boxShadow: 'none',
                  },
                  transition: 'background-color 0.2s ease',
                }}
              >
                Get started
              </Button>
            </Box>

            {/* Mobile Menu Button */}
            <IconButton
              sx={{ display: { xs: 'block', md: 'none' }, color: '#0B3C5D' }}
              onClick={() => setMobileOpen(true)}
            >
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
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: 'white',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton
                onClick={() => scrollToSection(item.href)}
                sx={{
                  py: 2,
                  '&:hover': { bgcolor: 'rgba(11, 60, 93, 0.05)' },
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    color: '#0B3C5D',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem sx={{ pt: 3, px: 2, flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                navigate('/login');
                setMobileOpen(false);
              }}
              sx={{
                color: '#0B3C5D',
                borderColor: '#0B3C5D',
                textTransform: 'none',
                py: 1.5,
                fontWeight: 600,
              }}
            >
              Login
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                navigate('/register');
                setMobileOpen(false);
              }}
              sx={{
                bgcolor: '#0B3C5D',
                color: 'white',
                textTransform: 'none',
                py: 1.5,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#328B9B',
                },
              }}
            >
              Get Started
            </Button>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;
