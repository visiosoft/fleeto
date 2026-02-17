import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  DirectionsCar as DirectionsCarIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  // Get the redirect path from location state or default to dashboard
  const from = (location.state as any)?.from || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with email:', email);
      await login(email, password);
      // Navigation is handled by AuthContext, but we'll navigate to the stored path
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#ffffff',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'auto',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '500px', px: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              mb: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DirectionsCarIcon sx={{ fontSize: 48, color: '#0071e3', mr: 1 }} />
            <Typography
              variant="h4"
              sx={{
                fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 600,
                color: '#1d1d1f',
                letterSpacing: '-0.015em',
              }}
            >
              fleeto
            </Typography>
          </Box>

          <Box
            sx={{
              width: '100%',
              maxWidth: 440,
              p: 5,
              border: '1px solid #e5e5e7',
              borderRadius: '18px',
              bgcolor: '#ffffff',
            }}
          >
            <Typography
              variant="h4"
              align="center"
              sx={{
                mb: 1,
                fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 600,
                color: '#1d1d1f',
                fontSize: { xs: '28px', sm: '32px' },
                letterSpacing: '-0.015em',
              }}
            >
              welcome back
            </Typography>

            <Typography
              variant="body1"
              align="center"
              sx={{
                mb: 4,
                fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                color: '#6e6e73',
                fontSize: '17px',
              }}
            >
              sign in to your fleet management account
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: '12px',
                  fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: '17px',
                    '& fieldset': {
                      borderColor: '#e5e5e7',
                    },
                    '&:hover fieldset': {
                      borderColor: '#0071e3',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0071e3',
                      borderWidth: '2px',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#6e6e73' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: '17px',
                    '& fieldset': {
                      borderColor: '#e5e5e7',
                    },
                    '&:hover fieldset': {
                      borderColor: '#0071e3',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0071e3',
                      borderWidth: '2px',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#6e6e73' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#6e6e73' }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 1.75,
                  borderRadius: '980px',
                  textTransform: 'none',
                  fontSize: '17px',
                  fontWeight: 500,
                  fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                  bgcolor: '#0071e3',
                  color: '#ffffff',
                  boxShadow: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#0077ed',
                    boxShadow: 'none',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#e5e5e7',
                    color: '#6e6e73',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#6e6e73' }} /> : 'sign in'}
              </Button>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                    color: '#6e6e73',
                    fontSize: '15px',
                  }}
                >
                  don't have an account?{' '}
                  <Button
                    onClick={() => navigate('/register')}
                    sx={{ 
                      textTransform: 'none', 
                      fontWeight: 500, 
                      p: 0, 
                      minWidth: 0,
                      color: '#0071e3',
                      fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                      fontSize: '15px',
                      '&:hover': {
                        bgcolor: 'transparent',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    sign up
                  </Button>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login; 