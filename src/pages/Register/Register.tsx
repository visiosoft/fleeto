import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  DirectionsCar as DirectionsCarIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';

interface CompanyData {
  name: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

interface AdminData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const steps = ['Company Details', 'Address Information', 'Admin Account'];



const Register: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    registrationNumber: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    }
  });

  const [adminData, setAdminData] = useState<AdminData>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleCompanyChange = (field: keyof CompanyData, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field: keyof CompanyData['address'], value: string) => {
    setCompanyData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleAdminChange = (field: keyof AdminData, value: string) => {
    setAdminData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Register the company
      await api.register({
        companyData,
        adminData
      });
      
      // Automatically log in with the admin credentials
      const loginResponse = await api.login(adminData.email, adminData.password);

      // Store the token
      localStorage.setItem('token', loginResponse.token);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard'); // Redirect to dashboard instead of login
      }, 1000);
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    const textFieldStyles = {
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
      '& .MuiInputLabel-root': {
        fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: '17px',
      },
    };

    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Company Name"
                placeholder="Enter your company name"
                value={companyData.name}
                onChange={(e) => handleCompanyChange('name', e.target.value)}
                sx={textFieldStyles}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: '#6e6e73' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Registration Number"
                placeholder="Enter registration number"
                value={companyData.registrationNumber}
                onChange={(e) => handleCompanyChange('registrationNumber', e.target.value)}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Company Email"
                placeholder="company@example.com"
                type="email"
                value={companyData.email}
                onChange={(e) => handleCompanyChange('email', e.target.value)}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Phone Number"
                placeholder="+971 XX XXX XXXX"
                value={companyData.phone}
                onChange={(e) => handleCompanyChange('phone', e.target.value)}
                sx={textFieldStyles}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Street Address"
                placeholder="Enter street address"
                value={companyData.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                sx={textFieldStyles}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon sx={{ color: '#6e6e73' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="City"
                placeholder="Enter city"
                value={companyData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="State"
                placeholder="Enter state/emirate"
                value={companyData.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Country"
                placeholder="Enter country"
                value={companyData.address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Postal Code"
                placeholder="Enter postal code"
                value={companyData.address.postalCode}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                sx={textFieldStyles}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                placeholder="Enter first name"
                value={adminData.firstName}
                onChange={(e) => handleAdminChange('firstName', e.target.value)}
                sx={textFieldStyles}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#6e6e73' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                placeholder="Enter last name"
                value={adminData.lastName}
                onChange={(e) => handleAdminChange('lastName', e.target.value)}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Email"
                placeholder="admin@example.com"
                type="email"
                value={adminData.email}
                onChange={(e) => handleAdminChange('email', e.target.value)}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Password"
                placeholder="Create a strong password"
                type={showPassword ? 'text' : 'password'}
                value={adminData.password}
                onChange={(e) => handleAdminChange('password', e.target.value)}
                sx={textFieldStyles}
                InputProps={{
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
            </Grid>
          </Grid>
        );
      default:
        return null;
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
      <Box sx={{ width: '100%', maxWidth: '900px', px: 2, py: 4 }}>
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
              mb: 3,
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

          <Typography
            variant="h3"
            align="center"
            sx={{
              mb: 1,
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 600,
              color: '#1d1d1f',
              fontSize: { xs: '32px', sm: '44px' },
              letterSpacing: '-0.015em',
            }}
          >
            get started for free
          </Typography>

          <Typography
            variant="h6"
            align="center"
            sx={{
              mb: 5,
              fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
              color: '#6e6e73',
              fontSize: '19px',
              fontWeight: 400,
            }}
          >
            no credit card required · cancel anytime
          </Typography>

          <Box
            sx={{
              width: '100%',
              p: 5,
              border: '1px solid #e5e5e7',
              borderRadius: '18px',
              bgcolor: '#ffffff',
            }}
          >
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

            {success && (
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  borderRadius: '12px',
                  fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                registration successful! redirecting...
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stepper 
                activeStep={activeStep} 
                sx={{ 
                  mb: 5,
                  '& .MuiStepLabel-label': {
                    fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: '15px',
                  },
                  '& .MuiStepIcon-root': {
                    color: '#e5e5e7',
                    '&.Mui-active': {
                      color: '#0071e3',
                    },
                    '&.Mui-completed': {
                      color: '#0071e3',
                    },
                  },
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {getStepContent(activeStep)}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, gap: 2 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: '980px',
                    textTransform: 'none',
                    fontSize: '17px',
                    fontWeight: 500,
                    fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                    color: '#0071e3',
                    bgcolor: 'transparent',
                    border: '1px solid #e5e5e7',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#f5f5f7',
                      border: '1px solid #0071e3',
                    },
                    '&.Mui-disabled': {
                      color: '#6e6e73',
                      border: '1px solid #e5e5e7',
                    },
                  }}
                >
                  back
                </Button>
                
                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      px: 5,
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
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: '#6e6e73' }} />
                    ) : (
                      'complete registration'
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{
                      py: 1.5,
                      px: 5,
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
                    }}
                  >
                    next
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                color: '#6e6e73',
                fontSize: '15px',
              }}
            >
              already have an account?{' '}
              <Button
                onClick={() => navigate('/login')}
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
                sign in
              </Button>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Register; 