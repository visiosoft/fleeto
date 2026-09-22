import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { motion } from 'motion/react';

// motion.create keeps a single DOM node, so MUI's `sx` (used for grid placement
// in the bento layout) and the motion props live on the same element.
const MotionBox = motion.create(Box);

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  sx?: SxProps<Theme>;
}

/**
 * Reveals section content as it scrolls into view.
 * Reduced-motion is handled globally by <MotionConfig reducedMotion="user"> in LandingPage.
 */
const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 20, sx }) => (
  <MotionBox
    sx={sx}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </MotionBox>
);

export default Reveal;
