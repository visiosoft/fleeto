import React from 'react';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import Hero from './Hero';
import TrackerProviders from './TrackerProviders';
import Features from './Features';
import IndustryVerticals from './IndustryVerticals';
import DashboardPreview from './DashboardPreview';
import Benefits from './Benefits';
import Integrations from './Integrations';
import CTA from './CTA';
import Footer from './Footer';

const LandingPage: React.FC = () => {
  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100vw',
        margin: 0,
        padding: 0,
        fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <Navbar />
      <Hero />
      <TrackerProviders />
      <Features />
      <IndustryVerticals />
      <DashboardPreview />
      <Benefits />
      <Integrations />
      <CTA />
      <Footer />
    </Box>
  );
};

export default LandingPage; 