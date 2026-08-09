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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  FormControlLabel,
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
  Backup as BackupIcon,
  Restore as RestoreIcon,
  CloudDownload as ExportIcon,
  CloudUpload as ImportIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  Storage as StorageIcon,
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

  // Backup / restore state
  const [exporting, setExporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importSelections, setImportSelections] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    collection: string;
    done: number;
    total: number;
    errors: string[];
  } | null>(null);

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

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [vehicles, drivers, contracts, costsRaw, notes, rtaFines] = await Promise.allSettled([
        axios.get(API_ENDPOINTS.vehicles, { headers }),
        axios.get(API_ENDPOINTS.drivers, { headers }),
        axios.get(API_ENDPOINTS.contracts, { headers }),
        axios.get(API_ENDPOINTS.costs.all, { headers }),
        axios.get(API_ENDPOINTS.notes.list, { headers }),
        axios.get(API_ENDPOINTS.rtaFines.all, { headers }),
      ]);

      // Flatten expenses from the grouped costs response
      const expensesFlat: any[] = [];
      if (costsRaw.status === 'fulfilled') {
        const data = costsRaw.value.data;
        const vehicleList = Array.isArray(data) ? data : data?.vehicles ?? [];
        vehicleList.forEach((v: any) => {
          (v.details ?? v.expenses ?? []).forEach((exp: any) => {
            expensesFlat.push({ ...exp, vehicleName: v.vehicleName });
          });
        });
      }

      const backup = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0',
        collections: {
          vehicles: vehicles.status === 'fulfilled' ? vehicles.value.data : [],
          drivers: drivers.status === 'fulfilled' ? drivers.value.data : [],
          contracts: contracts.status === 'fulfilled' ? contracts.value.data : [],
          expenses: expensesFlat,
          notes: notes.status === 'fulfilled' ? notes.value.data : [],
          rtaFines: rtaFines.status === 'fulfilled' ? rtaFines.value.data : [],
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fleetoz-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Backup exported successfully', severity: 'success' });
    } catch (err) {
      console.error('Export failed:', err);
      setSnackbar({ open: true, message: 'Export failed — check console for details', severity: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleImportFileChange = (file: File) => {
    setImportPreview(null);
    setImportProgress(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.collections || typeof data.collections !== 'object') {
          setSnackbar({ open: true, message: 'Invalid backup file — missing collections', severity: 'error' });
          return;
        }
        setImportPreview(data);
        const selections: Record<string, boolean> = {};
        Object.keys(data.collections).forEach(k => {
          selections[k] = true; // select all by default
        });
        setImportSelections(selections);
      } catch {
        setSnackbar({ open: true, message: 'Could not parse file — must be a valid Fleeto JSON backup', severity: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const COLLECTION_ENDPOINTS: Record<string, string | null> = {
    vehicles: API_ENDPOINTS.vehicles,
    drivers: API_ENDPOINTS.drivers,
    contracts: API_ENDPOINTS.contracts,
    expenses: API_ENDPOINTS.costs.create,
    notes: API_ENDPOINTS.notes.create,
    rtaFines: null, // read-only
  };

  const COLLECTION_LABELS: Record<string, string> = {
    vehicles: 'Vehicles',
    drivers: 'Drivers',
    contracts: 'Contracts',
    expenses: 'Expenses',
    notes: 'Notes',
    rtaFines: 'RTA Fines (read-only)',
  };

  const handleImportConfirm = async () => {
    if (!importPreview) return;
    setImporting(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const collectionsToImport = Object.entries(importSelections)
      .filter(([key, selected]) => selected && COLLECTION_ENDPOINTS[key])
      .map(([key]) => key);

    for (const collection of collectionsToImport) {
      const records: any[] = importPreview.collections[collection] ?? [];
      const endpoint = COLLECTION_ENDPOINTS[collection]!;
      const progress = { collection, done: 0, total: records.length, errors: [] as string[] };
      setImportProgress({ ...progress });

      for (const record of records) {
        try {
          const { _id, __v, createdAt, updatedAt, vehicleName, ...payload } = record;
          if (collection === 'expenses') {
            const fd = new FormData();
            fd.append('vehicleId', payload.vehicleId);
            fd.append('amount', payload.amount?.toString() ?? '0');
            fd.append('date', payload.date ? payload.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
            fd.append('expenseType', payload.expenseType || 'other');
            fd.append('description', payload.description || '');
            fd.append('paymentStatus', payload.paymentStatus || 'paid');
            fd.append('paymentMethod', payload.paymentMethod || 'cash');
            await axios.post(endpoint, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
          } else {
            await axios.post(endpoint, payload, { headers });
          }
          progress.done++;
        } catch (err: any) {
          progress.errors.push(err.response?.data?.message || 'Failed');
        }
        setImportProgress({ ...progress });
      }
    }

    setImporting(false);
    setSnackbar({ open: true, message: 'Restore completed', severity: 'success' });
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
        {/* Data Backup & Restore */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <StorageIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>Data Backup & Restore</Typography>
                <Typography variant="body2" color="text.secondary">
                  Export all your data as a JSON backup file, or restore from a previous backup.
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* Export card */}
              <Grid item xs={12} md={6}>
                <Box sx={{
                  p: 3, borderRadius: 2, border: '1px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <ExportIcon sx={{ color: '#16a34a' }} />
                    <Typography variant="subtitle1" fontWeight={700} color="#16a34a">Export Backup</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Downloads a single JSON file containing all vehicles, drivers, contracts, expenses, notes, and RTA fines.
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {['Vehicles', 'Drivers', 'Contracts', 'Expenses', 'Notes', 'RTA Fines'].map(c => (
                      <Chip key={c} label={c} size="small" variant="outlined" sx={{ borderColor: '#16a34a', color: '#16a34a' }} />
                    ))}
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <ExportIcon />}
                    onClick={handleExportAll}
                    disabled={exporting}
                    sx={{
                      bgcolor: '#16a34a',
                      '&:hover': { bgcolor: '#15803d' },
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {exporting ? 'Exporting…' : 'Export All Data'}
                  </Button>
                </Box>
              </Grid>

              {/* Import card */}
              <Grid item xs={12} md={6}>
                <Box sx={{
                  p: 3, borderRadius: 2, border: '1px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <ImportIcon sx={{ color: '#7c3aed' }} />
                    <Typography variant="subtitle1" fontWeight={700} color="#7c3aed">Import / Restore</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Restore from a Fleeto backup file. Records are added without overwriting existing data.
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<ImportIcon />}
                    sx={{
                      bgcolor: '#7c3aed',
                      '&:hover': { bgcolor: '#6d28d9' },
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Choose Backup File
                    <input
                      type="file"
                      hidden
                      accept="application/json,.json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { handleImportFileChange(file); setImportDialogOpen(true); }
                        e.target.value = '';
                      }}
                    />
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onClose={() => !importing && setImportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RestoreIcon color="secondary" />
              <Typography variant="h6" fontWeight={700}>Restore from Backup</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {importPreview && !importProgress && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Exported: <strong>{new Date(importPreview.exportedAt).toLocaleString()}</strong>
                </Typography>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Select collections to restore:
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" />
                      <TableCell sx={{ fontWeight: 700 }}>Collection</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Records</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(importPreview.collections).map(([key, records]: [string, any]) => {
                      const isReadOnly = !COLLECTION_ENDPOINTS[key];
                      return (
                        <TableRow key={key}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={importSelections[key] ?? false}
                              disabled={isReadOnly}
                              onChange={(e) => setImportSelections(s => ({ ...s, [key]: e.target.checked }))}
                            />
                          </TableCell>
                          <TableCell>
                            {COLLECTION_LABELS[key] ?? key}
                            {isReadOnly && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>(export only)</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={Array.isArray(records) ? records.length : 0} size="small" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}

            {importProgress && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  {importing
                    ? `Restoring ${COLLECTION_LABELS[importProgress.collection] ?? importProgress.collection}… ${importProgress.done} / ${importProgress.total}`
                    : `Done — ${importProgress.done} of ${importProgress.total} restored`}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={importProgress.total > 0 ? (importProgress.done / importProgress.total) * 100 : 0}
                  color={importing ? 'secondary' : importProgress.errors.length > 0 ? 'warning' : 'success'}
                  sx={{ height: 8, borderRadius: 4, mb: 2 }}
                />
                {importProgress.errors.length > 0 && (
                  <Box sx={{ maxHeight: 140, overflowY: 'auto' }}>
                    <Typography variant="caption" fontWeight={700} color="error">Errors:</Typography>
                    {importProgress.errors.map((err, i) => (
                      <Typography key={i} variant="caption" display="block" color="error.light">• {err}</Typography>
                    ))}
                  </Box>
                )}
                {!importing && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    {importProgress.errors.length === 0
                      ? <CheckCircleIcon color="success" fontSize="small" />
                      : <ErrorOutlineIcon color="warning" fontSize="small" />}
                    <Typography variant="body2">
                      {importProgress.errors.length === 0 ? 'Restore completed successfully.' : 'Restore completed with some errors.'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setImportDialogOpen(false); setImportPreview(null); setImportProgress(null); }} disabled={importing}>
              {importProgress && !importing ? 'Close' : 'Cancel'}
            </Button>
            {!importProgress && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleImportConfirm}
                disabled={!importPreview || importing || !Object.values(importSelections).some(Boolean)}
                startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <RestoreIcon />}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Restore Selected
              </Button>
            )}
          </DialogActions>
        </Dialog>

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
