import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { Company } from '../../types/api';
import CompanyService from '../../services/CompanyService';

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    currency: 'AED',
    timezone: 'Asia/Dubai',
    status: 'active',
    subscription: {
      plan: 'free',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
    settings: {
      invoicePrefix: 'INV',
      invoiceNumberFormat: 'YYYY-XXXX',
      taxRate: 5,
      paymentTerms: 30,
      defaultCurrency: 'AED',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    },
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await CompanyService.getInstance().getAllCompanies();
      console.log('API Response:', response.data);
      if (response.data.status === 'success') {
        setCompanies(response.data.data.companies);
      }
    } catch (err) {
      setError('Failed to fetch companies');
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async (company?: Company) => {
    console.log('Opening dialog with company:', company);
    if (company) {
      try {
        // Fetch complete company data from the database
        const response = await CompanyService.getInstance().getCompanyById(company._id);
        console.log('Fetched company data:', response.data);
        
        if (response.data.status === 'success') {
          const companyData = response.data.data;
          setSelectedCompany(companyData);

          // Ensure address object exists
          const address = companyData.address || {
            street: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
          };

          // Ensure settings object exists
          const settings = companyData.settings || {
            invoicePrefix: 'INV',
            invoiceNumberFormat: 'YYYY-XXXX',
            taxRate: 5,
            paymentTerms: 30,
            defaultCurrency: companyData.currency || 'AED',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
          };

          // Ensure subscription object exists with default values
          const subscription = {
            plan: companyData.subscription?.plan || 'free',
            startDate: companyData.subscription?.startDate || new Date().toISOString(),
            endDate: companyData.subscription?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: companyData.subscription?.status || 'active',
          };

          setFormData({
            name: companyData.name || '',
            email: companyData.email || '',
            phone: companyData.phone || '',
            licenseNumber: companyData.licenseNumber || '',
            address: {
              street: address.street || '',
              city: address.city || '',
              state: address.state || '',
              country: address.country || '',
              postalCode: address.postalCode || '',
            },
            currency: companyData.currency || 'AED',
            timezone: companyData.timezone || 'Asia/Dubai',
            status: companyData.status || 'active',
            taxNumber: companyData.taxNumber || '',
            subscription,
            settings: {
              invoicePrefix: settings.invoicePrefix || 'INV',
              invoiceNumberFormat: settings.invoiceNumberFormat || 'YYYY-XXXX',
              taxRate: settings.taxRate || 5,
              paymentTerms: settings.paymentTerms || 30,
              defaultCurrency: companyData.currency || 'AED',
              dateFormat: settings.dateFormat || 'DD/MM/YYYY',
              timeFormat: settings.timeFormat || '24h',
            },
          });

          console.log('Final form data:', formData);
          setOpenDialog(true);
        }
      } catch (err) {
        console.error('Error fetching company details:', err);
        setError('Failed to load company details');
      }
    } else {
      setSelectedCompany(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        licenseNumber: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
        },
        currency: 'AED',
        timezone: 'Asia/Dubai',
        status: 'active',
        subscription: {
          plan: 'free',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
        },
        settings: {
          invoicePrefix: 'INV',
          invoiceNumberFormat: 'YYYY-XXXX',
          taxRate: 5,
          paymentTerms: 30,
          defaultCurrency: 'AED',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
        },
      });
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCompany(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      currency: 'AED',
      timezone: 'Asia/Dubai',
      status: 'active',
      subscription: {
        plan: 'free',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      },
      settings: {
        invoicePrefix: 'INV',
        invoiceNumberFormat: 'YYYY-XXXX',
        taxRate: 5,
        paymentTerms: 30,
        defaultCurrency: 'AED',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCompany) {
        await CompanyService.getInstance().updateCompany(selectedCompany._id, formData);
      } else {
        await CompanyService.getInstance().createCompany(formData);
      }
      handleCloseDialog();
      fetchCompanies();
    } catch (err) {
      setError('Failed to save company');
      console.error('Error saving company:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await CompanyService.getInstance().deleteCompany(id);
        fetchCompanies();
      } catch (err) {
        setError('Failed to delete company');
        console.error('Error deleting company:', err);
      }
    }
  };

  const getStatusColor = (status: Company['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  // Add currency options
  const currencyOptions = [
    { value: 'AED', label: 'UAE Dirham (AED)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'SAR', label: 'Saudi Riyal (SAR)' },
  ];

  // Add date format options
  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Company Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Company
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <LinearProgress />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>License Number</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Subscription</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company._id}>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>{company.phone}</TableCell>
                    <TableCell>{company.licenseNumber}</TableCell>
                    <TableCell>{company.address?.city || '-'}</TableCell>
                    <TableCell>{company.currency}</TableCell>
                    <TableCell>{company.status}</TableCell>
                    <TableCell>{company.subscription?.plan || 'free'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(company)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(company._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCompany ? 'Edit Company' : 'Add New Company'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="License Number"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tax Number"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Company Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={formData.currency}
                        label="Currency"
                        onChange={(e) => {
                          const newCurrency = e.target.value;
                          setFormData({
                            ...formData,
                            currency: newCurrency,
                            settings: {
                              ...formData.settings!,
                              defaultCurrency: newCurrency
                            }
                          });
                        }}
                        required
                      >
                        {currencyOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Date Format</InputLabel>
                      <Select
                        value={formData.settings?.dateFormat}
                        label="Date Format"
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings!, dateFormat: e.target.value }
                        })}
                        required
                      >
                        {dateFormatOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Address
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street"
                      value={formData.address?.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address!, street: e.target.value }
                      })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="City"
                      value={formData.address?.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address!, city: e.target.value }
                      })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="State"
                      value={formData.address?.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address!, state: e.target.value }
                      })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Country"
                      value={formData.address?.country}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address!, country: e.target.value }
                      })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Postal Code"
                      value={formData.address?.postalCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address!, postalCode: e.target.value }
                      })}
                      required
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedCompany ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default CompanyManagement; 