import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Save,
  ExpandMore,
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  CloudUpload,
} from '@mui/icons-material';
import { CompanySettings } from '../../types';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';

const defaultSettings: CompanySettings = {
  companyName: '',
  logo: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  trn: '',
  vatNumber: '',
  registrationNumber: '',
  legalName: '',
  currency: 'AED',
  timezone: 'Asia/Dubai',
  country: 'United Arab Emirates',
  city: 'Dubai',
  postalCode: '',
  socialMedia: {
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: '',
  },
  bankDetails: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    swiftCode: '',
  },
};

const CompanySettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get<CompanySettings>(
        getApiUrl(API_CONFIG.ENDPOINTS.COMPANY_SETTINGS)
      );
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching company settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load company settings',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = event.target;
    if (!name) return;

    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setSettings((prev) => {
        const sectionKey = section as keyof CompanySettings;
        const sectionData = prev[sectionKey] as Record<string, unknown>;
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value,
          },
        };
      });
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setLogoFile(event.target.files[0]);
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setSettings((prev) => ({
          ...prev,
          logo: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // If there's a new logo, upload it first
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const uploadResponse = await axios.post(
          getApiUrl(API_CONFIG.ENDPOINTS.UPLOAD_LOGO),
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        settings.logo = uploadResponse.data.url;
      }

      // Save all settings
      await axios.post(
        getApiUrl(API_CONFIG.ENDPOINTS.COMPANY_SETTINGS),
        settings
      );

      setSnackbar({
        open: true,
        message: 'Company settings saved successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving company settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save company settings',
        severity: 'error',
      });
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
      <Paper elevation={3}>
        <Box p={3}>
          <Typography variant="h4" gutterBottom>
            Company Settings
          </Typography>

          <Grid container spacing={3}>
            {/* Company Logo */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                {settings.logo && (
                  <img
                    src={settings.logo}
                    alt="Company Logo"
                    style={{ maxWidth: 200, maxHeight: 100 }}
                  />
                )}
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                >
                  Upload Logo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </Button>
              </Box>
            </Grid>

            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                name="companyName"
                value={settings.companyName}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Legal Name"
                name="legalName"
                value={settings.legalName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={settings.address}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={settings.email}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={settings.website}
                onChange={handleChange}
              />
            </Grid>

            {/* Registration Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Registration Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="TRN Number"
                name="trn"
                value={settings.trn}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="VAT Number"
                name="vatNumber"
                value={settings.vatNumber}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Registration Number"
                name="registrationNumber"
                value={settings.registrationNumber}
                onChange={handleChange}
              />
            </Grid>

            {/* Location Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Location Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={settings.country}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={settings.city}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postalCode"
                value={settings.postalCode}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Timezone"
                name="timezone"
                value={settings.timezone}
                onChange={handleChange}
              />
            </Grid>

            {/* Bank Details */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Bank Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Bank Name"
                        name="bankDetails.bankName"
                        value={settings.bankDetails?.bankName}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Account Name"
                        name="bankDetails.accountName"
                        value={settings.bankDetails?.accountName}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Account Number"
                        name="bankDetails.accountNumber"
                        value={settings.bankDetails?.accountNumber}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="IBAN"
                        name="bankDetails.iban"
                        value={settings.bankDetails?.iban}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="SWIFT Code"
                        name="bankDetails.swiftCode"
                        value={settings.bankDetails?.swiftCode}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Social Media */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Social Media</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Facebook"
                        name="socialMedia.facebook"
                        value={settings.socialMedia?.facebook}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Facebook />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Twitter"
                        name="socialMedia.twitter"
                        value={settings.socialMedia?.twitter}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Twitter />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="LinkedIn"
                        name="socialMedia.linkedin"
                        value={settings.socialMedia?.linkedin}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LinkedIn />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Instagram"
                        name="socialMedia.instagram"
                        value={settings.socialMedia?.instagram}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Instagram />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Save Button */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanySettingsPage; 