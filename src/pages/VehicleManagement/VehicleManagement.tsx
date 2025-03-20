import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
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
  FormHelperText,
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
} from '@mui/icons-material';
import { Vehicle } from '../../types';
import FuelManagement from '../../components/FuelManagement/FuelManagement';
import Maintenance from '../../components/Maintenance/Maintenance';

// Mock data (replace with actual API calls)
const mockVehicles: Vehicle[] = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    vin: '1HGCM82633A123456',
    licensePlate: 'ABC-1234',
    registrationExpiry: '2024-12-31',
    status: 'active',
    fuelType: 'gasoline',
    currentMileage: 15000,
    lastServiceDate: '2024-02-15',
  },
  {
    id: '2',
    make: 'Ford',
    model: 'F-150',
    year: 2021,
    vin: '1FTFW1ET7DFA12345',
    licensePlate: 'XYZ-5678',
    registrationExpiry: '2024-10-15',
    status: 'active',
    fuelType: 'diesel',
    currentMileage: 25000,
    lastServiceDate: '2024-01-20',
  },
  {
    id: '3',
    make: 'Honda',
    model: 'Civic',
    year: 2023,
    vin: '2HGFC2F57LH123456',
    licensePlate: 'DEF-9012',
    registrationExpiry: '2025-03-22',
    status: 'maintenance',
    fuelType: 'gasoline',
    currentMileage: 8000,
    lastServiceDate: '2024-03-05',
  },
];

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
  registrationExpiry: new Date().toISOString().split('T')[0],
  status: 'active',
  fuelType: 'gasoline',
  currentMileage: 0,
  lastServiceDate: new Date().toISOString().split('T')[0],
};

const VehicleManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle>(emptyVehicle);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });
  
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

  const handleAddVehicle = () => {
    setCurrentVehicle(emptyVehicle);
    setFormErrors({});
    setOpenAddDialog(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setCurrentVehicle({ ...vehicle });
    setFormErrors({});
    setOpenEditDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
  };

  const handleDeleteConfirm = (id: string) => {
    setVehicleToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteVehicle = () => {
    setVehicles(vehicles.filter(vehicle => vehicle.id !== vehicleToDelete));
    setDeleteConfirmOpen(false);
    setSnackbar({
      open: true,
      message: 'Vehicle deleted successfully',
      severity: 'success',
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentVehicle.make.trim()) errors.make = 'Make is required';
    if (!currentVehicle.model.trim()) errors.model = 'Model is required';
    if (!currentVehicle.vin.trim()) errors.vin = 'VIN is required';
    if (!currentVehicle.licensePlate.trim()) errors.licensePlate = 'License plate is required';
    if (currentVehicle.year < 1900 || currentVehicle.year > new Date().getFullYear() + 1) {
      errors.year = 'Invalid year';
    }
    if (currentVehicle.currentMileage < 0) errors.currentMileage = 'Mileage cannot be negative';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentVehicle({
        ...currentVehicle,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentVehicle({
      ...currentVehicle,
      [name]: value,
    });
  };

  const handleSaveVehicle = () => {
    if (!validateForm()) return;
    
    if (openAddDialog) {
      // Add new vehicle
      const newVehicle = {
        ...currentVehicle,
        id: Date.now().toString(), // Generate a unique ID (in a real app, this would come from the backend)
      };
      setVehicles([...vehicles, newVehicle]);
      setSnackbar({
        open: true,
        message: 'Vehicle added successfully',
        severity: 'success',
      });
    } else {
      // Update existing vehicle
      setVehicles(vehicles.map(vehicle => 
        vehicle.id === currentVehicle.id ? currentVehicle : vehicle
      ));
      setSnackbar({
        open: true,
        message: 'Vehicle updated successfully',
        severity: 'success',
      });
    }
    
    handleCloseDialog();
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderVehicleForm = () => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Make"
            name="make"
            value={currentVehicle.make}
            onChange={handleInputChange}
            error={!!formErrors.make}
            helperText={formErrors.make}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Model"
            name="model"
            value={currentVehicle.model}
            onChange={handleInputChange}
            error={!!formErrors.model}
            helperText={formErrors.model}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Year"
            name="year"
            type="number"
            value={currentVehicle.year}
            onChange={handleInputChange}
            error={!!formErrors.year}
            helperText={formErrors.year}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="VIN"
            name="vin"
            value={currentVehicle.vin}
            onChange={handleInputChange}
            error={!!formErrors.vin}
            helperText={formErrors.vin}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="License Plate"
            name="licensePlate"
            value={currentVehicle.licensePlate}
            onChange={handleInputChange}
            error={!!formErrors.licensePlate}
            helperText={formErrors.licensePlate}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Registration Expiry Date"
            name="registrationExpiry"
            type="date"
            value={currentVehicle.registrationExpiry}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={currentVehicle.status}
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
          <FormControl fullWidth required>
            <InputLabel>Fuel Type</InputLabel>
            <Select
              name="fuelType"
              value={currentVehicle.fuelType}
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
          <TextField
            fullWidth
            label="Current Mileage"
            name="currentMileage"
            type="number"
            value={currentVehicle.currentMileage}
            onChange={handleInputChange}
            error={!!formErrors.currentMileage}
            helperText={formErrors.currentMileage}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Service Date"
            name="lastServiceDate"
            type="date"
            value={currentVehicle.lastServiceDate}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
      </Grid>
    </>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Vehicle Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleAddVehicle}
        >
          Add Vehicle
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab icon={<DirectionsCar />} label="Vehicles" />
          <Tab icon={<LocalGasStation />} label="Fuel Management" />
          <Tab icon={<Build />} label="Maintenance" />
          <Tab icon={<History />} label="Service History" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {vehicles.map((vehicle) => (
              <Grid item xs={12} md={6} lg={4} key={vehicle.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" component="div">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => handleEditVehicle(vehicle)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteConfirm(vehicle.id)}>
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                    <Chip
                      label={vehicle.status}
                      color={getStatusColor(vehicle.status)}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    <Typography color="textSecondary" gutterBottom>
                      License Plate: {vehicle.licensePlate}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      VIN: {vehicle.vin}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Mileage: {vehicle.currentMileage.toLocaleString()} miles
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Fuel Type: {vehicle.fuelType}
                    </Typography>
                    <Typography color="textSecondary">
                      Last Service: {new Date(vehicle.lastServiceDate).toLocaleDateString()}
                    </Typography>
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
          {/* Service History Content */}
          <Typography variant="h6">Service History</Typography>
          {/* Add service history table */}
        </TabPanel>
      </Paper>

      {/* Add Vehicle Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Vehicle</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderVehicleForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveVehicle} variant="contained" color="primary">
            Add Vehicle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Edit Vehicle</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderVehicleForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveVehicle} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this vehicle? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteVehicle} color="error" variant="contained">
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
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VehicleManagement; 