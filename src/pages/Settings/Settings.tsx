import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Grid,
  Typography,
  MenuItem,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/environment';
import { useAuth } from '../../contexts/AuthContext';

interface CompanySettings {
  _id?: string;
  companyName: string;
  currency: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  contactPerson: string;
  taxId: string;
  website: string;
}

const currencies = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'AED', label: 'UAE Dirham (AED)' },
  { value: 'SAR', label: 'Saudi Riyal (SAR)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
];

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [companies, setCompanies] = useState<CompanySettings[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [settings, setSettings] = useState<CompanySettings>({
    _id: '',
    companyName: '',
    currency: 'AED',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United Arab Emirates',
    phone: '',
    email: '',
    contactPerson: '',
    taxId: '',
    website: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.companySettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const companiesList = response.data.data?.companies || response.data.companies || [response.data];
      setCompanies(Array.isArray(companiesList) ? companiesList : [companiesList]);
      if (companiesList.length > 0) {
        setSelectedCompanyId(companiesList[0]._id || '');
        setSettings({ ...companiesList[0] });
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setSnackbar({ open: true, message: 'Failed to load companies', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const id = event.target.value as string;
    setSelectedCompanyId(id);
    const company = companies.find((c) => c._id === id);
    if (company) setSettings({ ...company });
  };

  const handleChange = (field: keyof CompanySettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_ENDPOINTS.companySettings}/${selectedCompanyId}`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
      fetchCompanies();
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Company Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your company information and preferences
        </Typography>
      </Box>

      {/* Company Selector */}
      <Box mb={3}>
        <TextField
          select
          label="Select Company"
          value={selectedCompanyId}
          onChange={handleCompanySelect}
          fullWidth
          sx={{ maxWidth: 400 }}
        >
          {companies.map((company) => (
            <MenuItem key={company._id} value={company._id}>
              {company.companyName}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Grid container spacing={3}>
        {/* Company Information */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <BusinessIcon sx={{ fontSize: 28, color: 'primary.main', mr: 1.5 }} />
              <Typography variant="h6" fontWeight={600}>
                Company Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={settings.companyName}
                  onChange={handleChange('companyName')}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Currency"
                  value={settings.currency}
                  onChange={handleChange('currency')}
                  required
                >
                  {currencies.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tax ID / Registration Number"
                  value={settings.taxId}
                  onChange={handleChange('taxId')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={settings.website}
                  onChange={handleChange('website')}
                  placeholder="https://www.example.com"
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <PersonIcon sx={{ fontSize: 28, color: 'primary.main', mr: 1.5 }} />
              <Typography variant="h6" fontWeight={600}>
                Contact Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={settings.contactPerson}
                  onChange={handleChange('contactPerson')}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={settings.email}
                  onChange={handleChange('email')}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={settings.phone}
                  onChange={handleChange('phone')}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Address Information */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <LocationIcon sx={{ fontSize: 28, color: 'primary.main', mr: 1.5 }} />
              <Typography variant="h6" fontWeight={600}>
                Address
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={settings.address}
                  onChange={handleChange('address')}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={settings.city}
                  onChange={handleChange('city')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="State / Emirate"
                  value={settings.state}
                  onChange={handleChange('state')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={settings.postalCode}
                  onChange={handleChange('postalCode')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={settings.country}
                  onChange={handleChange('country')}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            {/* Reset button removed as fetchSettings is not defined in this context */}
            <Button
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              size="large"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
