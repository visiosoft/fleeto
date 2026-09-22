import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ maxWidth: 460, textAlign: 'center' }}>
        <Box component="img" src="/images/van-logo.svg" alt="" sx={{ width: 44, height: 44, mb: 6 }} />

        <Typography
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'text.secondary',
            mb: 2,
          }}
        >
          Error 404
        </Typography>

        <Typography variant="h3" sx={{ mb: 2 }}>
          We couldn't find that page
        </Typography>

        <Typography sx={{ color: 'text.secondary', mb: 8, lineHeight: 1.6 }}>
          The link may be out of date, or the record it pointed to was removed. Everything else is
          still where you left it.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button variant="contained" startIcon={<SpaceDashboardOutlinedIcon />} onClick={() => navigate('/dashboard')}>
            Go to dashboard
          </Button>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Back
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default NotFound;
