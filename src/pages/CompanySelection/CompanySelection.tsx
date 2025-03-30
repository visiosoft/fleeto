import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
  CardActionArea,
  Chip,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Company } from '../../types/api';

const CompanySelection: React.FC = () => {
  const theme = useTheme();
  const { companies, setSelectedCompany } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  const handleContinue = () => {
    if (selectedCompanyId) {
      const selectedCompany = companies.find(c => c._id === selectedCompanyId);
      if (selectedCompany) {
        setSelectedCompany(selectedCompany);
        navigate('/dashboard');
      }
    }
  };

  if (!companies || companies.length === 0) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        }}
      >
        <Container maxWidth="sm">
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              No Companies Available
            </Typography>
            <Typography color="text.secondary">
              You don't have access to any companies. Please contact your administrator.
            </Typography>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      }}
    >
      <Container maxWidth="md">
        <Card sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
            Select Your Company
          </Typography>
          
          <Grid container spacing={3}>
            {companies.map((company) => (
              <Grid item xs={12} sm={6} md={4} key={company._id}>
                <Card
                  sx={{
                    height: '100%',
                    border: selectedCompanyId === company._id
                      ? `2px solid ${theme.palette.primary.main}`
                      : '2px solid transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleCompanySelect(company._id)}
                    sx={{ height: '100%' }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {company.name}
                      </Typography>
                      <Chip
                        label={company.role}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              disabled={!selectedCompanyId}
              sx={{ minWidth: 200 }}
            >
              Continue to Dashboard
            </Button>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default CompanySelection; 