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
  Paper,
  Stack,
} from '@mui/material';
import {
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/environment';
import { useAuth } from '../../contexts/AuthContext';

interface CompanySettings {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  licenseNumber: string;
  tcNumber: string;
  currency: string;
  settings?: {
    invoicePrefix?: string;
    invoiceNumberFormat?: string;
    taxRate?: number;
    paymentTerms?: number;
    defaultCurrency?: string;
    dateFormat?: string;
    timeFormat?: string;
    invoiceHeader?: string;
    invoiceFooter?: string;
  };
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [headerImage, setHeaderImage] = useState<string>('');
  const [footerImage, setFooterImage] = useState<string>('');
  const [settings, setSettings] = useState<CompanySettings>({
    _id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    licenseNumber: '',
    tcNumber: '',
    currency: 'AED',
    settings: {
      invoicePrefix: 'INV',
      invoiceNumberFormat: 'YYYY-XXXX',
      taxRate: 5,
      paymentTerms: 30,
      defaultCurrency: 'USD',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      invoiceHeader: '',
      invoiceFooter: '',
    },
  });

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    setLoading(true);
    try {
      // Get selectedCompanyId from localStorage
      const selectedCompanyId = localStorage.getItem('selectedCompanyId');

      console.log('Selected Company ID:', selectedCompanyId);

      if (!selectedCompanyId) {
        setSnackbar({ open: true, message: 'No company selected', severity: 'error' });
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_ENDPOINTS.companies}/${selectedCompanyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);

      // Handle different response structures - company data is nested in data.company
      const companyData = response.data.data?.company || response.data.company || response.data;

      console.log('Company Data:', companyData);

      // Map the company data to settings state
      setSettings({
        _id: companyData._id || companyData.id,
        name: companyData.name || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        address: companyData.address || '',
        taxNumber: companyData.taxNumber || '',
        licenseNumber: companyData.licenseNumber || '',
        tcNumber: companyData.tcNumber || '',
        currency: companyData.currency || 'AED',
        settings: {
          invoicePrefix: companyData.settings?.invoicePrefix || 'INV',
          invoiceNumberFormat: companyData.settings?.invoiceNumberFormat || 'YYYY-XXXX',
          taxRate: companyData.settings?.taxRate || 5,
          paymentTerms: companyData.settings?.paymentTerms || 30,
          defaultCurrency: companyData.settings?.defaultCurrency || 'USD',
          dateFormat: companyData.settings?.dateFormat || 'DD/MM/YYYY',
          timeFormat: companyData.settings?.timeFormat || '24h',
          invoiceHeader: companyData.settings?.invoiceHeader || '',
          invoiceFooter: companyData.settings?.invoiceFooter || '',
        },
      });

      // Set the image preview URLs
      setHeaderImage(companyData.settings?.invoiceHeader || '');
      setFooterImage(companyData.settings?.invoiceFooter || '');

      console.log('Settings after update:', settings);
    } catch (error) {
      console.error('Error fetching company settings:', error);
      setSnackbar({ open: true, message: 'Failed to load company settings', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CompanySettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSettingsChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: event.target.value,
      },
    }));
  };

  const handleImageUpload = async (type: 'header' | 'footer', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSnackbar({ open: true, message: 'Please upload an image file', severity: 'error' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'Image size should be less than 2MB', severity: 'error' });
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;

        if (type === 'header') {
          setHeaderImage(base64String);
          setSettings(prev => ({
            ...prev,
            settings: {
              ...prev.settings,
              invoiceHeader: base64String,
            },
          }));
        } else {
          setFooterImage(base64String);
          setSettings(prev => ({
            ...prev,
            settings: {
              ...prev.settings,
              invoiceFooter: base64String,
            },
          }));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbar({ open: true, message: 'Failed to upload image', severity: 'error' });
    }
  };

  const handleRemoveImage = (type: 'header' | 'footer') => {
    if (type === 'header') {
      setHeaderImage('');
      setSettings(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          invoiceHeader: '',
        },
      }));
    } else {
      setFooterImage('');
      setSettings(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          invoiceFooter: '',
        },
      }));
    }
  };

  const handleSave = async () => {
    if (!settings._id) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Saving settings:', settings);
      const response = await axios.put(
        `${API_ENDPOINTS.companies}/${settings._id}`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Save response:', response.data);

      // Update tcNumber in localStorage if it was changed
      if (settings.tcNumber) {
        localStorage.setItem('tcNumber', settings.tcNumber);
      }

      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
      fetchCompanySettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to save settings';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#2563EB' }} size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {/* Company Information */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={4}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BusinessIcon sx={{ color: '#7c3aed', fontSize: 24 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#1e293b' }}>
                Company Information
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={settings.name}
                  onChange={handleChange('name')}
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#7c3aed',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#7c3aed',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#7c3aed',
                    },
                  }}
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
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#7c3aed',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#7c3aed',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#7c3aed',
                    },
                  }}
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
                  label="Tax Number"
                  value={settings.taxNumber}
                  onChange={handleChange('taxNumber')}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#7c3aed',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#7c3aed',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#7c3aed',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="License Number"
                  value={settings.licenseNumber}
                  onChange={handleChange('licenseNumber')}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#7c3aed',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#7c3aed',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#7c3aed',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="TC Number"
                  value={settings.tcNumber}
                  onChange={handleChange('tcNumber')}
                  helperText="TC number is required to fetch RTA fines and other traffic-related information"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#7c3aed',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#7c3aed',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#7c3aed',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={4}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PersonIcon sx={{ color: '#2563eb', fontSize: 24 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#1e293b' }}>
                Contact Information
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={settings.email}
                  onChange={handleChange('email')}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#2563eb',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2563eb',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#2563eb',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={settings.phone}
                  onChange={handleChange('phone')}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#2563eb',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2563eb',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#2563eb',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Address Information */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={4}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LocationIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#1e293b' }}>
                Address Information
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={settings.address}
                  onChange={handleChange('address')}
                  multiline
                  rows={3}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#f59e0b',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#f59e0b',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Invoice Settings */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={4}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <DescriptionIcon sx={{ color: '#16a34a', fontSize: 24 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#1e293b' }}>
                Invoice Settings
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Prefix"
                  value={settings.settings?.invoicePrefix || ''}
                  onChange={handleSettingsChange('invoicePrefix')}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#16a34a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#16a34a',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#16a34a',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Number Format"
                  value={settings.settings?.invoiceNumberFormat || ''}
                  onChange={handleSettingsChange('invoiceNumberFormat')}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#16a34a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#16a34a',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#16a34a',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tax Rate (%)"
                  type="number"
                  value={settings.settings?.taxRate || 0}
                  onChange={handleSettingsChange('taxRate')}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#16a34a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#16a34a',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#16a34a',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Payment Terms (Days)"
                  type="number"
                  value={settings.settings?.paymentTerms || 0}
                  onChange={handleSettingsChange('paymentTerms')}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#16a34a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#16a34a',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#16a34a',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date Format"
                  value={settings.settings?.dateFormat || ''}
                  onChange={handleSettingsChange('dateFormat')}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#16a34a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#16a34a',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#16a34a',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Invoice Header & Footer Images */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={4}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <DescriptionIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#1e293b' }}>
                Invoice Header & Footer
              </Typography>
            </Stack>

            <Grid container spacing={4}>
              {/* Header Image */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: '#374151' }}>
                    Invoice Header Image
                  </Typography>
                  <Box
                    sx={{
                      border: '2px dashed #e5e7eb',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      bgcolor: '#f9fafb',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#f59e0b',
                        bgcolor: '#fef3c7',
                      },
                    }}
                  >
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="header-image-upload"
                      type="file"
                      onChange={(e) => handleImageUpload('header', e)}
                    />
                    <label htmlFor="header-image-upload" style={{ cursor: 'pointer', width: '100%' }}>
                      {headerImage ? (
                        <Box>
                          <img
                            src={headerImage}
                            alt="Invoice Header"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              marginBottom: '12px',
                            }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('header-image-upload')?.click();
                              }}
                              sx={{ textTransform: 'none' }}
                            >
                              Change Image
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.preventDefault();
                                handleRemoveImage('header');
                              }}
                              sx={{ textTransform: 'none' }}
                            >
                              Remove
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          <DescriptionIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Click to upload header image
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            PNG, JPG up to 2MB
                          </Typography>
                        </Box>
                      )}
                    </label>
                  </Box>
                </Box>
              </Grid>

              {/* Footer Image */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: '#374151' }}>
                    Invoice Footer Image
                  </Typography>
                  <Box
                    sx={{
                      border: '2px dashed #e5e7eb',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      bgcolor: '#f9fafb',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#f59e0b',
                        bgcolor: '#fef3c7',
                      },
                    }}
                  >
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="footer-image-upload"
                      type="file"
                      onChange={(e) => handleImageUpload('footer', e)}
                    />
                    <label htmlFor="footer-image-upload" style={{ cursor: 'pointer', width: '100%' }}>
                      {footerImage ? (
                        <Box>
                          <img
                            src={footerImage}
                            alt="Invoice Footer"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              marginBottom: '12px',
                            }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('footer-image-upload')?.click();
                              }}
                              sx={{ textTransform: 'none' }}
                            >
                              Change Image
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.preventDefault();
                                handleRemoveImage('footer');
                              }}
                              sx={{ textTransform: 'none' }}
                            >
                              Remove
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          <DescriptionIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Click to upload footer image
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            PNG, JPG up to 2MB
                          </Typography>
                        </Box>
                      )}
                    </label>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'white',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                size="large"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
                    boxShadow: '0 10px 15px -3px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&:disabled': {
                    background: '#e2e8f0',
                    color: '#94a3b8',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Paper>
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
          sx={{
            borderRadius: 2,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
