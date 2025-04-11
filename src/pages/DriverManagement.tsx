import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Snackbar,
  Alert,
  OutlinedInput,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import type { Moment } from 'moment';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../config/api';

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  contact: string;
  address: string;
  status: string;
  notes?: string;
}

interface DriverFormValues extends Omit<Driver, '_id' | 'licenseExpiry'> {
  licenseExpiry: Moment;
}

const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formValues, setFormValues] = useState<Partial<DriverFormValues>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.DRIVERS.LIST));
      setDrivers(response.data);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      showSnackbar('Failed to fetch drivers', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleAdd = () => {
    setFormValues({
      status: 'active',
    });
    setEditingDriver(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (driver: Driver) => {
    try {
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.DRIVERS}/${driver._id}`));
      const driverData = response.data;
      setFormValues({
        ...driverData,
        licenseExpiry: moment(driverData.licenseExpiry),
      });
      setEditingDriver(driver);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch driver details:', error);
      showSnackbar('Failed to fetch driver details', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) {
      return;
    }

    try {
      await axios.delete(getApiUrl(API_CONFIG.ENDPOINTS.DRIVERS.DELETE(id)));
      showSnackbar('Driver deleted successfully', 'success');
      fetchDrivers();
    } catch (error) {
      console.error('Failed to delete driver:', error);
      showSnackbar('Failed to delete driver', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.firstName || !formValues.lastName || !formValues.licenseNumber || !formValues.licenseExpiry) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    try {
      const driverData = {
        ...formValues,
        licenseExpiry: formValues.licenseExpiry.format('YYYY-MM-DD'),
      };

      if (editingDriver) {
        await axios.put(getApiUrl(API_CONFIG.ENDPOINTS.DRIVERS.UPDATE(editingDriver._id)), driverData);
        showSnackbar('Driver updated successfully', 'success');
      } else {
        await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.DRIVERS.CREATE), driverData);
        showSnackbar('Driver added successfully', 'success');
      }
      handleCloseDialog();
      fetchDrivers();
    } catch (error) {
      console.error('Failed to save driver:', error);
      showSnackbar('Failed to save driver', 'error');
    }
  };

  const handleInputChange = (field: keyof DriverFormValues, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCloseDialog = () => {
    setIsModalOpen(false);
    setFormValues({});
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Driver Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Driver
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>License Number</TableCell>
              <TableCell>License State</TableCell>
              <TableCell>License Expiry</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver._id}>
                <TableCell>{`${driver.firstName} ${driver.lastName}`}</TableCell>
                <TableCell>{driver.licenseNumber}</TableCell>
                <TableCell>{driver.licenseState}</TableCell>
                <TableCell>{moment(driver.licenseExpiry).format('YYYY-MM-DD')}</TableCell>
                <TableCell>{driver.contact}</TableCell>
                <TableCell>
                  <Chip 
                    label={driver.status} 
                    color={driver.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(driver)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(driver._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={isModalOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingDriver ? 'Edit Driver' : 'Add Driver'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formValues.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formValues.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="License Number"
                  value={formValues.licenseNumber || ''}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="License State"
                  value={formValues.licenseState || ''}
                  onChange={(e) => handleInputChange('licenseState', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="License Expiry"
                    value={formValues.licenseExpiry || null}
                    onChange={(date: Moment | null) => handleInputChange('licenseExpiry', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formValues.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    input={<OutlinedInput label="Status" />}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact"
                  value={formValues.contact || ''}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formValues.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formValues.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDriver ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DriverManagement; 