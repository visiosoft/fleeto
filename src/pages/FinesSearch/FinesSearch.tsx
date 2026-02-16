import React from 'react';
import { Box, Container, Typography, Paper, Button, Alert, Stack, Chip } from '@mui/material';
import { OpenInNew as OpenInNewIcon, Gavel as GavelIcon, ConfirmationNumber as CodeIcon } from '@mui/icons-material';

const FinesSearch: React.FC = () => {
  const rtaFinesUrl = 'https://ums.rta.ae/violations/public-fines/fines-search';
  const trafficCode = '51563245';

  const handleOpenFines = () => {
    window.open(rtaFinesUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trafficCode);
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        RTA Fines Search
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        The RTA Fines Search portal cannot be embedded directly due to security restrictions. 
        Click the button below to open it in a new window.
      </Alert>
      
      <Paper 
        sx={{ 
          p: 6,
          textAlign: 'center',
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(45, 155, 155, 0.05) 0%, rgba(107, 144, 128, 0.05) 100%)',
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #2D9B9B 0%, #1a7070 100%)',
              boxShadow: '0 4px 20px rgba(45, 155, 155, 0.3)',
            }}
          >
            <GavelIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom fontWeight={700}>
              RTA Traffic Fines & Violations
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Search and check your vehicle fines on the official RTA portal
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
              <CodeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Traffic Code:
              </Typography>
              <Chip 
                label={trafficCode}
                onClick={handleCopyCode}
                sx={{ 
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                }}
              />
            </Box>
          </Box>

          <Button
            variant="contained"
            size="large"
            endIcon={<OpenInNewIcon />}
            onClick={handleOpenFines}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(45, 155, 155, 0.4)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(45, 155, 155, 0.5)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s',
            }}
          >
            Open RTA Fines Search Portal
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
            You will be redirected to: {rtaFinesUrl}
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
};

export default FinesSearch;
