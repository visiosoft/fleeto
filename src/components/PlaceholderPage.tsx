import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          This page is under development. Please check back later.
        </Typography>
      </Paper>
    </Box>
  );
};

export default PlaceholderPage; 