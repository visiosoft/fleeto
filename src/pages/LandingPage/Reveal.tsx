import React, { useEffect, useRef, useState } from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  sx?: SxProps<Theme>;
}

// Lightweight scroll-reveal using IntersectionObserver only (no scroll listeners, no new deps).
// Motivated use: reveals section content in sequence as the visitor scrolls the page narrative.
const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 20, sx }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default Reveal;
