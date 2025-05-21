import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Container,
  useTheme,
  Grid,
  Divider,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  DirectionsCar as DirectionsCarIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
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

const features = [
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: 'Zero Risk',
    description: 'No trials, no surprises. Keep free features forever.'
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 40 }} />,
    title: 'Full Access, No Paywall',
    description: 'Use core features without limits. No hidden costs.'
  },
  {
    icon: <SupportIcon sx={{ fontSize: 40 }} />,
    title: 'Upgrade on Your Terms',
    description: 'Need more? Upgrade seamlessly when you are ready.'
  }
];

const Register: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Company Name"
                value={companyData.name}
                onChange={(e) => handleCompanyChange('name', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="primary" />
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
                value={companyData.registrationNumber}
                onChange={(e) => handleCompanyChange('registrationNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Company Email"
                type="email"
                value={companyData.email}
                onChange={(e) => handleCompanyChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Phone Number"
                value={companyData.phone}
                onChange={(e) => handleCompanyChange('phone', e.target.value)}
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
                value={companyData.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="primary" />
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
                value={companyData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="State"
                value={companyData.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Country"
                value={companyData.address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Postal Code"
                value={companyData.address.postalCode}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
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
                value={adminData.firstName}
                onChange={(e) => handleAdminChange('firstName', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
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
                value={adminData.lastName}
                onChange={(e) => handleAdminChange('lastName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Email"
                type="email"
                value={adminData.email}
                onChange={(e) => handleAdminChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={adminData.password}
                onChange={(e) => handleAdminChange('password', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
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
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto'
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          py: 6,
          textAlign: 'center',
          color: 'white',
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: 3
              }}
            >
              <DirectionsCarIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            </Box>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              Forever Free – No Expiry, No Hidden Costs!
            </Typography>
            <Typography
              variant="h4"
              sx={{
                opacity: 0.9,
                maxWidth: '800px',
                mb: 2,
                fontSize: { xs: '1.25rem', md: '1.5rem' }
              }}
            >
              Get Started Free – Upgrade Only If You Want To!
            </Typography>
            <Typography
              variant="h5"
              sx={{
                opacity: 0.9,
                maxWidth: '600px',
                mb: 4,
                fontSize: { xs: '1.1rem', md: '1.25rem' }
              }}
            >
              Join 100,000+ businesses thriving with our free plan.
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                opacity: 0.8,
                maxWidth: '600px',
                mb: 4,
                fontStyle: 'italic'
              }}
            >
              No credit card required. Cancel anytime—but you won't need to.
            </Typography>
          </Box>

          {/* Features Section */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                    }
                  }}
                >
                  <Box sx={{ color: 'white', mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Registration Form */}
      <Container maxWidth="md" sx={{ mb: 4 }}>
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography
            variant="h4"
            align="center"
            sx={{ mb: 3, color: theme.palette.primary.main }}
          >
            Unlock Premium Features for $0
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            sx={{ mb: 4, color: theme.palette.text.secondary }}
          >
            Free today. Free tomorrow. Free for life.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Registration successful! Redirecting to dashboard...
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    minWidth: 200,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    minWidth: 200,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          py: 3,
          textAlign: 'center',
          color: 'white',
          mt: 'auto'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Already have an account?{' '}
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Sign in
            </Button>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Register; 