import React, { useState, useEffect } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import LoadingAnimation from '../../components/LoadingAnimation/LoadingAnimation';

const LoadingDemo: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [variant, setVariant] = useState<'tire' | 'truck'>('tire');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading && progress < 100) {
      timer = setTimeout(() => {
        setProgress((prev) => Math.min(prev + 5, 100));
      }, 500);
    } else if (progress === 100) {
      setIsLoading(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, progress]);

  const handleStartLoading = () => {
    setProgress(0);
    setIsLoading(true);
  };

  const handleToggleVariant = () => {
    setVariant((prev) => (prev === 'tire' ? 'truck' : 'tire'));
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Loading Animations Demo
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box sx={{ textAlign: 'center' }}>
            <LoadingAnimation
              variant={variant}
              progress={progress}
              message={isLoading ? 'Loading data...' : 'Ready to load'}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleStartLoading}
              disabled={isLoading}
              sx={{ mb: 2 }}
            >
              Start Loading
            </Button>
            <Button
              variant="outlined"
              onClick={handleToggleVariant}
              disabled={isLoading}
            >
              Switch to {variant === 'tire' ? 'Truck' : 'Tire'} Animation
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoadingDemo; 