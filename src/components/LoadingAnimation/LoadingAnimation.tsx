import React from 'react';
import { Box, LinearProgress, Typography, useTheme } from '@mui/material';
import Lottie from 'lottie-react';
import tireAnimation from './animations/tire-rotation.json';
import truckAnimation from './animations/moving-truck.json';

interface LoadingAnimationProps {
  progress?: number;
  message?: string;
  variant?: 'tire' | 'truck';
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  progress,
  message = 'Loading...',
  variant = 'tire'
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
        width: '100%',
        maxWidth: 400,
        mx: 'auto'
      }}
    >
      <Box
        sx={{
          width: 200,
          height: 200,
          position: 'relative'
        }}
      >
        <Lottie
          animationData={variant === 'tire' ? tireAnimation : truckAnimation}
          loop={true}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>

      {progress !== undefined && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 1 }}
          >
            {progress}%
          </Typography>
        </Box>
      )}

      <Typography
        variant="h6"
        color="text.primary"
        sx={{
          fontFamily: '"Barlow Semi-Condensed", sans-serif',
          fontWeight: 600,
          textAlign: 'center'
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingAnimation; 