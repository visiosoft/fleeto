import React from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  useTheme,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      icon: <LocationIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Real-Time Tracking',
      description: 'Live GPS updates, geofencing, and route history.',
    },
    {
      icon: <MoneyIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Cost Savings',
      description: 'Reduce fuel costs by 20% with idle-time alerts.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Driver Safety',
      description: 'AI-driven behavior scoring to lower accident risks.',
    },
  ];

  const pricingTiers = [
    {
      title: 'Free',
      price: '$0',
      period: '/mo',
      features: [
        '5 vehicles',
        'Basic tracking',
        'Email support',
        'Route history',
        'Basic reports',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      title: 'Pro',
      price: '$20',
      period: '/mo',
      features: [
        '50 vehicles',
        'Maintenance alerts',
        'API access',
        'Advanced analytics',
        'Priority support',
      ],
      cta: '7-Day Free Trial',
      highlighted: true,
    },
    {
      title: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        'Unlimited vehicles',
        'Dedicated support',
        'AI analytics',
        'Custom integrations',
        'SLA guarantee',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  const faqs = [
    {
      question: 'Is the free plan really unlimited?',
      answer: 'Yes! Track 5 vehicles forever with our free plan. No hidden fees or time limits.',
    },
    {
      question: 'Can I upgrade later?',
      answer: 'Absolutely! You can switch plans anytime. Your data and settings will be preserved.',
    },
    {
      question: 'Do I need special hardware?',
      answer: 'No special hardware required. Use your existing GPS devices or mobile phones.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use enterprise-grade encryption and follow strict security protocols.',
    },
  ];

  return (
    <Box sx={{ 
      bgcolor: '#F5F7FA', 
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100vw',
      margin: 0,
      padding: 0,
    }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          py: { xs: 6, md: 8 },
          width: '100%',
          margin: 0,
          padding: 0,
          position: 'relative',
        }}
      >
        <Button
          variant="text"
          size="large"
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            px: 4,
            py: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.2)',
            zIndex: 1,
          }}
          onClick={() => navigate('/login')}
        >
          Login
        </Button>
        <Container 
          maxWidth="lg" 
          sx={{ 
            px: { xs: 2, md: 4 },
            mx: 'auto',
            width: '100%',
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Box
                  component="img"
                  src="/images/van-logo.svg"
                  alt="FleetOZ Logo"
                  sx={{
                    width: 60,
                    height: 60,
                    mr: 2,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    }
                  }}
                />
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    fontSize: { xs: '1.75rem', md: '2.5rem' },
                  }}
                >
                  FleetOZ
                </Typography>
              </Box>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '2rem', md: '3rem' },
                  lineHeight: 1.2,
                }}
              >
                Smart Fleet Management, Free Forever
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4, 
                  opacity: 0.9,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                }}
              >
                Track 5 vehicles at no cost. Upgrade for AI-powered insights and unlimited fleets.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: '#00B589',
                    '&:hover': { bgcolor: '#009670' },
                    px: 4,
                    py: 1.5,
                  }}
                  onClick={() => navigate('/register')}
                >
                  Start Free Tracking →
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                    px: 4,
                    py: 1.5,
                  }}
                >
                  See Enterprise Plans
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  width: '90%',
                  maxWidth: 500,
                  margin: '0 auto',
                  p: 2,
                  borderRadius: 4,
                  background: 'linear-gradient(145deg, #ffffff 0%, #f5f7fa 100%)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                  display: { xs: 'none', md: 'block' },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 4,
                    padding: 2,
                    background: 'linear-gradient(145deg, rgba(45,155,155,0.1) 0%, rgba(107,144,128,0.1) 100%)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }
                }}
              >
                <Box
                  component="img"
                  src="/images/dash.png"
                  alt="Dashboard Preview"
                  sx={{
                    width: '100%',
                    borderRadius: 2,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    }
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2D9B9B 0%, #6B9080 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <StarIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 6, md: 8 }, 
          px: { xs: 2, md: 4 },
          mx: 'auto',
          width: '100%',
        }}
      >
        <Typography 
          variant="h3" 
          component="h2" 
          textAlign="center" 
          gutterBottom
          sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
        >
          Why FleetOZ?
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  {feature.icon}
                  <Typography variant="h5" component="h3" sx={{ mt: 2, mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">{feature.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Pricing Section */}
      <Box sx={{ 
        bgcolor: 'white', 
        py: { xs: 6, md: 8 },
        width: '100%',
        margin: 0,
        padding: 0,
      }}>
        <Container 
          maxWidth="lg" 
          sx={{ 
            px: { xs: 2, md: 4 },
            mx: 'auto',
            width: '100%',
          }}
        >
          <Typography 
            variant="h3" 
            component="h2" 
            textAlign="center" 
            gutterBottom
            sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
          >
            Plans for Every Fleet Size
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {pricingTiers.map((tier, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    border: tier.highlighted ? `2px solid ${theme.palette.primary.main}` : 'none',
                    boxShadow: tier.highlighted ? `0 0 20px ${theme.palette.primary.main}40` : 1,
                  }}
                >
                  {tier.highlighted && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -15,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        zIndex: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Most Popular
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="h4" component="h3" gutterBottom>
                      {tier.title}
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ mb: 1 }}>
                      {tier.price}
                      <Typography
                        component="span"
                        variant="subtitle1"
                        color="text.secondary"
                      >
                        {tier.period}
                      </Typography>
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1}>
                      {tier.features.map((feature, idx) => (
                        <Typography key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
                          <StarIcon sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 20 }} />
                          {feature}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant={tier.highlighted ? 'contained' : 'outlined'}
                      size="large"
                      onClick={() => navigate('/register')}
                    >
                      {tier.cta}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Demo Preview Section */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 6, md: 8 }, 
          px: { xs: 2, md: 4 },
          mx: 'auto',
          width: '100%',
        }}
      >
        <Typography 
          variant="h3" 
          component="h2" 
          textAlign="center" 
          gutterBottom
          sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
        >
          See It in Action
        </Typography>
        <Box
          sx={{
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            mt: 4,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}
        >
          <Box
            component="img"
            src="/images/demo-preview.svg"
            alt="Demo Preview"
            sx={{ width: '100%' }}
          />
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayIcon />}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'rgba(0,0,0,0.7)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
            }}
          >
            Watch Demo
          </Button>
        </Box>
      </Container>

      {/* FAQ Section */}
      <Box sx={{ 
        bgcolor: 'white', 
        py: { xs: 6, md: 8 },
        width: '100%',
        margin: 0,
        padding: 0,
      }}>
        <Container 
          maxWidth="md" 
          sx={{ 
            px: { xs: 2, md: 4 },
            mx: 'auto',
            width: '100%',
          }}
        >
          <Typography 
            variant="h3" 
            component="h2" 
            textAlign="center" 
            gutterBottom
            sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
          >
            Questions? We've Got Answers
          </Typography>
          <Box sx={{ mt: 4 }}>
            {faqs.map((faq, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary">{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Final CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          py: { xs: 6, md: 8 },
          width: '100%',
          margin: 0,
          padding: 0,
        }}
      >
        <Container 
          maxWidth="md" 
          sx={{ 
            textAlign: 'center', 
            px: { xs: 2, md: 4 },
            mx: 'auto',
            width: '100%',
          }}
        >
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom
            sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
          >
            Ready to Optimize Your Fleet?
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 4, 
              opacity: 0.9,
              fontSize: { xs: '1rem', md: '1.25rem' },
            }}
          >
            No credit card required. Cancel anytime.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#2D9B9B',
              '&:hover': { bgcolor: '#248080' },
              px: 6,
              py: 1.5,
            }}
            onClick={() => navigate('/register')}
          >
            Start Free Today
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 