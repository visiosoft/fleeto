import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  IconButton,
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
  Snackbar,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import {
  DirectionsCar,
  LocalGasStation,
  Build,
  History,
  Edit,
  Delete,
  Add,
  Close,
  Description,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import type { Moment } from 'moment';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';
import { Vehicle } from '../../types';
import FuelManagement from '../../components/FuelManagement/FuelManagement';
import Maintenance from '../../components/Maintenance/Maintenance';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vehicle-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Initialize empty vehicle object
const emptyVehicle: Vehicle = {
  id: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  vin: '',
  licensePlate: '',
  registrationExpiry: '',
  status: 'active',
  fuelType: '',
  currentMileage: 0,
  lastServiceDate: '',
  mileage: 0,
};

const VehicleManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formValues, setFormValues] = useState<Vehicle>(emptyVehicle);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES));
      setVehicles(response.data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch vehicles',
        severity: 'error',
      });
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleAdd = () => {
    setFormValues(emptyVehicle);
    setEditingVehicle(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = async (vehicle: Vehicle) => {
    try {
      setFormValues({
        ...vehicle,
        year: parseInt(vehicle.year.toString()),
        currentMileage: parseInt(vehicle.currentMileage.toString()),
        registrationExpiry: vehicle.registrationExpiry || moment().format('YYYY-MM-DD'),
        lastServiceDate: vehicle.lastServiceDate || moment().format('YYYY-MM-DD')
      });
      setEditingVehicle(vehicle);
      setFormErrors({});
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load vehicle details:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load vehicle details',
        severity: 'error',
      });
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFormValues(emptyVehicle);
    setEditingVehicle(null);
    setFormErrors({});
  };

  const handleDeleteConfirm = (id: string) => {
    setVehicleToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(getApiUrl(`${API_CONFIG.ENDPOINTS.VEHICLES}/${vehicleToDelete}`));
      setDeleteConfirmOpen(false);
      setSnackbar({
        open: true,
        message: 'Vehicle deleted successfully',
        severity: 'success',
      });
      fetchVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete vehicle',
        severity: 'error',
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formValues.make.trim()) errors.make = 'Make is required';
    if (!formValues.model.trim()) errors.model = 'Model is required';
    if (!formValues.vin.trim()) errors.vin = 'VIN is required';
    if (!formValues.licensePlate.trim()) errors.licensePlate = 'License plate is required';
    if (formValues.year < 1900 || formValues.year > new Date().getFullYear() + 1) {
      errors.year = 'Invalid year';
    }
    if (formValues.currentMileage < 0) errors.currentMileage = 'Mileage cannot be negative';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormValues(prev => ({
        ...prev,
        [name]: name === 'year' || name === 'currentMileage' ? parseInt(value as string) || 0 : value,
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (field: string) => (date: Moment | null) => {
    setFormValues(prev => ({
      ...prev,
      [field]: date ? date.format('YYYY-MM-DD') : null,
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const vehicleData = {
        ...formValues,
        year: parseInt(formValues.year.toString()),
        currentMileage: parseInt(formValues.currentMileage.toString()),
        registrationExpiry: moment(formValues.registrationExpiry).format('YYYY-MM-DD'),
        lastServiceDate: moment(formValues.lastServiceDate).format('YYYY-MM-DD'),
      };

      if (editingVehicle) {
        await axios.put(
          getApiUrl(`${API_CONFIG.ENDPOINTS.VEHICLES}/${editingVehicle.id}`),
          vehicleData
        );
        setSnackbar({
          open: true,
          message: 'Vehicle updated successfully',
          severity: 'success',
        });
      } else {
        const { id, ...newVehicleData } = vehicleData;
        await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES), newVehicleData);
        setSnackbar({
          open: true,
          message: 'Vehicle added successfully',
          severity: 'success',
        });
      }
      
      await fetchVehicles();
      handleClose();
    } catch (error) {
      console.error('Failed to save vehicle:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save vehicle',
        severity: 'error',
      });
    }
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const renderVehicleForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Make"
          name="make"
          fullWidth
          required
          value={formValues.make}
          onChange={handleInputChange}
          error={!!formErrors.make}
          helperText={formErrors.make}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Model"
          name="model"
          fullWidth
          required
          value={formValues.model}
          onChange={handleInputChange}
          error={!!formErrors.model}
          helperText={formErrors.model}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Year"
          name="year"
          type="number"
          fullWidth
          required
          value={formValues.year}
          onChange={handleInputChange}
          error={!!formErrors.year}
          helperText={formErrors.year}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="VIN"
          name="vin"
          fullWidth
          required
          value={formValues.vin}
          onChange={handleInputChange}
          error={!!formErrors.vin}
          helperText={formErrors.vin}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="License Plate"
          name="licensePlate"
          fullWidth
          required
          value={formValues.licensePlate}
          onChange={handleInputChange}
          error={!!formErrors.licensePlate}
          helperText={formErrors.licensePlate}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={formValues.status}
            onChange={handleSelectChange}
            label="Status"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Current Mileage"
          name="currentMileage"
          type="number"
          fullWidth
          value={formValues.currentMileage}
          onChange={handleInputChange}
          error={!!formErrors.currentMileage}
          helperText={formErrors.currentMileage}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Fuel Type</InputLabel>
          <Select
            name="fuelType"
            value={formValues.fuelType}
            onChange={handleSelectChange}
            label="Fuel Type"
          >
            <MenuItem value="gasoline">Gasoline</MenuItem>
            <MenuItem value="diesel">Diesel</MenuItem>
            <MenuItem value="electric">Electric</MenuItem>
            <MenuItem value="hybrid">Hybrid</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <DatePicker
          label="Registration Expiry"
          value={formValues.registrationExpiry ? moment(formValues.registrationExpiry) : null}
          onChange={handleDateChange('registrationExpiry')}
          slotProps={{ textField: { fullWidth: true } }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <DatePicker
          label="Last Service Date"
          value={formValues.lastServiceDate ? moment(formValues.lastServiceDate) : null}
          onChange={handleDateChange('lastServiceDate')}
          slotProps={{ textField: { fullWidth: true } }}
        />
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<DirectionsCar />} label="Vehicles" />
          <Tab icon={<LocalGasStation />} label="Fuel" />
          <Tab icon={<Build />} label="Maintenance" />
          <Tab icon={<History />} label="History" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h5">Vehicle List</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            sx={{
              backgroundColor: '#2563EB !important',
              color: '#FFFFFF !important',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              padding: '10px 20px',
              textTransform: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: '#1D4ED8 !important',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            Add Vehicle
          </Button>
        </Box>

        <Grid container spacing={2}>
          {vehicles.map((vehicle) => (
            <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">
                        {vehicle.make} {vehicle.model} {vehicle.year}
                      </Typography>
                      {vehicle.documents && vehicle.documents.length > 0 && (
                        <Chip
                          icon={<Description />}
                          label={vehicle.documents.length}
                          size="small"
                          color="primary"
                          variant="outlined"
                          title={`${vehicle.documents.length} document${vehicle.documents.length > 1 ? 's' : ''} attached`}
                        />
                      )}
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleEdit(vehicle)}>
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteConfirm(vehicle.id || vehicle._id || '')}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography color="textSecondary" gutterBottom>
                    License Plate: {vehicle.licensePlate}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    VIN: {vehicle.vin}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={vehicle.status}
                      color={getStatusColor(vehicle.status)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${vehicle.currentMileage.toLocaleString()} miles`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <FuelManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Maintenance />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography>Vehicle History (Coming Soon)</Typography>
      </TabPanel>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isModalOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {renderVehicleForm()}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClose}
            sx={{
              color: '#6B7280',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#F3F4F6',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              backgroundColor: '#2563EB !important',
              color: '#FFFFFF !important',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              padding: '8px 16px',
              textTransform: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: '#1D4ED8 !important',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            {editingVehicle ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this vehicle?</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{
              color: '#6B7280',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#F3F4F6',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained"
            sx={{
              backgroundColor: '#EF4444 !important',
              color: '#FFFFFF !important',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              padding: '8px 16px',
              textTransform: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: '#DC2626 !important',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VehicleManagement; 