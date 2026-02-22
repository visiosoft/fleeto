import React from 'react';
import { Box } from '@mui/material';

const Tracking: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100vw',
        height: 'calc(100vh - 64px)',
        marginLeft: { xs: '-1rem', md: '-1.5rem' },
        marginRight: { xs: '-1rem', md: '-1.5rem' },
        marginTop: { xs: '-1rem', md: '-1.5rem' },
        marginBottom: { xs: '-1rem', md: '-1.5rem' },
        maxWidth: { xs: 'calc(100vw)', md: 'calc(100vw - 16rem)' },
      }}
    >
      <iframe
        src="https://app.sinotrack.com/"
        title="Sinotrack Pro Vehicle Tracking"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        allowFullScreen
      />
    </Box>
  );
};

export default Tracking; 