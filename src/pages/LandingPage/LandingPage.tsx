import React from 'react';
import { Box } from '@mui/material';
import { MotionConfig } from 'motion/react';
import Navbar from './Navbar';
import Hero from './Hero';
import TrustBar from './TrustBar';
import TrackerProviders from './TrackerProviders';
import Features from './Features';
import IndustryVerticals from './IndustryVerticals';
import DashboardPreview from './DashboardPreview';
import Benefits from './Benefits';
import Integrations from './Integrations';
import CTA from './CTA';
import Footer from './Footer';
import { FONT_BODY } from './theme';

const LandingPage: React.FC = () => {
  return (
    // reducedMotion="user" makes every animation below honour the OS setting.
    <MotionConfig reducedMotion="user">
      <Box
        sx={{
          bgcolor: '#ffffff',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100vw',
          margin: 0,
          padding: 0,
          fontFamily: FONT_BODY,
        }}
      >
        <Navbar />
        <Hero />
        <TrustBar />
        <TrackerProviders />
        <Features />
        <IndustryVerticals />
        <DashboardPreview />
        <Benefits />
        <Integrations />
        <CTA />
        <Footer />
      </Box>
    </MotionConfig>
  );
};

export default LandingPage; 