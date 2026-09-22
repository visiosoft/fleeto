import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { motion, useScroll, useTransform } from 'motion/react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { COLORS, FONT_DISPLAY, FONT_BODY, RADIUS } from './theme';

const MotionBox = motion.create(Box);
const MotionButton = motion.create(Button);

// Children inherit the parent's animate state, so the hero enters as one sequence
// rather than four elements fading in on unrelated timers.
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);

  // Screenshot drifts slightly slower than the page, giving the hero depth on scroll.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 64]);

  const scrollToContact = () => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box
      id="hero"
      ref={sectionRef}
      sx={{
        position: 'relative',
        pt: { xs: 12, md: 12 },
        pb: { xs: 10, md: 12 },
        bgcolor: COLORS.surface,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '55%',
          height: '70%',
          background: `radial-gradient(circle, ${COLORS.accentSoft} 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: { xs: 6, md: 4 },
            alignItems: 'center',
          }}
        >
          {/* Left: message */}
          <MotionBox variants={container} initial="hidden" animate="visible">
            <MotionBox
              variants={item}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: COLORS.accentSoft,
                px: 2.25,
                py: 0.9,
                borderRadius: RADIUS.pill,
                mb: 3,
              }}
            >
              <ShieldOutlinedIcon sx={{ fontSize: 18, color: COLORS.accent }} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.accentDark, fontFamily: FONT_BODY }}>
                Built for UAE fleet operators
              </Typography>
            </MotionBox>

            <MotionBox variants={item}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.2rem', md: '3.75rem' },
                  fontWeight: 700,
                  lineHeight: 1.1,
                  mb: 3,
                  fontFamily: FONT_DISPLAY,
                  color: COLORS.ink,
                  letterSpacing: '-0.02em',
                }}
              >
                Run your fleet without the spreadsheets and guesswork.
              </Typography>
            </MotionBox>

            <MotionBox variants={item}>
              <Typography
                sx={{
                  fontSize: { xs: '1.05rem', md: '1.15rem' },
                  lineHeight: 1.6,
                  mb: 5,
                  color: COLORS.body,
                  maxWidth: 520,
                  fontFamily: FONT_BODY,
                }}
              >
                Live GPS tracking, automated UAE fine alerts, and driver records in one dashboard built for local operators.
              </Typography>
            </MotionBox>

            <MotionBox variants={item}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <MotionButton
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/register')}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  sx={{
                    bgcolor: COLORS.accent,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 4,
                    py: 1.6,
                    borderRadius: RADIUS.pill,
                    textTransform: 'none',
                    fontFamily: FONT_BODY,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: COLORS.accentDark, boxShadow: 'none' },
                  }}
                >
                  Start free trial
                </MotionButton>
                <MotionButton
                  variant="outlined"
                  size="large"
                  onClick={scrollToContact}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  sx={{
                    color: COLORS.ink,
                    borderColor: COLORS.borderStrong,
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 4,
                    py: 1.6,
                    borderRadius: RADIUS.pill,
                    textTransform: 'none',
                    fontFamily: FONT_BODY,
                    '&:hover': { borderColor: COLORS.accent, bgcolor: COLORS.accentSoft },
                  }}
                >
                  Book a demo
                </MotionButton>
              </Stack>
            </MotionBox>
          </MotionBox>

          {/* Right: real product screenshot.
              Parallax and entrance animate the same `y` axis, so they sit on separate
              elements - scroll-linked on the outer, one-shot entrance on the inner. */}
          <motion.div style={{ y: imageY, willChange: 'transform' }}>
            <MotionBox
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              sx={{
                position: 'relative',
                borderRadius: RADIUS.lg,
                overflow: 'hidden',
                border: `1px solid ${COLORS.border}`,
                boxShadow: '0 24px 64px rgba(11, 36, 54, 0.14)',
              }}
            >
              <Box component="img" src="/images/dash.png" alt="FleetOZ live dashboard" sx={{ width: '100%', display: 'block' }} />
            </MotionBox>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default Hero;
